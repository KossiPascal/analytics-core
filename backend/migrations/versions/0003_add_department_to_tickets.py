"""Add current_department fields to repair_tickets and department_code to ticket_events

Revision ID: 0003
Revises: 0002
Create Date: 2026-03-09
"""
from alembic import op
from sqlalchemy import text

revision    = '0003'
down_revision = '0002'
branch_labels = None
depends_on    = None


def upgrade():
    op.execute(text("""
        ALTER TABLE em.repair_tickets
            ADD COLUMN IF NOT EXISTS current_department_code VARCHAR(50),
            ADD COLUMN IF NOT EXISTS current_department_name VARCHAR(255)
    """))
    op.execute(text("""
        ALTER TABLE em.ticket_events
            ADD COLUMN IF NOT EXISTS department_code VARCHAR(50)
    """))


def downgrade():
    op.execute(text("""
        ALTER TABLE em.repair_tickets
            DROP COLUMN IF EXISTS current_department_code,
            DROP COLUMN IF EXISTS current_department_name
    """))
    op.execute(text("""
        ALTER TABLE em.ticket_events
            DROP COLUMN IF EXISTS department_code
    """))
