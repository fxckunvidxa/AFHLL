import uuid
import os
import io
from pathlib import Path
from PIL import Image, ImageOps
from fastapi import APIRouter, UploadFile, HTTPException
from fastapi.concurrency import run_in_threadpool

from db import SessionDep
from auth import UserDep
from models import ItemImage

router = APIRouter(prefix="/media", tags=["Media"])

MAX_FILE_SIZE = 20 * 1024 * 1024
MAX_IMAGE_SIZE = (1920, 1080)
THUMB_SIZE = (300, 300)

UPLOAD_DIR = Path("static/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def process_and_save_image(file_bytes, filename: str, is_thumb: bool = False):
    target_path = UPLOAD_DIR / (f"thumb_{filename}" if is_thumb else filename)

    with Image.open(file_bytes) as img:
        img = ImageOps.exif_transpose(img)
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")

        size = THUMB_SIZE if is_thumb else MAX_IMAGE_SIZE
        img.thumbnail(size)
        quality = 70 if is_thumb else 85
        img.save(target_path, "JPEG", optimize=True, quality=quality)


@router.post("/upload", response_model=list[int])
async def upload_images(user: UserDep, db: SessionDep, files: list[UploadFile]):
    image_ids = []

    for file in files:
        if file.content_type not in ["image/jpeg", "image/png"]:
            raise HTTPException(
                status_code=400,
                detail=f"{file.filename}: invalid format",
            )

        file.file.seek(0, os.SEEK_END)
        file_size = file.file.tell()
        file.file.seek(0)

        if file_size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"{file.filename}: file is too large",
            )

        try:
            file_content = io.BytesIO(await file.read())
            filename = f"{uuid.uuid4()}.jpg"
            await run_in_threadpool(
                process_and_save_image, file_content, filename, is_thumb=False
            )

            new_img = ItemImage(filename=filename, owner_id=user.id)
            db.add(new_img)
            await db.flush()
            image_ids.append(new_img.id)

        except Exception as e:
            print(f"{file.filename}: {e}")
            continue

    await db.commit()
    return image_ids
