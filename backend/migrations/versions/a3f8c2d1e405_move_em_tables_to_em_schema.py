"""Move em_ tables to em schema

Revision ID: a3f8c2d1e405
Revises: 1d59adc27919
Create Date: 2026-02-17 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'a3f8c2d1e405'
down_revision = '1d59adc27919'
branch_labels = None
depends_on = None

# Tables to move from public.em_XXX -> em.XXX
# Format: (old_name_in_public, new_name_in_em)
EM_TABLES = [
    ("em_regions", "regions"),
    ("em_districts", "districts"),
    ("em_sites", "sites"),
    ("em_zones_asc", "zones_asc"),
    ("em_departments", "departments"),
    ("em_positions", "positions"),
    ("em_employees", "employees"),
    ("em_employee_history", "employee_history"),
    ("em_equipment_categories", "equipment_categories"),
    ("em_equipment_brands", "equipment_brands"),
    ("em_equipment", "equipment"),
    ("em_equipment_history", "equipment_history"),
    ("em_accessories", "accessories"),
    ("em_ascs", "ascs"),
    ("em_supervisors", "supervisors"),
    ("em_supervisor_sites", "supervisor_sites"),
    ("em_problem_types", "problem_types"),
    ("em_repair_tickets", "repair_tickets"),
    ("em_issues", "issues"),
    ("em_ticket_events", "ticket_events"),
    ("em_ticket_comments", "ticket_comments"),
    ("em_delay_alert_recipients", "delay_alert_recipients"),
    ("em_delay_alert_logs", "delay_alert_logs"),
]

# Constraint renames: (table_in_em_schema, old_constraint_name, new_constraint_name)
CONSTRAINT_RENAMES = [
    ("districts", "uq_em_districts_region_code", "uq_districts_region_code"),
    ("zones_asc", "uq_em_zones_asc_site_code", "uq_zones_asc_site_code"),
    ("departments", "uq_em_departments_parent_name", "uq_departments_parent_name"),
]


def upgrade():
    # Create the em schema
    op.execute("CREATE SCHEMA IF NOT EXISTS em")

    # Move each table from public to em schema and rename
    for old_name, new_name in EM_TABLES:
        # Move to em schema (still has old name at this point)
        op.execute(f"ALTER TABLE public.{old_name} SET SCHEMA em")
        # Rename to drop the em_ prefix
        if old_name != new_name:
            op.execute(f"ALTER TABLE em.{old_name} RENAME TO {new_name}")

    # Rename constraints (unique constraints keep old names after move)
    for table, old_constraint, new_constraint in CONSTRAINT_RENAMES:
        op.execute(
            f"ALTER TABLE em.{table} "
            f"RENAME CONSTRAINT {old_constraint} TO {new_constraint}"
        )


def downgrade():
    # Rename constraints back
    for table, old_constraint, new_constraint in reversed(CONSTRAINT_RENAMES):
        op.execute(
            f"ALTER TABLE em.{table} "
            f"RENAME CONSTRAINT {new_constraint} TO {old_constraint}"
        )

    # Move tables back to public and restore em_ prefix
    for old_name, new_name in reversed(EM_TABLES):
        # Rename back to em_ prefixed name
        if old_name != new_name:
            op.execute(f"ALTER TABLE em.{new_name} RENAME TO {old_name}")
        # Move back to public schema
        op.execute(f"ALTER TABLE em.{old_name} SET SCHEMA public")

    # Drop the em schema if empty
    op.execute("DROP SCHEMA IF EXISTS em")
