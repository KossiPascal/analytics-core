"""
Celery application factory for analytics-core.
"""
from celery import Celery

celery = Celery("analytics_core_celery")


def init_celery(app):
    """Bind Celery to the Flask app context and configure the beat schedule."""
    celery.conf.update(
        broker_url=app.config.get("CELERY_BROKER_URL", "redis://localhost:6379/0"),
        result_backend=app.config.get("CELERY_RESULT_BACKEND", "redis://localhost:6379/0"),
        timezone="UTC",
        enable_utc=True,
        beat_schedule={
            "check-ticket-delays": {
                "task": "backend.src.equipment.tasks.check_ticket_delays",
                "schedule": 3600,  # run every hour; internal filter respects frequency_hours
            }
        },
        task_serializer="json",
        result_serializer="json",
        accept_content=["json"],
    )

    class ContextTask(celery.Task):
        def __call__(self, *args, **kwargs):
            with app.app_context():
                return self.run(*args, **kwargs)

    celery.Task = ContextTask
    return celery
