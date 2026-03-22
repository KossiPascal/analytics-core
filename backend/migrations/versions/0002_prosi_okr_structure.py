"""Ajouter la table prosi.pillars et étendre prosi.orcs pour la structure OKR complète

Revision ID: 0002_prosi_okr_structure
Revises: 0001_add_orc_type
Create Date: 2026-03-22

"""
from alembic import op
import sqlalchemy as sa

revision      = '0002_prosi_okr_structure'
down_revision = '0001_add_orc_type'
branch_labels = None
depends_on    = None


def upgrade():
    # ── 1. Table prosi.pillars ────────────────────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS prosi.pillars (
            id          BIGSERIAL PRIMARY KEY,
            tenant_id   BIGINT NOT NULL REFERENCES tenants(id)         ON DELETE CASCADE,
            project_id  BIGINT NOT NULL REFERENCES prosi.projects(id)  ON DELETE CASCADE,
            name        VARCHAR(255) NOT NULL,
            code        VARCHAR(30)  NOT NULL DEFAULT '',
            description TEXT         NOT NULL DEFAULT '',
            order_index INTEGER      NOT NULL DEFAULT 0,
            fiscal_year INTEGER,
            -- AuditMixin
            is_active   BOOLEAN NOT NULL DEFAULT TRUE,
            deleted     BOOLEAN NOT NULL DEFAULT FALSE,
            deleted_at  TIMESTAMP WITH TIME ZONE,
            created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_by  BIGINT,
            updated_by  BIGINT,
            CONSTRAINT uq_prosi_pillar_project_code UNIQUE (project_id, code)
        )
    """)

    # ── 2. Nouvelles colonnes sur prosi.orcs ──────────────────────────────────
    op.execute("ALTER TABLE prosi.orcs ADD COLUMN IF NOT EXISTS pillar_id     BIGINT REFERENCES prosi.pillars(id)    ON DELETE SET NULL")
    op.execute("ALTER TABLE prosi.orcs ADD COLUMN IF NOT EXISTS department_id BIGINT REFERENCES eqpm.departments(id) ON DELETE SET NULL")
    op.execute("ALTER TABLE prosi.orcs ADD COLUMN IF NOT EXISTS code             VARCHAR(30) NOT NULL DEFAULT ''")
    op.execute("ALTER TABLE prosi.orcs ADD COLUMN IF NOT EXISTS target_indicator TEXT        NOT NULL DEFAULT ''")
    op.execute("ALTER TABLE prosi.orcs ADD COLUMN IF NOT EXISTS score            NUMERIC(4,2)")
    op.execute("ALTER TABLE prosi.orcs ADD COLUMN IF NOT EXISTS priority         VARCHAR(10) NOT NULL DEFAULT 'MEDIUM'")
    op.execute("ALTER TABLE prosi.orcs ADD COLUMN IF NOT EXISTS fiscal_year      INTEGER")
    op.execute("ALTER TABLE prosi.orcs ADD COLUMN IF NOT EXISTS quarter          VARCHAR(10)")

    # Index utiles
    op.execute("CREATE INDEX IF NOT EXISTS ix_prosi_orcs_pillar_id     ON prosi.orcs(pillar_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_prosi_orcs_department_id ON prosi.orcs(department_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_prosi_pillars_tenant_id  ON prosi.pillars(tenant_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_prosi_pillars_project_id ON prosi.pillars(project_id)")


def downgrade():
    op.execute("ALTER TABLE prosi.orcs DROP COLUMN IF EXISTS quarter")
    op.execute("ALTER TABLE prosi.orcs DROP COLUMN IF EXISTS fiscal_year")
    op.execute("ALTER TABLE prosi.orcs DROP COLUMN IF EXISTS priority")
    op.execute("ALTER TABLE prosi.orcs DROP COLUMN IF EXISTS score")
    op.execute("ALTER TABLE prosi.orcs DROP COLUMN IF EXISTS target_indicator")
    op.execute("ALTER TABLE prosi.orcs DROP COLUMN IF EXISTS code")
    op.execute("ALTER TABLE prosi.orcs DROP COLUMN IF EXISTS department_id")
    op.execute("ALTER TABLE prosi.orcs DROP COLUMN IF EXISTS pillar_id")
    op.execute("DROP TABLE IF EXISTS prosi.pillars")
