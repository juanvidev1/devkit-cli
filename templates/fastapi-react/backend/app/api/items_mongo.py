from fastapi import APIRouter, HTTPException
from typing import List
from ..db_mongo import db
from ..models.items_mongo import get_items_collection

router = APIRouter(prefix="/items")

@router.get("/", response_model=List[dict])
async def list_items():
    items_col = get_items_collection(db)
    docs = await items_col.find().to_list(length=100)
    return docs

@router.post("/", response_model=dict)
async def create_item(item: dict):
    items_col = get_items_collection(db)
    result = await items_col.insert_one(item)
    if not result.inserted_id:
        raise HTTPException(status_code=500, detail="Insert failed")
    return {"id": str(result.inserted_id)}
