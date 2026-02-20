"""Position department + Equipment category group

Revision ID: d5e2a1f7c863
Revises: c4f1d8e3b920
Create Date: 2026-02-20 00:00:00.000000

Changes:
- Add em.positions.department_id (FK → em.departments.id)
- Remove em.employees.department_id (département déduit du poste)
- Create em.equipment_category_groups (Appareils électroniques, Meubles, Voitures…)
- Add em.equipment_categories.category_group_id (FK → em.equipment_category_groups.id)
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'd5e2a1f7c863'
down_revision = 'c4f1d8e3b920'
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()

    # ─── 1. Ajouter department_id sur em.positions ────────────────────────────
    conn.execute(sa.text("""
        ALTER TABLE em.positions
        ADD COLUMN IF NOT EXISTS department_id BIGINT
        REFERENCES em.departments(id) ON DELETE SET NULL
    """))

    # Migrer : pour chaque poste, prendre le département du premier employé trouvé
    conn.execute(sa.text("""
        UPDATE em.positions p
        SET department_id = (
            SELECT e.department_id
            FROM em.employees e
            WHERE e.position_id = p.id
              AND e.department_id IS NOT NULL
            LIMIT 1
        )
        WHERE p.department_id IS NULL
    """))

    # ─── 2. Supprimer department_id de em.employees ───────────────────────────
    # Supprimer les FK potentielles via SQL IF EXISTS (évite les erreurs de transaction)
    conn.execute(sa.text(
        "ALTER TABLE em.employees DROP CONSTRAINT IF EXISTS employees_department_id_fkey"
    ))
    conn.execute(sa.text(
        "ALTER TABLE em.employees DROP CONSTRAINT IF EXISTS fk_employees_department_id"
    ))
    conn.execute(sa.text("""
        ALTER TABLE em.employees
        DROP COLUMN IF EXISTS department_id
    """))

    # ─── 3. Créer em.equipment_category_groups ────────────────────────────────
    op.create_table(
        'equipment_category_groups',
        sa.Column('id', sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('name', sa.String(150), nullable=False, unique=True),
        sa.Column('code', sa.String(50), nullable=False, unique=True),
        sa.Column('description', sa.Text(), default=''),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        schema='em',
    )

    # Insérer les catégories de base
    conn.execute(sa.text("""
        INSERT INTO em.equipment_category_groups (name, code, description, is_active, created_at)
        VALUES
            ('Appareils électroniques', 'ELECTRONIQUE', '', true, NOW()),
            ('Électroménagers',         'ELECTROMENAGER', '', true, NOW()),
            ('Meubles',                 'MEUBLE', '', true, NOW()),
            ('Voitures',                'VOITURE', '', true, NOW()),
            ('Motos',                   'MOTO', '', true, NOW()),
            ('Vélos',                   'VELO', '', true, NOW()),
            ('Autres',                  'AUTRE', '', true, NOW())
        ON CONFLICT (code) DO NOTHING
    """))

    # ─── 4. Ajouter category_group_id sur em.equipment_categories ────────────
    conn.execute(sa.text("""
        ALTER TABLE em.equipment_categories
        ADD COLUMN IF NOT EXISTS category_group_id BIGINT
        REFERENCES em.equipment_category_groups(id) ON DELETE SET NULL
    """))


def downgrade():
    conn = op.get_bind()

    # Reverse category_group_id
    conn.execute(sa.text(
        "ALTER TABLE em.equipment_categories DROP COLUMN IF EXISTS category_group_id"
    ))

    # Drop equipment_category_groups
    op.drop_table('equipment_category_groups', schema='em')

    # Restore department_id on employees (NULL — données perdues)
    conn.execute(sa.text("""
        ALTER TABLE em.employees
        ADD COLUMN IF NOT EXISTS department_id BIGINT
        REFERENCES em.departments(id) ON DELETE CASCADE
    """))

    # Remove department_id from positions
    conn.execute(sa.text(
        "ALTER TABLE em.positions DROP COLUMN IF EXISTS department_id"
    ))
