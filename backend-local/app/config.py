import uuid
from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

from app.rules import Thresholds

# Fixed project namespace for UUIDv5 (never change: would break stability).
UUID_NAMESPACE = uuid.UUID("6f9619ff-8b86-d011-b42d-00c04fc964ff")

COUNTRY_THRESHOLDS: dict[str, Thresholds] = {
    "br": Thresholds(ideal_temperature=29.0, ideal_humidity=55.0),
    "ec": Thresholds(ideal_temperature=31.0, ideal_humidity=60.0),
    "co": Thresholds(ideal_temperature=26.0, ideal_humidity=80.0),
}


def thresholds_for(country: str) -> Thresholds:
    return COUNTRY_THRESHOLDS[country]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    country: str = "br"
    api_key: str = "changeme"
    seed_demo: bool = False
    database_url: str = "sqlite:///./data/backend-local.db"
    mqtt_broker: str = "localhost"
    mqtt_port: int = 1883
    mqtt_client_id: str = "backend-local-br"
    expiry_check_interval_s: int = 3600
    smtp_host: str = "localhost"
    smtp_port: int = 1025
    smtp_user: str = ""
    smtp_pass: str = ""
    smtp_from: str = "alertes@futurekawa.local"
    smtp_starttls: bool = False
    alert_recipient: str = "responsable-br@futurekawa.local"

    @field_validator("country")
    @classmethod
    def _known_country(cls, value: str) -> str:
        # Fail fast with a clear message instead of a KeyError crash-loop in the lifespan.
        normalized = value.lower()
        if normalized not in COUNTRY_THRESHOLDS:
            raise ValueError(
                f"Unknown COUNTRY '{value}', expected one of {sorted(COUNTRY_THRESHOLDS)}"
            )
        return normalized


@lru_cache
def get_settings() -> Settings:
    return Settings()
