from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    mongodb_uri: str = "mongodb://localhost:27017"
    db_name: str = "quick-gesture"
    model_version: str = "v1.0"
    rate_limit: str = "30/minute"
    min_avg_confidence: float = 0.4
    min_frame_variance: float = 0.0001
    min_visibility_ratio: float = 0.6
    required_frames: int = 30

    class Config:
        env_file = ".env"


settings = Settings()
