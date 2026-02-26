"""add email_config alert_config alert_recipient_configs tables

Revision ID: i2d3f5a7b9c1
Revises: 610b750cc4ca
Create Date: 2026-02-26 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'i2d3f5a7b9c1'
down_revision = '610b750cc4ca'
branch_labels = None
depends_on = None


def upgrade():
    # em.email_config
    op.create_table(
        'email_config',
        sa.Column('id', sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('host', sa.String(255), nullable=False),
        sa.Column('port', sa.Integer(), nullable=False, server_default='587'),
        sa.Column('username', sa.String(255), nullable=False),
        sa.Column('password_encrypted', sa.Text(), nullable=False),
        sa.Column('from_email', sa.String(255), nullable=False),
        sa.Column('from_name', sa.String(255), nullable=True, server_default='IH Equipment Manager'),
        sa.Column('use_tls', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        schema='em',
    )

    # em.alert_config
    op.create_table(
        'alert_config',
        sa.Column('id', sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('warning_days', sa.Integer(), nullable=False, server_default='7'),
        sa.Column('escalation_days', sa.Integer(), nullable=False, server_default='14'),
        sa.Column('frequency_hours', sa.Integer(), nullable=False, server_default='24'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        schema='em',
    )

    # Insert default alert config
    op.execute(
        "INSERT INTO em.alert_config (warning_days, escalation_days, frequency_hours, is_active) "
        "VALUES (7, 14, 24, true)"
    )

    # em.alert_recipient_configs
    op.create_table(
        'alert_recipient_configs',
        sa.Column('id', sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('stage', sa.String(30), nullable=True),
        sa.Column('alert_level', sa.String(20), nullable=False),
        sa.Column('recipient_type', sa.String(20), nullable=False),
        sa.Column('employee_id', sa.BigInteger(), nullable=True),
        sa.Column('position_id', sa.BigInteger(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text('now()')),
        schema='em',
    )
    op.create_foreign_key(
        'fk_arc_employee_id',
        'alert_recipient_configs', 'employees',
        ['employee_id'], ['id'],
        source_schema='em', referent_schema='em',
        ondelete='CASCADE',
    )
    op.create_foreign_key(
        'fk_arc_position_id',
        'alert_recipient_configs', 'positions',
        ['position_id'], ['id'],
        source_schema='em', referent_schema='em',
        ondelete='CASCADE',
    )


def downgrade():
    op.drop_constraint('fk_arc_position_id', 'alert_recipient_configs', schema='em', type_='foreignkey')
    op.drop_constraint('fk_arc_employee_id', 'alert_recipient_configs', schema='em', type_='foreignkey')
    op.drop_table('alert_recipient_configs', schema='em')
    op.drop_table('alert_config', schema='em')
    op.drop_table('email_config', schema='em')
