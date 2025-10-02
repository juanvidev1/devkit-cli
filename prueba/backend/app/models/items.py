from sqlalchemy import Table, Column, Integer, String
from ..db import metadata

items = Table(
    "items",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("name", String(255), nullable=False),
    Column("description", String(1024), nullable=True),
)
