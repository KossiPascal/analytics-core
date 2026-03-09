from sqlalchemy import Column, BigInteger, String, Text, ForeignKey, JSON, text
from sqlalchemy.dialects.postgresql import JSONB
from enum import Enum as PyEnum
from backend.src.databases.extensions import db
from backend.src.models.datasource import AuditMixin
from backend.src.logger import get_backend_logger

logger = get_backend_logger(__name__)

# ----------------------------
# Chart Types
# ----------------------------
class ChartType(str, PyEnum):
    BAR = "bar"
    LINE = "line"
    PIE = "pie"
    AREA = "area"
    KPI = "kpi"
    TABLE = "table"
    DONUT = "donut"
    GAUGE = "gauge"
    HEATMAP = "heatmap"
    RADAR = "radar"
    STACKED_AREA = "stacked-area"
    STACKED_BAR = "stacked-bar"

# ----------------------------
# DatasetChart Model
# ----------------------------
class DatasetChart(db.Model, AuditMixin):
    __tablename__ = "dataset_charts"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)

    tenant_id = Column(BigInteger, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    dataset_id = Column(BigInteger, ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False, index=True)
    query_id = Column(BigInteger, ForeignKey("dataset_queries.id", ondelete="CASCADE"), nullable=False, index=True)

    type = Column(String(50), nullable=False)

    # JSON fields pour structure et options
    structure = Column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    options = Column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))

    # Relations
    tenant = db.relationship("Tenant", back_populates="charts", lazy="selectin",foreign_keys=[tenant_id])
    dataset = db.relationship("Dataset", back_populates="charts", lazy="selectin",foreign_keys=[dataset_id])
    dataset_query = db.relationship("DatasetQuery", back_populates="charts", lazy="selectin",foreign_keys=[query_id])

    visualizations = db.relationship("VisualizationChart", back_populates="chart", cascade="all, delete-orphan")

    __table_args__ = (
        db.UniqueConstraint("tenant_id", "name", name="uq_chart_name_per_tenant"),
        db.ForeignKeyConstraint(
            ["query_id", "dataset_id"],
            ["dataset_queries.id", "dataset_queries.dataset_id"],
            ondelete="CASCADE",
            name="fk_chart_query_dataset_match",
        ),
    )

    def ensure_same_tenant(self):
        if self.dataset and self.dataset.tenant_id != self.tenant_id:
            raise ValueError("Tenant mismatch")

    # Validation options
    def validate_options(self):
        # { "semantic": {}, "visual": {}, "interaction": {}, "advanced": {} }

        if not isinstance(self.options, dict):
            raise ValueError("Chart options must be a JSON object")
        
        # validate(instance=self.options, schema=BASE_SCHEMA)

        semantic = self.options.get("semantic", {})
        visual = self.options.get("visual", {})
        interaction = self.options.get("interaction", {})

        # Validation dimensions/metrics par type
        if self.type in [ChartType.BAR.value, ChartType.LINE.value, ChartType.AREA.value,
                         ChartType.STACKED_AREA.value, ChartType.STACKED_BAR.value]:
            if "dimension" not in semantic:
                raise ValueError(f"{self.type} chart requires a 'dimension'")
            if "metrics" not in semantic or not semantic["metrics"]:
                raise ValueError(f"{self.type} chart requires at least one 'metric'")

        elif self.type in [ChartType.PIE.value, ChartType.DONUT.value]:
            if "dimension" not in semantic:
                raise ValueError(f"{self.type} chart requires 'dimension'")
            if "metric" not in semantic:
                raise ValueError(f"{self.type} chart requires 'metric'")

        elif self.type == ChartType.KPI.value:
            if "metric" not in semantic:
                raise ValueError("KPI chart requires 'metric'")

        elif self.type == ChartType.TABLE.value:
            if "columns" not in semantic or not semantic["columns"]:
                raise ValueError("Table chart requires 'columns' list")

        # Validation visuelle par type
        if visual:
            if self.type in [ChartType.BAR.value, ChartType.LINE.value, ChartType.AREA.value,
                             ChartType.STACKED_AREA.value, ChartType.STACKED_BAR.value]:
                visual.setdefault("x_axis", {})
                visual.setdefault("y_axis", {})
                visual.setdefault("color_scheme", "default")
                visual.setdefault("legend", {"show": True, "position": "top"})

            elif self.type in [ChartType.PIE.value, ChartType.DONUT.value]:
                visual.setdefault("legend", {"show": True, "position": "right"})
                visual.setdefault("show_labels", True)
                visual.setdefault("color_scheme", "default")

            elif self.type == ChartType.KPI.value:
                visual.setdefault("show_trend", True)
                visual.setdefault("positive_color", "#4CAF50")
                visual.setdefault("negative_color", "#F44336")

            elif self.type == ChartType.TABLE.value:
                visual.setdefault("sortable", True)
                visual.setdefault("pagination", True)
                visual.setdefault("page_size", 25)
                visual.setdefault("show_totals", True)

        # Validation interactions
        interaction.setdefault("tooltip", True)
        interaction.setdefault("drilldown", False)
        interaction.setdefault("row_click", None)

    # Retourne config front-end
    def render_config(self, data: list):
        """
        Retourne la configuration prête pour frontend
        """
        self.validate_options()
        return {
            "id": self.id,
            "name": self.name,
            "type": self.type,
            "data": data,
            "options": self.options or {},
            "structure": self.structure or {}
        }

    # Sérialisation complète
    def to_dict(self, include_relations=True):
        data = {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "tenant_id": self.tenant_id,
            "dataset_id": self.dataset_id,
            "query_id": self.query_id,
            "type": self.type,
            "options": self.options or {},
            "structure": self.structure or {},
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "is_active": self.is_active,
        }
        if include_relations:
            data.update({
                "tenant": self.tenant.to_dict(include_relations=False) if self.tenant else None,
                "dataset": self.dataset.to_dict(include_relations=False) if self.dataset else None,
                "query": self.dataset_query.to_dict(include_relations=False) if self.dataset_query else None,
                "visualizations": [v.to_dict(include_relations=False) for v in self.visualizations] if self.visualizations else []
            })
        return data

    def __repr__(self):
        return f"<DatasetChart id={self.id} name={self.name} type={self.type}>"



