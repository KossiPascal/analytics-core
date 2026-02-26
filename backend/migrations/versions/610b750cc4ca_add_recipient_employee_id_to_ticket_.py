"""add recipient_employee_id to ticket_events

Revision ID: 610b750cc4ca
Revises: h1c2e4f6a8b0
Create Date: 2026-02-25 16:35:02.457738

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '610b750cc4ca'
down_revision = 'h1c2e4f6a8b0'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        'ticket_events',
        sa.Column('recipient_employee_id', sa.BigInteger(), nullable=True),
        schema='em',
    )
    op.create_foreign_key(
        'fk_ticket_events_recipient_employee_id',
        'ticket_events', 'employees',
        ['recipient_employee_id'], ['id'],
        source_schema='em', referent_schema='em',
        ondelete='SET NULL',
    )


def downgrade():
    op.drop_constraint(
        'fk_ticket_events_recipient_employee_id',
        'ticket_events',
        schema='em',
        type_='foreignkey',
    )
    op.drop_column('ticket_events', 'recipient_employee_id', schema='em')
