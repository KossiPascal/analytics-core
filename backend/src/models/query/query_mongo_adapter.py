class MongoAdapter:
    """
    Compile le query builder vers un pipeline MongoDB
    """

    def compile(self, query):
        pipeline = []

        if query.get("filters"):
            pipeline.append({"$match": self._filters(query["filters"])})

        if query.get("group_by"):
            pipeline.append({"$group": self._group(query)})

        if query.get("having"):
            pipeline.append({"$match": self._filters(query["having"])})

        if query.get("order_by"):
            pipeline.append({"$sort": self._sort(query)})

        if query.get("limit"):
            pipeline.append({"$limit": query["limit"]})

        return pipeline

    def _filters(self, filters):
        m = {}
        for f in filters:
            if f["op"] == "=":
                m[f["field"]] = f["value"]
            elif f["op"] == ">":
                m[f["field"]] = {"$gt": f["value"]}
        return m

    def _group(self, query):
        g = {"_id": {}}
        for d in query["group_by"]:
            g["_id"][d] = f"${d}"

        for m, agg in query["aggregations"].items():
            g[m] = {f"${agg}": f"${m}"}

        return g

    def _sort(self, query):
        return {
            o["field"]: 1 if o.get("direction", "asc") == "asc" else -1
            for o in query["order_by"]
        }
