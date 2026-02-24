"""Employee: tenant_id, user_id, employee_profile

Revision ID: g3b5d1f8a2e6
Revises: f2a4c8e1b5d9
Create Date: 2026-02-23 00:00:00.000000

Changes:
- Add em.employees.tenant_id (FK → tenants.id, nullable)
- Add em.employees.user_id (FK → users.id, nullable, unique)
- Create em.employee_profile (supervisor_employee_id, start_date, end_date)
"""
from alembic import op
import sqlalchemy as sa


revision = 'g3b5d1f8a2e6'
down_revision = 'f2a4c8e1b5d9'
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()

    # ─── 1. Colonnes sur em.employees ─────────────────────────────────────────
    conn.execute(sa.text("""
        ALTER TABLE em.employees
        ADD COLUMN IF NOT EXISTS tenant_id BIGINT
            REFERENCES tenants(id) ON DELETE SET NULL
    """))

    conn.execute(sa.text("""
        ALTER TABLE em.employees
        ADD COLUMN IF NOT EXISTS user_id BIGINT UNIQUE
            REFERENCES users(id) ON DELETE SET NULL
    """))

    # ─── 2. Table em.employee_profile ─────────────────────────────────────────
    conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS em.employee_profile (
            employee_id            BIGINT PRIMARY KEY
                REFERENCES em.employees(id) ON DELETE CASCADE,
            supervisor_employee_id BIGINT
                REFERENCES em.employees(id) ON DELETE SET NULL,
            start_date             DATE,
            end_date               DATE
        )
    """))


def downgrade():
    conn = op.get_bind()
    conn.execute(sa.text("DROP TABLE IF EXISTS em.employee_profile"))
    conn.execute(sa.text(
        "ALTER TABLE em.employees DROP COLUMN IF EXISTS user_id"
    ))
    conn.execute(sa.text(
        "ALTER TABLE em.employees DROP COLUMN IF EXISTS tenant_id"
    ))
