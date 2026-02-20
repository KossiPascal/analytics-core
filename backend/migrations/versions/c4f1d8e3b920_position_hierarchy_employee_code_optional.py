"""Position hierarchy (parent_id) + employee code optional + phone/position required

Revision ID: c4f1d8e3b920
Revises: b7d4e9f2a1c3
Create Date: 2026-02-19 00:00:00.000000

Changes:
- Add em.positions.parent_id (self-referential FK, nullable)
- Make em.employees.employee_id_code nullable (code becomes optional)
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c4f1d8e3b920'
down_revision = 'b7d4e9f2a1c3'
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()

    # ─── 1. Ajouter parent_id sur em.positions (hiérarchie des postes) ────────
    conn.execute(sa.text("""
        ALTER TABLE em.positions
        ADD COLUMN IF NOT EXISTS parent_id BIGINT
        REFERENCES em.positions(id) ON DELETE SET NULL
    """))

    # ─── 2. Rendre employee_id_code optionnel ─────────────────────────────────
    conn.execute(sa.text("""
        ALTER TABLE em.employees
        ALTER COLUMN employee_id_code DROP NOT NULL
    """))


def downgrade():
    conn = op.get_bind()

    # Remettre parent_id FK + colonne
    try:
        op.drop_constraint('fk_positions_parent_id', 'positions', schema='em', type_='foreignkey')
    except Exception:
        pass
    conn.execute(sa.text("ALTER TABLE em.positions DROP COLUMN IF EXISTS parent_id"))

    # Remettre employee_id_code NOT NULL (placeholder pour les NULLs existants)
    conn.execute(sa.text(
        "UPDATE em.employees SET employee_id_code = 'UNKNOWN_' || id::text WHERE employee_id_code IS NULL"
    ))
    conn.execute(sa.text(
        "ALTER TABLE em.employees ALTER COLUMN employee_id_code SET NOT NULL"
    ))
