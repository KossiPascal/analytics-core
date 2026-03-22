"""Ajouter le champ orc_type sur la table prosi.orcs

Revision ID: 0001_add_orc_type
Revises:
Create Date: 2026-03-22

"""
from alembic import op
import sqlalchemy as sa

revision = '0001_add_orc_type'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # IF NOT EXISTS évite l'erreur si db.create_all() a déjà créé la colonne
    op.execute(
        "ALTER TABLE prosi.orcs ADD COLUMN IF NOT EXISTS orc_type VARCHAR(20) NOT NULL DEFAULT 'OBJECTIF'"
    )
    # Met à jour les ORCs qui ont un parent : ils sont des RESULTAT_CLE
    op.execute(
        "UPDATE prosi.orcs SET orc_type = 'RESULTAT_CLE' WHERE parent_id IS NOT NULL AND orc_type = 'OBJECTIF'"
    )


def downgrade():
    op.drop_column('orcs', 'orc_type', schema='prosi')
