"""Position hierarchy (parent_id) + employee code optional + phone/position required

Revision ID: c4f1d8e3b920
Revises: b7d4e9f2a1c3
Create Date: 2026-02-19 00:00:00.000000

Changes:
- Add em.positions.parent_id (self-referential FK, nullable)
- Make em.employees.employee_id_code nullable (code becomes optional)
"""

from alembic import op
import sqlalchemy as sa

revision = 'c4f1d8e3b920'
down_revision = 'b7d4e9f2a1c3'
branch_labels = None
depends_on = None


def upgrade():
    # 1. Add parent_id to em.positions
    op.add_column(
        'positions',
        sa.Column('parent_id', sa.BigInteger(), nullable=True),
        schema='em',
    )
    op.create_foreign_key(
        'fk_positions_parent_id',
        'positions', 'positions',
        ['parent_id'], ['id'],
        source_schema='em', referent_schema='em',
        ondelete='SET NULL',
    )

    # 2. Make employee_id_code nullable (code becomes optional)
    op.alter_column(
        'employees',
        'employee_id_code',
        existing_type=sa.String(length=50),
        nullable=True,
        schema='em',
    )


def downgrade():
    # Reverse: drop parent_id FK + column
    op.drop_constraint('fk_positions_parent_id', 'positions', schema='em', type_='foreignkey')
    op.drop_column('positions', 'parent_id', schema='em')

    # Reverse: employee_id_code NOT NULL again
    # First set a placeholder for any NULL values
    op.execute("UPDATE em.employees SET employee_id_code = 'UNKNOWN_' || id::text WHERE employee_id_code IS NULL")
    op.alter_column(
        'employees',
        'employee_id_code',
        existing_type=sa.String(length=50),
        nullable=False,
        schema='em',
    )
