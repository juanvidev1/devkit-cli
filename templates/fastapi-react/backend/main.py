from contextlib import asynccontextmanager
from fastapi import FastAPI

from app.api import hello, items
try:
    from app.api import auth
    _has_auth = True
except ImportError:
    _has_auth = False
from app.db import connect, disconnect, create_tables


@asynccontextmanager
async def lifespan(app: FastAPI):
    # connect to the database and create tables on startup
    await connect()
    try:
        await create_tables()
    except Exception:
        # ignore table creation errors in some DBs/environments
        pass
    try:
        yield
    finally:
        await disconnect()


app = FastAPI(title="FastAPI + React (MVP)", lifespan=lifespan)


app.include_router(hello.router)
app.include_router(items.router)
if _has_auth:
    app.include_router(auth.router)


@app.get("/health")
def health():
    return {"status": "ok"}