# # Création d'un DatasetChart BAR basé sur ton DatasetQuery
# bar_chart = DatasetChart(
#     name="Patient Count per Month",
#     description="Nombre de patients par mois pour 2025 filtré par conditions",
#     tenant_id=1,            # Exemple
#     dataset_id=1,           # Dataset lié
#     query_id=1,             # DatasetQuery JSON fourni
#     type=ChartType.BAR,
#     options={
#         "semantic": {
#             "dimension": "month",                 # Axe X
#             "metrics": ["sum_case_role_patient"], # Axe Y
#         },
#         "visual": {
#             "x_axis": {
#                 "label": "Mois",
#                 "rotate": 45
#             },
#             "y_axis": {
#                 "label": "Nombre de patients",
#                 "min": 0
#             },
#             "color_scheme": "category10",
#             "legend": {
#                 "show": True,
#                 "position": "top"
#             },
#             "show_labels": True,
#             "bar_width": 0.6,
#         },
#         "interaction": {
#             "tooltip": True,
#             "drilldown": True,   # Permet de cliquer sur un mois pour voir les détails
#             "row_click": None
#         }
#     }
# )

# # Validation automatique des options
# bar_chart.validate_options()

# # Exemple de données simulées après exécution du SQL
# data = [
#     {"month": "01", "sum_case_role_patient": 120},
#     {"month": "02", "sum_case_role_patient": 150},
#     {"month": "03", "sum_case_role_patient": 200},
#     {"month": "04", "sum_case_role_patient": 180},
#     {"month": "05", "sum_case_role_patient": 220},
# ]

# # Génération du config prêt pour le front-end
# chart_config = bar_chart.render_config(data)

