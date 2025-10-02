import os
from typing import Optional

from sqlalchemy import MetaData
from databases import Database
from sqlalchemy import create_engine

# Read database URL from environment variable DATABASE_URL; provide sensible defaults
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./data.db")

# databases Database (async) and SQLAlchemy engine
database = Database(DATABASE_URL)
engine = create_engine(DATABASE_URL.replace("+aiosqlite", ""))
metadata = MetaData()


async def connect():
    await database.connect()


async def disconnect():
    await database.disconnect()


async def create_tables():
    # Create tables using SQLAlchemy engine synchronously
    metadata.create_all(engine)


def get_db():
    return database
