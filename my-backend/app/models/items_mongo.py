from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Any

# Ejemplo de acceso a la colección de items en MongoDB

def get_items_collection(db: AsyncIOMotorDatabase) -> Any:
    return db["items"]

# Puedes definir funciones CRUD usando la colección de MongoDB
# async def create_item(db, item_data):
#     result = await db["items"].insert_one(item_data)
#     return result.inserted_id
