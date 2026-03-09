"""Add user_orgunit_levels table and level_id FK on user_orgunits

Revision ID: 0002
Revises: 0001
Create Date: 2026-03-04
"""
from alembic import op
from sqlalchemy import text

# revision identifiers, used by Alembic.
revision    = '0002'
down_revision = '0001'
branch_labels = None
depends_on    = None


def upgrade():
    # 1. Créer la table des niveaux
    op.execute(text("""
        CREATE TABLE IF NOT EXISTS user_orgunit_levels (
            id           BIGSERIAL PRIMARY KEY,
            tenant_id    BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            name         VARCHAR(100) NOT NULL,
            code         VARCHAR(100) NOT NULL DEFAULT '',
            level        INTEGER NOT NULL,
            display_name VARCHAR(100),
            is_active    BOOLEAN NOT NULL DEFAULT TRUE,
            deleted      BOOLEAN NOT NULL DEFAULT FALSE,
            deleted_at   TIMESTAMP WITH TIME ZONE,
            deleted_by   BIGINT,
            created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
            created_by   BIGINT,
            updated_at   TIMESTAMP WITH TIME ZONE,
            updated_by   BIGINT,
            CONSTRAINT uq_orgunit_level_tenant UNIQUE (tenant_id, level)
        )
    """))

    # 2. Ajouter la colonne code si la table existait déjà sans elle (idempotent)
    op.execute(text(
        "ALTER TABLE user_orgunit_levels "
        "ADD COLUMN IF NOT EXISTS code VARCHAR(100) NOT NULL DEFAULT ''"
    ))

    # 3. Ajouter la colonne level_id sur user_orgunits (idempotent)
    op.execute(text(
        "ALTER TABLE user_orgunits "
        "ADD COLUMN IF NOT EXISTS level_id BIGINT "
        "REFERENCES user_orgunit_levels(id) ON DELETE SET NULL"
    ))


def downgrade():
    op.execute(text("ALTER TABLE user_orgunits DROP COLUMN IF EXISTS level_id"))
    op.execute(text("DROP TABLE IF EXISTS user_orgunit_levels"))
