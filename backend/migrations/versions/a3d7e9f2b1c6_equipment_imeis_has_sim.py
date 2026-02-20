"""Equipment IMEIs table + has_sim field

Revision ID: a3d7e9f2b1c6
Revises: f2a4c8e1b5d9
Create Date: 2026-02-20 00:00:00.000000

Changes:
- Add em.equipment.has_sim (Boolean: l'équipement prend une carte SIM)
- Create em.equipment_imeis (id, equipment_id, imei, slot_number)
- Migrate existing em.equipment.imei → em.equipment_imeis
"""
from alembic import op
import sqlalchemy as sa


revision = 'a3d7e9f2b1c6'
down_revision = 'f2a4c8e1b5d9'
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()

    # ─── 1. Ajouter has_sim sur em.equipment ──────────────────────────────────
    conn.execute(sa.text("""
        ALTER TABLE em.equipment
        ADD COLUMN IF NOT EXISTS has_sim BOOLEAN NOT NULL DEFAULT false
    """))

    # ─── 2. Créer em.equipment_imeis ──────────────────────────────────────────
    op.create_table(
        'equipment_imeis',
        sa.Column('id', sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('equipment_id', sa.BigInteger(),
                  sa.ForeignKey('em.equipment.id', ondelete='CASCADE'), nullable=False),
        sa.Column('imei', sa.String(15), nullable=False),
        sa.Column('slot_number', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text('NOW()')),
        sa.UniqueConstraint('imei', name='uq_equipment_imeis_imei'),
        schema='em',
    )

    # ─── 3. Migrer les IMEI existants ─────────────────────────────────────────
    conn.execute(sa.text("""
        INSERT INTO em.equipment_imeis (equipment_id, imei, slot_number, created_at)
        SELECT id, imei, 1, NOW()
        FROM em.equipment
        WHERE imei IS NOT NULL
          AND imei != ''
          AND imei NOT LIKE 'SI/EQ/%'
          AND LENGTH(imei) = 15
        ON CONFLICT (imei) DO NOTHING
    """))

    # Marquer has_sim = true pour les équipements ayant un vrai IMEI migré
    conn.execute(sa.text("""
        UPDATE em.equipment e
        SET has_sim = true
        WHERE EXISTS (
            SELECT 1 FROM em.equipment_imeis ei WHERE ei.equipment_id = e.id
        )
    """))


def downgrade():
    conn = op.get_bind()
    op.drop_table('equipment_imeis', schema='em')
    conn.execute(sa.text(
        "ALTER TABLE em.equipment DROP COLUMN IF EXISTS has_sim"
    ))
