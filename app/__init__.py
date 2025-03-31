from flask import Flask
from app.routes import register_routes
from .database import  init_db


def create_app():
    """Функция создания приложения Flask"""

    app = Flask(__name__)
    app.secret_key = "a3f1c5e7d2b99c0a1d8f2e4a7c6d3b5e8f0a2c9d1e7b4c3f6a9d2b8e0f1a5c7"

    init_db()

    register_routes(app)  # Регистрируем маршруты
    return app
