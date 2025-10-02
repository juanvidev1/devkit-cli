from fastapi import APIRouter
from typing import List

from ..db import database
from ..models.items import items as items_table

router = APIRouter(prefix="/items")


@router.get("/", response_model=List[dict])
async def list_items():
    query = items_table.select()
    rows = await database.fetch_all(query)
    return [dict(r) for r in rows]


@router.post("/", response_model=dict)
async def create_item(item: dict):
    result = await database.execute(items_table.insert().values(**item))
    return {"id": result}
