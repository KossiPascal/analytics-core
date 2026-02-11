"""Add revoked_at to refresh_tokens

Revision ID: 1d59adc27919
Revises:
Create Date: 2026-02-11 16:39:12.263460

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '1d59adc27919'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('refresh_tokens', schema=None) as batch_op:
        batch_op.add_column(sa.Column('revoked_at', sa.DateTime(timezone=True), nullable=True))


def downgrade():
    with op.batch_alter_table('refresh_tokens', schema=None) as batch_op:
        batch_op.drop_column('revoked_at')
