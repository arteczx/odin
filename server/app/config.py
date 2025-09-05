from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql://odin:odin123@localhost/odin_db"
    
    # Redis for Celery
    redis_url: str = "redis://localhost:6379/0"
    
    # File storage
    upload_dir: str = "/tmp/odin/uploads"
    work_dir: str = "/tmp/odin/work"
    
    # Security
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # External APIs
    shodan_api_key: Optional[str] = None
    virustotal_api_key: Optional[str] = None
    
    # Analysis settings
    max_file_size: int = 500 * 1024 * 1024  # 500MB
    supported_extensions: list = [".bin", ".img", ".hex", ".rom", ".fw"]
    
    # Celery settings
    celery_broker_url: str = "redis://localhost:6379/0"
    celery_result_backend: str = "redis://localhost:6379/0"
    
    class Config:
        env_file = ".env"

settings = Settings()

# Ensure directories exist
os.makedirs(settings.upload_dir, exist_ok=True)
os.makedirs(settings.work_dir, exist_ok=True)
