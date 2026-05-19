from fastapi import APIRouter, HTTPException
from fastapi.concurrency import run_in_threadpool
from sqlalchemy import update, select, or_, delete
from sqlalchemy.orm import selectinload
from datetime import datetime, timedelta, timezone

from schemas import ItemRead, ItemCreate
from auth import UserDep
from db import SessionDep
from models import Item, ItemImage, TradeType
from routers.media import UPLOAD_DIR, process_and_save_image

router = APIRouter(prefix="/items", tags=["Items"])

# 30 минут на бронирование
RESERVE_MINUTES = 30


@router.post("/", response_model=ItemRead)
async def create_item(data: ItemCreate, user: UserDep, db: SessionDep):
    new_item = Item(
        **data.model_dump(exclude={"image_ids", "main_image_id"}), owner_id=user.id
    )
    db.add(new_item)
    await db.flush()

    for img_id in data.image_ids:
        res = await db.execute(
            select(ItemImage).where(
                ItemImage.id == img_id, ItemImage.owner_id == user.id
            )
        )
        img = res.scalar_one_or_none()

        if img:
            img.item_id = new_item.id
            if img.id == data.main_image_id:
                img.is_main = True
                full_path = UPLOAD_DIR / img.filename
                with open(full_path, "rb") as f:
                    await run_in_threadpool(
                        process_and_save_image, f, img.filename, is_thumb=True
                    )

    await db.commit()
    await db.refresh(new_item)

    # Загружаем изображения
    result = await db.execute(
        select(Item).options(selectinload(Item.images)).where(Item.id == new_item.id)
    )
    return result.scalar_one()


@router.patch("/{item_id}/set-main-image")
async def change_main_image(item_id: int, image_id: int, user: UserDep, db: SessionDep):
    await db.execute(
        update(ItemImage)
        .where(ItemImage.item_id == item_id, ItemImage.owner_id == user.id)
        .values(is_main=False)
    )

    res = await db.execute(
        select(ItemImage).where(
            ItemImage.id == image_id,
            ItemImage.owner_id == user.id,
            ItemImage.item_id == item_id,
        )
    )
    img = res.scalar_one_or_none()

    if not img:
        raise HTTPException(status_code=404)

    img.is_main = True

    thumb_path = UPLOAD_DIR / f"thumb_{img.filename}"
    if not thumb_path.exists():
        full_path = UPLOAD_DIR / img.filename
        if not full_path.exists():
            raise HTTPException(status_code=500)

        with open(full_path, "rb") as f:
            await run_in_threadpool(
                process_and_save_image, f, img.filename, is_thumb=True
            )

    await db.commit()
    return {"status": "ok", "main_image_id": image_id}


@router.get("/", response_model=list[ItemRead])
async def get_items(db: SessionDep):
    query = select(Item).options(selectinload(Item.images)).order_by(Item.id.desc())
    res = await db.execute(query)
    return res.scalars().all()


@router.get("/available", response_model=list[ItemRead])
async def get_available_items(db: SessionDep, trade_type: TradeType = None):
    """Доступные вещи (не забронированные и с истекшей бронью)"""

    query = (
        select(Item)
        .options(selectinload(Item.images))
        .where(
            Item.is_available == True,
        )
    )

    if trade_type:
        query = query.where(Item.trade_type == trade_type)

    query = query.order_by(Item.id.desc())
    res = await db.execute(query)
    return res.scalars().all()


@router.get("/user/my", response_model=list[ItemRead])
async def get_my_items(user: UserDep, db: SessionDep):
    query = (
        select(Item)
        .options(selectinload(Item.images))
        .where(Item.owner_id == user.id)
        .order_by(Item.id.desc())
    )
    res = await db.execute(query)
    return res.scalars().all()


@router.get("/{item_id}", response_model=ItemRead)
async def get_item(item_id: int, db: SessionDep):
    query = select(Item).options(selectinload(Item.images)).where(Item.id == item_id)
    res = await db.execute(query)
    item = res.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@router.post("/{item_id}/reserve")