# print(chart_config)
# # {
# #   "id": null,
# #   "name": "Patient Count per Month",
# #   "type": "bar",
# #   "data": [
# #     {"month": "01", "sum_case_role_patient": 120},
# #     {"month": "02", "sum_case_role_patient": 150},
# #     {"month": "03", "sum_case_role_patient": 200},
# #     {"month": "04", "sum_case_role_patient": 180},
# #     {"month": "05", "sum_case_role_patient": 220}
# #   ],
# #   "options": {
# #     "semantic": {
# #       "dimension": "month",
# #       "metrics": ["sum_case_role_patient"]
# #     },
# #     "visual": {
# #       "x_axis": {"label": "Mois", "rotate": 45},
# #       "y_axis": {"label": "Nombre de patients", "min": 0},
# #       "color_scheme": "category10",
# #       "legend": {"show": true, "position": "top"},
# #       "show_labels": true,
# #       "bar_width": 0.6
# #     },
# #     "interaction": {
# #       "tooltip": true,
# #       "drilldown": true,
# #       "row_click": null
# #     }
# #   }
# # }


# bar_chart = DatasetChart(
#     name="Patient Count per Month",
#     type=ChartType.BAR,
#     tenant_id=1,
#     dataset_id=1,
#     query_id=1,
#     options={
#         "semantic": {"dimension": "month", "metrics": ["sum_case_role_patient"]},
#         "visual": {
#             "x_axis": {"label": "Mois", "rotate": 45},
#             "y_axis": {"label": "Nombre de patients", "min": 0},
#             "color_scheme": "category10",
#             "legend": {"show": True, "position": "top"},
#             "show_labels": True,
#             "bar_width": 0.6,
#         },
#         "interaction": {"tooltip": True, "drilldown": True}
#     }
# )


# line_chart = DatasetChart(
#     name="Patient Trend 2025",
#     type=ChartType.LINE,
#     tenant_id=1,
#     dataset_id=1,
#     query_id=1,
#     options={
#         "semantic": {"dimension": "month", "metrics": ["sum_case_role_patient", "total_id_between_year_2025_2026"]},
#         "visual": {
#             "x_axis": {"label": "Mois", "rotate": 0},
#             "y_axis": {"label": "Nombre de patients", "min": 0},
#             "color_scheme": "accent",
#             "legend": {"show": True, "position": "top"},
#             "line_width": 2,
#             "show_points": True,
#         },
#         "interaction": {"tooltip": True, "drilldown": True}
#     }
# )


# pie_chart = DatasetChart(
#     name="Patient Distribution by Name",
#     type=ChartType.PIE,
#     tenant_id=1,
#     dataset_id=1,
#     query_id=1,
#     options={
#         "semantic": {"dimension": "name", "metric": "sum_case_role_patient"},
#         "visual": {
#             "color_scheme": "category20",
#             "legend": {"show": True, "position": "right"},
#             "show_labels": True,
#             "label_format": "{dimension}: {value} ({percent}%)"
#         },
#         "interaction": {"tooltip": True}
#     }
# )


# kpi_chart = DatasetChart(
#     name="Total Patients KPI",
#     type=ChartType.KPI,
#     tenant_id=1,
#     dataset_id=1,
#     query_id=1,
#     options={
#         "semantic": {"metric": "sum_case_role_patient"},
#         "visual": {
#             "color": "#ff5733",
#             "icon": "user",
#             "format": "0,0",  # formatage numérique
#             "trend_metric": "total_id_between_year_2025_2026"
#         },
#         "interaction": {"tooltip": True}
#     }
# )


# table_chart = DatasetChart(
#     name="Patient Details Table",
#     type=ChartType.TABLE,
#     tenant_id=1,
#     dataset_id=1,
#     query_id=1,
#     options={
#         "columns": [
#             {"field": "name", "label": "Nom", "sortable": True},
#             {"field": "month", "label": "Mois", "sortable": True},
#             {"field": "sum_case_role_patient", "label": "Patients", "sortable": True},
#             {"field": "total_id_between_year_2025_2026", "label": "Total ID 2025-2026", "sortable": True},
#         ],
#         "visual": {
#             "row_striping": True,
#             "row_hover": True,
#             "pagination": {"enabled": True, "page_size": 20},
#             "show_totals": True,
#             "color_scheme": "tableau10",
#         },
#         "interaction": {"filtering": True, "sorting": True}
#     }
# )