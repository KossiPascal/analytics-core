from functools import wraps
from flask import Flask


# -------------------------------
# Decorator Flask app context
# -------------------------------
def with_app_context(func):
    """Wrap function in Flask app context to safely use db.session and extensions."""
    @wraps(func)
    def wrapper(*args, **kwargs):
        app: Flask = kwargs.get("app")
        if not app:
            raise ValueError("Flask app must be passed as keyword arg 'app'")
        with app.app_context():
            return func(*args, **kwargs)
    return wrapper