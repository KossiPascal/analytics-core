"""Add is_zone_assignable to positions

Revision ID: 0001
Revises:
Create Date: 2026-03-04
"""
from alembic import op
from sqlalchemy import text

# revision identifiers, used by Alembic.
revision = '0001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # IF NOT EXISTS rend la migration idempotente :
    # si la colonne existe déjà (créée par db.create_all() sur une DB vierge),
    # l'instruction est ignorée sans erreur.
    op.execute(text(
        "ALTER TABLE em.positions "
        "ADD COLUMN IF NOT EXISTS is_zone_assignable BOOLEAN NOT NULL DEFAULT FALSE"
    ))


def downgrade():
    op.execute(text(
        "ALTER TABLE em.positions DROP COLUMN IF EXISTS is_zone_assignable"
    ))
