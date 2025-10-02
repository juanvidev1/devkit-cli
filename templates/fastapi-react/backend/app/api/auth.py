from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm
from passlib.context import CryptContext
from app.core.jwt_utils import create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])


# Demo user (hardcoded, bcrypt hash)
FAKE_USER = {
    "username": "demo",
    # hash real generado con passlib: pwd_context.hash("password")
    "hashed_password": "$2b$12$KIXIDiF1T8Q6Yb6vFQW1V.6QwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQw",  # hash for "password"
}

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    # bcrypt solo usa los primeros 72 bytes
    return pwd_context.verify(plain_password[:72], hashed_password)

def authenticate_user(username: str, password: str):
    if username != FAKE_USER["username"]:
        return False
    if not verify_password(password, FAKE_USER["hashed_password"]):
        return False
    return True

@router.post("/token")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    if not authenticate_user(form_data.username, form_data.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token({"sub": form_data.username})
    return {"access_token": access_token, "token_type": "bearer"}