async def reserve_item(item_id: int, user: UserDep, db: SessionDep):
    """Забронировать вещь на 30 минут"""
    item = await db.get(Item, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Вещь не найдена")

    if item.owner_id == user.id:
        raise HTTPException(status_code=400, detail="Нельзя забронировать свою вещь")

    now = datetime.now(timezone.utc)

    reserved_until = item.reserved_until
    if reserved_until:
        # Если из БД пришло naive - считаем что это UTC
        reserved_until = reserved_until.replace(tzinfo=timezone.utc)

    # Проверяем, не забронирована ли вещь (и не истекла ли бронь)
    if item.reserved_by_id is not None and reserved_until and reserved_until > now:
        raise HTTPException(status_code=400, detail="Вещь уже забронирована")

    # Бронируем на 30 минут
    item.reserved_by_id = user.id
    item.reserved_until = now + timedelta(minutes=RESERVE_MINUTES)

    await db.commit()

    return {
        "status": "reserved",
        "reserved_until": item.reserved_until.isoformat(),
        "message": f"Вещь забронирована до {item.reserved_until.strftime('%H:%M:%S')}",
    }


@router.get("/{item_id}/contacts")
async def get_item_contacts(item_id: int, user: UserDep, db: SessionDep):
    """
    Получить контакты владельца.
    Только если текущий пользователь забронировал эту вещь.
    """
    result = await db.execute(
        select(Item)
        .options(selectinload(Item.owner))  # Подгружаем owner
        .where(Item.id == item_id)
    )
    item = result.scalar_one_or_none()

    if not item:
        raise HTTPException(status_code=404, detail="Вещь не найдена")

    now = datetime.now(timezone.utc)

    reserved_until = item.reserved_until
    if reserved_until and reserved_until.tzinfo is None:
        # Если из БД пришло naive - считаем что это UTC
        reserved_until = reserved_until.replace(tzinfo=timezone.utc)

    # Проверяем, что текущий пользователь забронировал вещь и бронь не истекла
    if item.reserved_by_id != user.id:
        raise HTTPException(status_code=403, detail="Вы не забронировали эту вещь")

    if reserved_until and reserved_until < now:
        raise HTTPException(status_code=400, detail="Время бронирования истекло")

    return {
        "contacts": item.contacts,
        "owner_name": item.owner.name or item.owner.email,
    }


@router.post("/{item_id}/cancel-reserve")
async def cancel_reserve(item_id: int, user: UserDep, db: SessionDep):
    """Отменить бронирование (может тот, кто забронировал, или владелец)"""
    item = await db.get(Item, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Вещь не найдена")

    # Проверяем, что пользователь либо владелец, либо тот, кто забронировал
    if item.owner_id != user.id and item.reserved_by_id != user.id:
        raise HTTPException(status_code=403, detail="Нет прав")

    item.reserved_by_id = None
    item.reserved_until = None

    await db.commit()
    return {"status": "cancelled"}


@router.post("/{item_id}/confirm-exchange")
async def confirm_exchange(item_id: int, user: UserDep, db: SessionDep):
    """
    Подтвердить обмен/аренду (только владелец).
    После подтверждения вещь становится недоступной.
    """
    item = await db.get(Item, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Вещь не найдена")

    if item.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Только владелец может подтвердить")

    item.is_available = False
    item.reserved_by_id = None
    item.reserved_until = None

    await db.commit()
    return {"status": "confirmed"}


@router.patch("/{item_id}")
async def update_item(
    item_id: int,
    data: dict,  # { "description": "...", "contacts": "..." }
    user: UserDep,
    db: SessionDep,
):
    """Обновить описание и/или контакты (только владелец)"""
    item = await db.get(Item, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Вещь не найдена")

    if item.owner_id != user.id:
        raise HTTPException(
            status_code=403, detail="Только владелец может редактировать"
        )

    # Разрешаем обновлять только определённые поля
    allowed_fields = {"description", "contacts"}
    for field, value in data.items():
        if field in allowed_fields and value is not None:
            setattr(item, field, value)

    await db.commit()
    await db.refresh(item)

    # Подгружаем изображения для ответа
    result = await db.execute(
        select(Item).options(selectinload(Item.images)).where(Item.id == item_id)
    )
    return result.scalar_one()


@router.delete("/{item_id}")
async def delete_item(item_id: int, user: UserDep, db: SessionDep):
    """Удалить объявление (только владелец). Удаляет также связанные изображения из БД"""
    item = await db.get(Item, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Вещь не найдена")

    if item.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Только владелец может удалить")

    # Удаляем записи об изображениях (файлы на диске останутся, но это не страшно для учебного проекта)
    await db.execute(delete(ItemImage).where(ItemImage.item_id == item_id))

    # Удаляем само объявление
    await db.delete(item)
    await db.commit()

    return {"status": "deleted"}
