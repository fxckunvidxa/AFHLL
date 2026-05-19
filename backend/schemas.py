from pydantic import BaseModel, EmailStr, ConfigDict
from models import TradeType
from datetime import datetime

class ItemBase(BaseModel):
    title: str
    trade_type: TradeType
    description: str | None = None
    is_available: bool = True


class ItemCreate(ItemBase):
    image_ids: list[int]
    main_image_id: int
    contacts: str | None = None


class ItemRead(ItemBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    owner_id: int
    reserved_by_id: int | None = None
    reserved_until: datetime | None = None
    contacts: str | None = None  # только для владельца, но покажет через отдельный эндпоинт
    images: list["ImageRead"] = []


class UserBase(BaseModel):
    email: EmailStr
    name: str | None = None
    room: str | None = None


class UserCreate(UserBase):
    password: str


class UserRead(UserBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class Token(BaseModel):
    access_token: str
    token_type: str


class ImageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    url: str
    thumb_url: str | None = None
    is_main: bool


class TOTPSetupResponse(BaseModel):
    secret: str
    qr_url: str  # data URL с QR-кодом


class TOTPVerifyRequest(BaseModel):
    code: str


class TOTPStatusResponse(BaseModel):
    enabled: bool


class LoginWith2FARequest(BaseModel):
    email: str
    password: str
    code: str | None = None