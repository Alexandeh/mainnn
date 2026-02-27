import json
import os
from typing import Optional
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from app.config import settings, YOUTUBE_SCOPES, TOKEN_FILE


def get_auth_url() -> str:
    """Genera la URL de autorización de Google OAuth2."""
    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "redirect_uris": [settings.google_redirect_uri],
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        },
        scopes=YOUTUBE_SCOPES,
        redirect_uri=settings.google_redirect_uri,
    )
    auth_url, _ = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",
    )
    return auth_url


def exchange_code_for_token(code: str) -> dict:
    """Intercambia el código de autorización por tokens."""
    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "redirect_uris": [settings.google_redirect_uri],
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        },
        scopes=YOUTUBE_SCOPES,
        redirect_uri=settings.google_redirect_uri,
    )
    flow.fetch_token(code=code)
    credentials = flow.credentials

    # Guardar tokens
    token_data = {
        "token": credentials.token,
        "refresh_token": credentials.refresh_token,
        "token_uri": credentials.token_uri,
        "client_id": credentials.client_id,
        "client_secret": credentials.client_secret,
        "scopes": list(credentials.scopes) if credentials.scopes else YOUTUBE_SCOPES,
    }
    with open(TOKEN_FILE, "w") as f:
        json.dump(token_data, f)

    return {"status": "authenticated", "message": "Autenticación exitosa"}


def get_credentials() -> Optional[Credentials]:
    """Obtiene las credenciales guardadas, refrescándolas si es necesario."""
    if not os.path.exists(TOKEN_FILE):
        return None

    with open(TOKEN_FILE, "r") as f:
        token_data = json.load(f)

    credentials = Credentials(
        token=token_data.get("token"),
        refresh_token=token_data.get("refresh_token"),
        token_uri=token_data.get("token_uri", "https://oauth2.googleapis.com/token"),
        client_id=token_data.get("client_id", settings.google_client_id),
        client_secret=token_data.get("client_secret", settings.google_client_secret),
        scopes=token_data.get("scopes", YOUTUBE_SCOPES),
    )

    # Refrescar si expiró
    if credentials.expired and credentials.refresh_token:
        credentials.refresh(Request())
        token_data["token"] = credentials.token
        with open(TOKEN_FILE, "w") as f:
            json.dump(token_data, f)

    return credentials


def get_youtube_service(credentials: Credentials):
    """Crea el cliente de YouTube Data API."""
    return build("youtube", "v3", credentials=credentials)


def get_analytics_service(credentials: Credentials):
    """Crea el cliente de YouTube Analytics API."""
    return build("youtubeAnalytics", "v2", credentials=credentials)


def is_authenticated() -> bool:
    """Verifica si hay una sesión autenticada válida."""
    creds = get_credentials()
    return creds is not None and (not creds.expired or creds.refresh_token is not None)
