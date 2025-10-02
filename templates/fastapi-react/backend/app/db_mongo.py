import os
from motor.motor_asyncio import AsyncIOMotorClient

# Read MongoDB URL from environment variable DATABASE_URL
MONGO_URL = os.getenv("DATABASE_URL", "mongodb://user:password@localhost:27017/mydb")

mongo_client = AsyncIOMotorClient(MONGO_URL)
db = mongo_client.get_default_database()

async def connect():
    # Motor connects lazily, but you can ping to check
    await db.command("ping")

async def disconnect():
    mongo_client.close()

# Example: get collection
# def get_collection(name):
#     return db[name]
