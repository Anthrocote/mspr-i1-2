import asyncio
import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI

import app.db as db

logger = logging.getLogger(__name__)


def _run_expiry_check(sender) -> None:
    from app.alerting import check_expired_lots, send_pending

    with db.SessionLocal() as session:
        pending = check_expired_lots(session, datetime.now(timezone.utc))
        session.commit()
    send_pending(sender, pending)  # after commit: off the SQLite write transaction


async def _expiry_check_loop():
    from app.config import get_settings
    from app.mqtt import make_sender

    st = get_settings()
    sender = make_sender()
    while True:
        try:
            # Off the event loop: the check does synchronous SQLite + SMTP work.
            # Runs once at startup, then every interval, so a frequently restarted
            # container still checks and the seed's expired lot is flagged promptly.
            await asyncio.to_thread(_run_expiry_check, sender)
        except Exception:
            logger.exception("Expiry check failed")
        await asyncio.sleep(st.expiry_check_interval_s)


def create_app(start_background: bool = True) -> FastAPI:
    if db.SessionLocal is None:
        db.init_db()

    @asynccontextmanager
    async def lifespan(application: FastAPI):
        consumer = None
        task = None
        if start_background:
            from app.config import get_settings

            if get_settings().seed_demo:
                from app.seed import seed_if_empty

                with db.SessionLocal() as session:
                    seed_if_empty(session)
                    session.commit()

            from app.mqtt import MqttConsumer

            consumer = MqttConsumer(db.SessionLocal)
            consumer.start()
            task = asyncio.create_task(_expiry_check_loop())
        yield
        if task:
            task.cancel()
        if consumer:
            consumer.stop()

    application = FastAPI(title="FutureKawa backend-local", lifespan=lifespan)

    from app.api.exploitations import router as exploitations_router
    from app.api.lots import router as lots_router
    from app.api.products import router as products_router
    from app.api.readonly import router as readonly_router
    from app.api.sync import router as sync_router

    application.include_router(lots_router)
    application.include_router(products_router)
    application.include_router(exploitations_router)
    application.include_router(sync_router)
    application.include_router(readonly_router)

    @application.get("/health")
    def health():
        return {"status": "ok"}

    return application
