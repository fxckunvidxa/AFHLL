from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
import pyotp
import qrcode
import base64
from io import BytesIO

from auth import UserDep
from db import SessionDep
from models import User
from config import settings
from schemas import TOTPSetupResponse, TOTPVerifyRequest, TOTPStatusResponse

router = APIRouter(prefix="/2fa", tags=["2FA"])

# Временное хранилище для секретов (в реальном проекте используй Redis или кэш)
# Для простоты используем dict, но учти что при перезапуске сервера данные потеряются
temp_secrets = {}


@router.get("/status", response_model=TOTPStatusResponse)
async def get_2fa_status(user: UserDep):
    """Проверить, включена ли 2FA у пользователя"""
    return {"enabled": user.totp_secret is not None}


@router.post("/setup", response_model=TOTPSetupResponse)
async def setup_2fa(user: UserDep, db: SessionDep):
    """Сгенерировать новый TOTP секрет и QR-код (не сохраняет в БД)"""
    if user.totp_secret:
        raise HTTPException(status_code=400, detail="2FA уже включена. Сначала отключите её.")
    
    # Генерируем секрет
    secret = pyotp.random_base32()
    
    # Создаём URI для TOTP
    totp = pyotp.TOTP(secret)
    uri = totp.provisioning_uri(name=user.email, issuer_name=settings.APP_NAME)
    
    # Генерируем QR-код
    qr = qrcode.QRCode(box_size=3, border=2)
    qr.add_data(uri)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Конвертируем в base64 для отправки на фронт
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    qr_base64 = base64.b64encode(buffer.getvalue()).decode()
    qr_url = f"data:image/png;base64,{qr_base64}"
    
    # Временно сохраняем секрет (по user.id)
    temp_secrets[str(user.id)] = secret
    
    return {"secret": secret, "qr_url": qr_url}


@router.post("/verify")
async def verify_2fa(request: TOTPVerifyRequest, user: UserDep, db: SessionDep):
    """Подтвердить код и сохранить секрет в БД"""
    # Получаем временный секрет
    temp_secret = temp_secrets.get(str(user.id))
    if not temp_secret:
        raise HTTPException(status_code=400, detail="Сначала запросите настройку 2FA (/setup)")
    
    totp = pyotp.TOTP(temp_secret)
    if not totp.verify(request.code):
        raise HTTPException(status_code=400, detail="Неверный код")
    
    # Сохраняем секрет в БД
    user.totp_secret = temp_secret
    await db.commit()
    
    # Удаляем из временного хранилища
    temp_secrets.pop(str(user.id), None)
    
    return {"status": "enabled"}


@router.post("/disable")
async def disable_2fa(user: UserDep, db: SessionDep):
    """Отключить 2FA"""
    user.totp_secret = None
    await db.commit()
    return {"status": "disabled"}