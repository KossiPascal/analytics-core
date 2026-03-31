

# backend/src/routes/utils.py

from flask import request, jsonify
from sqlalchemy.inspection import inspect
from sqlalchemy.orm import joinedload
from sqlalchemy.exc import IntegrityError
from backend.src.databases.extensions import db


# =========================
# SERIALIZER
# =========================
def serialize(obj, include=None, depth=0, max_depth=2):
    mapper = inspect(obj.__class__)
    data = {}

    for c in mapper.columns:
        val = getattr(obj, c.key)

        if hasattr(val, "isoformat"):
            val = val.isoformat()

        if hasattr(val, "value"):
            val = val.value

        data[c.key] = val

    if include and depth < max_depth:
        for rel in mapper.relationships:
            if rel.key in include:
                value = getattr(obj, rel.key)

                if value is None:
                    data[rel.key] = None
                elif rel.uselist:
                    data[rel.key] = [
                        serialize(x, include, depth + 1, max_depth)
                        for x in value
                    ]
                else:
                    data[rel.key] = serialize(value, include, depth + 1, max_depth)

    return data


# =========================
# QUERY ENGINE
# =========================
def apply_filters(query, model):
    mapper = inspect(model)

    for key, value in request.args.items():
        if "__" in key:
            field, op = key.split("__", 1)
        else:
            field, op = key, "eq"

        if field not in mapper.columns:
            continue

        col = getattr(model, field)

        if op == "eq":
            query = query.filter(col == value)
        elif op == "gt":
            query = query.filter(col > value)
        elif op == "lt":
            query = query.filter(col < value)
        elif op == "like":
            query = query.filter(col.ilike(f"%{value}%"))

    return query


def apply_sort(query, model):
    sort = request.args.get("sort")
    if not sort:
        return query

    mapper = inspect(model)

    for field in sort.split(","):
        desc = field.startswith("-")
        field = field.replace("-", "")

        if field in mapper.columns:
            col = getattr(model, field)
            query = query.order_by(col.desc() if desc else col.asc())

    return query


def apply_pagination(query):
    page = int(request.args.get("page", 1))
    size = int(request.args.get("size", 20))
    return query.limit(size).offset((page - 1) * size)


def apply_includes(query, model):
    include = request.args.get("include")
    if not include:
        return query, []

    includes = include.split(",")

    for rel in includes:
        if hasattr(model, rel):
            query = query.options(joinedload(rel))

    return query, includes


# =========================
# CRUD GENERATOR
# =========================
def register_crud(bp, model, url_prefix: str):
    model_name = url_prefix.strip("/")

    # LIST
    @bp.route(f"{url_prefix}", methods=["GET"])
    def list_entities():
        query = model.query
        query = apply_filters(query, model)
        query = apply_sort(query, model)
        query, includes = apply_includes(query, model)
        query = apply_pagination(query)

        return jsonify([serialize(x, includes) for x in query.all()])

    # GET
    @bp.route(f"{url_prefix}/<int:id>", methods=["GET"])
    def get_entity(id):
        query = model.query
        query, includes = apply_includes(query, model)

        obj = query.get_or_404(id)
        return jsonify(serialize(obj, includes))

    # CREATE
    @bp.route(f"{url_prefix}", methods=["POST"])
    def create_entity():
        data = request.json or {}
        mapper = inspect(model)

        allowed = {c.key for c in mapper.columns}
        payload = {k: v for k, v in data.items() if k in allowed}

        obj = model(**payload)

        try:
            db.session.add(obj)
            db.session.commit()
        except IntegrityError as e:
            db.session.rollback()
            return jsonify({"error": str(e)}), 400

        return jsonify(serialize(obj))

    # UPDATE
    @bp.route(f"{url_prefix}/<int:id>", methods=["PUT", "PATCH"])
    def update_entity(id):
        obj = model.query.get_or_404(id)
        data = request.json or {}

        mapper = inspect(model)
        allowed = {c.key for c in mapper.columns}

        for k, v in data.items():
            if k in allowed:
                setattr(obj, k, v)

        try:
            db.session.commit()
        except IntegrityError as e:
            db.session.rollback()
            return jsonify({"error": str(e)}), 400

        return jsonify(serialize(obj))

    # DELETE
    @bp.route(f"{url_prefix}/<int:id>", methods=["DELETE"])
    def delete_entity(id):
        obj = model.query.get_or_404(id)

        try:
            db.session.delete(obj)
            db.session.commit()
        except IntegrityError as e:
            db.session.rollback()
            return jsonify({"error": str(e)}), 400

        return jsonify({"deleted": True})

    # =========================
    # RELATIONS
    # =========================

    # ADD RELATION
    @bp.route(f"{url_prefix}/<int:id>/relations/<rel>", methods=["POST"])
    def add_relation(id, rel):
        obj = model.query.get_or_404(id)
        mapper = inspect(model)

        if rel not in mapper.relationships:
            return jsonify({"error": "invalid relation"}), 400

        relation = mapper.relationships[rel]
        target_model = relation.mapper.class_

        data = request.json or {}
        target_id = data.get("id")

        target = target_model.query.get_or_404(target_id)

        if relation.uselist:
            collection = getattr(obj, rel)
            if target not in collection:
                collection.append(target)
        else:
            setattr(obj, rel, target)

        db.session.commit()
        return jsonify({"linked": True})

    # REMOVE RELATION
    @bp.route(f"{url_prefix}/<int:id>/relations/<rel>/<int:target_id>", methods=["DELETE"])
    def remove_relation(id, rel, target_id):
        obj = model.query.get_or_404(id)
        mapper = inspect(model)

        if rel not in mapper.relationships:
            return jsonify({"error": "invalid relation"}), 400

        relation = mapper.relationships[rel]
        target_model = relation.mapper.class_

        target = target_model.query.get_or_404(target_id)

        if relation.uselist:
            collection = getattr(obj, rel)
            if target in collection:
                collection.remove(target)
        else:
            setattr(obj, rel, None)

        db.session.commit()
        return jsonify({"unlinked": True})