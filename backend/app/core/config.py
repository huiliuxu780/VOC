from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="VOC_")

    app_name: str = "VOC Labeling Platform"
    db_url: str = "sqlite:///./voc.db"
    redis_url: str = "redis://localhost:6379/0"


settings = Settings()
