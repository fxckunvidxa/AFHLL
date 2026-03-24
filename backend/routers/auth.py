from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

import auth
from schemas import Token, UserCreate, UserRead
from db import SessionDep
from models import User

router = APIRouter(tags=["Authentication"])


@router.post("/register", response_model=UserRead)
async def register(user_data: UserCreate, db: SessionDep):
    new_user = User(
        **user_data.model_dump(exclude={"password"}),
        hashed_passwd=auth.hash_password(user_data.password),
    )

    db.add(new_user)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=400, detail="User with this email already exists"
        )

    await db.refresh(new_user)
    return new_user


@router.post("/login", response_model=Token)
async def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()], db: SessionDep
):
    user = (
        await db.execute(select(User).where(User.email == form_data.username))
    ).scalar_one_or_none()

    if not user or not auth.verify_password(form_data.password, user.hashed_passwd):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = auth.create_access_token({"sub": user.email})

    return Token(access_token=token, token_type="bearer")
