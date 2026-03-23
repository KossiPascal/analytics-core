"""Créer la table prosi.employee_objectives — objectifs trimestriels individuels

Revision ID: 0003_employee_objectives
Revises: 0002_prosi_okr_structure
Create Date: 2026-03-22

"""
from alembic import op

revision      = '0003_employee_objectives'
down_revision = '0002_prosi_okr_structure'
branch_labels = None
depends_on    = None


def upgrade():
    op.execute("""
        CREATE TABLE IF NOT EXISTS prosi.employee_objectives (
            id               BIGSERIAL PRIMARY KEY,
            tenant_id        BIGINT NOT NULL REFERENCES tenants(id)           ON DELETE CASCADE,
            employee_id      BIGINT NOT NULL REFERENCES eqpm.employees(id)    ON DELETE CASCADE,
            user_id          BIGINT          REFERENCES users(id)             ON DELETE SET NULL,
            project_id       BIGINT          REFERENCES prosi.projects(id)    ON DELETE SET NULL,
            orc_id           BIGINT          REFERENCES prosi.orcs(id)        ON DELETE SET NULL,
            title            VARCHAR(255) NOT NULL,
            description      TEXT NOT NULL DEFAULT '',
            target_indicator TEXT NOT NULL DEFAULT '',
            target_value     NUMERIC(15,2),
            current_value    NUMERIC(15,2) DEFAULT 0,
            unit             VARCHAR(50)  NOT NULL DEFAULT '',
            score            NUMERIC(4,2),
            fiscal_year      INTEGER NOT NULL,
            quarter          VARCHAR(10) NOT NULL,
            priority         VARCHAR(10) NOT NULL DEFAULT 'MEDIUM',
            status           VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
            reviewer_id      BIGINT          REFERENCES users(id)             ON DELETE SET NULL,
            reviewed_at      TIMESTAMP WITH TIME ZONE,
            review_notes     TEXT NOT NULL DEFAULT '',
            notes            TEXT NOT NULL DEFAULT '',
            -- AuditMixin
            is_active   BOOLEAN NOT NULL DEFAULT TRUE,
            deleted     BOOLEAN NOT NULL DEFAULT FALSE,
            deleted_at  TIMESTAMP WITH TIME ZONE,
            created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_by  BIGINT,
            updated_by  BIGINT
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_emp_obj_tenant_id    ON prosi.employee_objectives(tenant_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_emp_obj_employee_id  ON prosi.employee_objectives(employee_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_emp_obj_user_id      ON prosi.employee_objectives(user_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_emp_obj_project_id   ON prosi.employee_objectives(project_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_emp_obj_orc_id       ON prosi.employee_objectives(orc_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_emp_obj_fy_quarter   ON prosi.employee_objectives(fiscal_year, quarter)")


def downgrade():
    op.execute("DROP TABLE IF EXISTS prosi.employee_objectives")
