from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

client: AsyncIOMotorClient = None


async def connect():
    global client
    client = AsyncIOMotorClient(settings.mongodb_uri)


async def disconnect():
    global client
    if client:
        client.close()


def get_db():
    return client[settings.db_name]
