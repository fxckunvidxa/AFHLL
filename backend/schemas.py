from pydantic import BaseModel, EmailStr, ConfigDict
from models import TradeType

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