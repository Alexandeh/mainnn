from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:8000/auth/callback"
    youtube_channel_id: str = ""
    youtube_channel_handle: str = "@AIrtVids"
    openai_api_key: str = ""
    secret_key: str = "dev-secret-key-change-in-production"
    cors_origins: str = "http://localhost:3000"

    class Config:
        env_file = ".env"
        case_sensitive = False

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]


settings = Settings()

# YouTube OAuth2 scopes - necesitamos ambas APIs
YOUTUBE_SCOPES = [
    "https://www.googleapis.com/auth/youtube.readonly",
    "https://www.googleapis.com/auth/yt-analytics.readonly",
    "https://www.googleapis.com/auth/yt-analytics-monetary.readonly",
]

# Token storage path
TOKEN_FILE = os.path.join(os.path.dirname(__file__), "..", "token.json")
