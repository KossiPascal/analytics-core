"""Equipment code field

Revision ID: f2a4c8e1b5d9
Revises: d5e2a1f7c863
Create Date: 2026-02-20 00:00:00.000000

Changes:
- Add em.equipment.equipment_code (auto-generated: SI/EQ/<category_code>/<NNN>)
"""
from alembic import op
import sqlalchemy as sa


revision = 'f2a4c8e1b5d9'
down_revision = 'd5e2a1f7c863'
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()

    # ─── 1. Ajouter equipment_code (nullable d'abord) ─────────────────────────
    conn.execute(sa.text("""
        ALTER TABLE em.equipment
        ADD COLUMN IF NOT EXISTS equipment_code VARCHAR(50)
    """))

    # ─── 2. Générer les codes pour les équipements existants ──────────────────
    conn.execute(sa.text("""
        WITH ranked AS (
            SELECT
                e.id,
                'SI/EQ/' || COALESCE(c.code, 'AUTRE') || '/' ||
                LPAD(ROW_NUMBER() OVER (
                    PARTITION BY COALESCE(e.category_id, 0)
                    ORDER BY e.created_at, e.id
                )::text, 3, '0') AS code
            FROM em.equipment e
            LEFT JOIN em.equipment_categories c ON c.id = e.category_id
            WHERE e.equipment_code IS NULL
        )
        UPDATE em.equipment e
        SET equipment_code = ranked.code
        FROM ranked
        WHERE e.id = ranked.id
    """))

    # ─── 3. Rendre non-nullable + contrainte unique ───────────────────────────
    conn.execute(sa.text("""
        ALTER TABLE em.equipment
        ALTER COLUMN equipment_code SET NOT NULL
    """))
    conn.execute(sa.text("""
        ALTER TABLE em.equipment
        ADD CONSTRAINT uq_equipment_code UNIQUE (equipment_code)
    """))


def downgrade():
    conn = op.get_bind()
    conn.execute(sa.text(
        "ALTER TABLE em.equipment DROP CONSTRAINT IF EXISTS uq_equipment_code"
    ))
    conn.execute(sa.text(
        "ALTER TABLE em.equipment DROP COLUMN IF EXISTS equipment_code"
    ))
