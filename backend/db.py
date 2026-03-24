from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from typing import Annotated
from fastapi import Depends

from config import settings

engine = create_async_engine(settings.DATABASE_URL, echo=True)

class Base(DeclarativeBase):
    pass

async def get_session():
    async with AsyncSession(engine, expire_on_commit=False) as session:
        yield session

SessionDep = Annotated[AsyncSession, Depends(get_session)]