# app.py
from flask import Flask, request
from security.access_decorators import require_auth
from models import User, Product
from crud_service import CRUDService

app = Flask(__name__)
app.config.from_object("config.Config")

# Crée les services CRUD pour chaque modèle
user_service = CRUDService(User)
product_service = CRUDService(Product)

@app.route("/api/users/", methods=["GET", "POST"])
@app.route("/api/users/<int:item_id>/", methods=["GET", "PUT", "DELETE"])
@require_auth
def users(item_id=None):
    if request.method == "GET":
        return user_service.get_one(item_id) if item_id else user_service.get_all()
    elif request.method == "POST":
        return user_service.create(request.json)
    elif request.method == "PUT":
        return user_service.update(item_id, request.json)
    elif request.method == "DELETE":
        return user_service.delete(item_id)

@app.route("/api/products/", methods=["GET", "POST"])
@app.route("/api/products/<int:item_id>/", methods=["GET", "PUT", "DELETE"])
@require_auth
def products(item_id=None):
    if request.method == "GET":
        return product_service.get_one(item_id) if item_id else product_service.get_all()
    elif request.method == "POST":
        return product_service.create(request.json)
    elif request.method == "PUT":
        return product_service.update(item_id, request.json)
    elif request.method == "DELETE":
        return product_service.delete(item_id)

if __name__ == "__main__":
    app.run(debug=True)
