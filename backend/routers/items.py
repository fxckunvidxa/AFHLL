from fastapi import APIRouter, HTTPException
from fastapi.concurrency import run_in_threadpool
from sqlalchemy import update, select, or_
from sqlalchemy.orm import selectinload
from datetime import datetime, timedelta

from schemas import ItemRead, ItemCreate
from auth import UserDep
from db import SessionDep
from models import Item, ItemImage, TradeType
from routers.media import UPLOAD_DIR, process_and_save_image

router = APIRouter(prefix="/items", tags=["Items"])


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
                    process_and_save_image(f, img.filename, is_thumb=True)

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
    now = datetime.utcnow()
    
    query = select(Item).options(selectinload(Item.images)).where(
        Item.is_available == True,
        or_(
            Item.reserved_until == None,
            Item.reserved_until < now
        )
    )
    
    if trade_type:
        query = query.where(Item.trade_type == trade_type)
    
    query = query.order_by(Item.id.desc())
    res = await db.execute(query)
    return res.scalars().all()


@router.get("/user/my", response_model=list[ItemRead])
async def get_my_items(user: UserDep, db: SessionDep):
    query = select(Item).options(selectinload(Item.images)).where(Item.owner_id == user.id).order_by(Item.id.desc())
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
    item = await db.get(Item, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Вещь не найдена")
    
    if item.owner_id == user.id:
        raise HTTPException(status_code=400, detail="Нельзя забронировать свою вещь")
    
    now = datetime.utcnow()
    if item.reserved_until and item.reserved_until > now:
        raise HTTPException(status_code=400, detail="Уже забронировано кем-то другим")

    item.reserved_by_id = user.id
    item.reserved_until = now + timedelta(minutes=20)
    
    await db.commit()
    return {"status": "reserved", "until": item.reserved_until}


@router.post("/{item_id}/cancel-reserve")
async def cancel_reserve(item_id: int, user: UserDep, db: SessionDep):
    item = await db.get(Item, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    if item.reserved_by_id != user.id:
        raise HTTPException(status_code=403, detail="Not your reservation")
    
    item.reserved_by_id = None
    item.reserved_until = None
    
    await db.commit()
    return {"status": "cancelled"}


@router.post("/{item_id}/confirm-exchange")
async def confirm_exchange(item_id: int, user: UserDep, db: SessionDep):
    item = await db.get(Item, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    if item.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Not your item")
    
    if item.trade_type != "exchange":
        raise HTTPException(status_code=400, detail="Only for exchange items")
    
    item.is_available = False
    item.reserved_by_id = None
    item.reserved_until = None
    
    await db.commit()
    return {"status": "exchanged"}