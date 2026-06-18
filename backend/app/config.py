from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    environment: str = "development"
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/kash"

    # Frontend URL used for CORS in production.
    # In dev, all origins are allowed.
    frontend_url: str = "https://kash.vercel.app"

    # Supabase
    supabase_url: str = "http://127.0.0.1:54321"
    supabase_service_role_key: str = ""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
