from datetime import datetime
import enum
from sqlalchemy import ForeignKey, Enum as SQLEnum, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db import Base


class TradeType(enum.Enum):
    RENT = "rent"
    EXCHANGE = "exchange"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(unique=True)
    name: Mapped[str | None]
    room: Mapped[str | None]
    hashed_passwd: Mapped[str]
    totp_secret: Mapped[str | None]

    items: Mapped[list["Item"]] = relationship(back_populates="owner")


class Item(Base):
    __tablename__ = "items"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str]
    description: Mapped[str | None]
    trade_type: Mapped[TradeType] = mapped_column(SQLEnum(TradeType))
    is_available: Mapped[bool] = mapped_column(default=True)

    reserved_by_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    reserved_until: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    
    reserved_by: Mapped["User"] = relationship(foreign_keys=[reserved_by_id])

    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"))

    owner: Mapped[User] = relationship(back_populates="items")
    images: Mapped[list["ItemImage"]] = relationship(
        back_populates="item", cascade="all, delete-orphan"
    )


class ItemImage(Base):
    __tablename__ = "item_images"

    id: Mapped[int] = mapped_column(primary_key=True)
    is_main: Mapped[bool] = mapped_column(default=False)
    filename: Mapped[str]

    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    item_id: Mapped[int | None] = mapped_column(ForeignKey("items.id"))

    item: Mapped[Item] = relationship(back_populates="images")

    @property
    def url(self) -> str:
        return f"http://localhost:8000/static/uploads/{self.filename}"

    @property
    def thumb_url(self) -> str:
        return f"http://localhost:8000/static/uploads/thumb_{self.filename}"