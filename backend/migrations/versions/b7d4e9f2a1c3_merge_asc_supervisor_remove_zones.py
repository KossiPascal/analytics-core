"""Merge ASC/Supervisor into Employee, remove ZoneASC and geographic tables

Revision ID: b7d4e9f2a1c3
Revises: a3f8c2d1e405
Create Date: 2026-02-17 00:00:00.000000

Changes:
- Add user_id to em.employees
- Create em.employee_profile (supervisor link + dates only)
- Migrate em.ascs → em.employees (position=ASC) + em.employee_profile
- Migrate em.supervisors → em.employees (position=SUPERVISEUR, user_id)
- Drop em.supervisor_sites, em.supervisors, em.ascs
- Drop em.zones_asc (géographie gérée via users_orgunits)
- Rename repair_tickets.asc_id → employee_id, update FK
- Update em.equipment.owner_id FK → em.employees.id
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b7d4e9f2a1c3'
down_revision = 'a3f8c2d1e405'
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()

    # ─── 1. Créer positions ASC et SUPERVISEUR si elles n'existent pas ───────
    conn.execute(sa.text("""
        INSERT INTO em.positions (name, code, description, is_active, created_at)
        VALUES
            ('Agent de Santé Communautaire', 'ASC', '', true, NOW()),
            ('Superviseur', 'SUPERVISEUR', '', true, NOW())
        ON CONFLICT (code) DO NOTHING
    """))

    # ─── 2. Ajouter user_id sur em.employees ─────────────────────────────────
    op.add_column('employees',
        sa.Column('user_id', sa.BigInteger(), nullable=True),
        schema='em'
    )
    op.create_unique_constraint('uq_employees_user_id', 'employees', ['user_id'], schema='em')
    op.create_foreign_key(
        'fk_employees_user_id', 'employees', 'users',
        ['user_id'], ['id'], source_schema='em', ondelete='SET NULL'
    )

    # ─── 3. Créer em.employee_profile ────────────────────────────────────────
    op.create_table(
        'employee_profile',
        sa.Column('employee_id', sa.BigInteger(), nullable=False),
        sa.Column('supervisor_employee_id', sa.BigInteger(), nullable=True),
        sa.Column('start_date', sa.Date(), nullable=True),
        sa.Column('end_date', sa.Date(), nullable=True),
        sa.ForeignKeyConstraint(['employee_id'], ['em.employees.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['supervisor_employee_id'], ['em.employees.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('employee_id'),
        schema='em'
    )

    # ─── 4. Migrer em.ascs → em.employees (position=ASC) ────────────────────
    conn.execute(sa.text("""
        INSERT INTO em.employees
            (first_name, last_name, employee_id_code, position_id,
             gender, phone, email, is_active, notes, created_at)
        SELECT
            a.first_name, a.last_name, a.code,
            (SELECT id FROM em.positions WHERE code = 'ASC'),
            COALESCE(a.gender, ''),
            COALESCE(a.phone, ''),
            COALESCE(a.email, ''),
            a.is_active,
            COALESCE(a.notes, ''),
            a.created_at
        FROM em.ascs a
        ON CONFLICT (employee_id_code) DO NOTHING
    """))

    # Créer employee_profile pour les ASC avec superviseur/dates
    conn.execute(sa.text("""
        INSERT INTO em.employee_profile (employee_id, supervisor_employee_id, start_date, end_date)
        SELECT
            e.id,
            NULL,
            a.start_date,
            a.end_date
        FROM em.ascs a
        JOIN em.employees e ON e.employee_id_code = a.code
        WHERE a.start_date IS NOT NULL OR a.end_date IS NOT NULL
        ON CONFLICT DO NOTHING
    """))

    # ─── 5. Migrer em.supervisors → em.employees (position=SUPERVISEUR) ──────
    conn.execute(sa.text("""
        INSERT INTO em.employees
            (first_name, last_name, employee_id_code, position_id,
             user_id, phone, email, is_active, created_at)
        SELECT
            s.first_name, s.last_name, s.code,
            (SELECT id FROM em.positions WHERE code = 'SUPERVISEUR'),
            s.user_id,
            COALESCE(s.phone, ''),
            COALESCE(s.email, ''),
            true,
            s.created_at
        FROM em.supervisors s
        ON CONFLICT (employee_id_code) DO NOTHING
    """))

    # ─── 6. Mettre à jour em.equipment : owner_id FK ascs → employees ────────
    # D'abord, mettre à jour les valeurs owner_id pour pointer vers les nouveaux employees
    conn.execute(sa.text("""
        UPDATE em.equipment eq
        SET owner_id = e.id
        FROM em.ascs a
        JOIN em.employees e ON e.employee_id_code = a.code
        WHERE eq.owner_id = a.id
    """))

    # Recréer la FK owner_id → em.employees.id
    # (La FK existante pointait vers em.ascs.id — on la supprime et recrée)
    try:
        op.drop_constraint('equipment_owner_id_fkey', 'equipment', schema='em', type_='foreignkey')
    except Exception:
        pass  # La contrainte peut avoir un nom différent

    op.create_foreign_key(
        'fk_equipment_owner_id', 'equipment', 'employees',
        ['owner_id'], ['id'], source_schema='em', referent_schema='em', ondelete='SET NULL'
    )

    # ─── 7. Renommer repair_tickets.asc_id → employee_id ────────────────────
    # Mettre à jour les valeurs pour pointer vers les nouveaux employees
    conn.execute(sa.text("""
        UPDATE em.repair_tickets rt
        SET asc_id = e.id
        FROM em.ascs a
        JOIN em.employees e ON e.employee_id_code = a.code
        WHERE rt.asc_id = a.id
    """))

    # Supprimer ancienne FK et renommer la colonne
    try:
        op.drop_constraint('repair_tickets_asc_id_fkey', 'repair_tickets', schema='em', type_='foreignkey')
    except Exception:
        pass

    op.alter_column('repair_tickets', 'asc_id', new_column_name='employee_id', schema='em')

    op.create_foreign_key(
        'fk_repair_tickets_employee_id', 'repair_tickets', 'employees',
        ['employee_id'], ['id'], source_schema='em', referent_schema='em', ondelete='CASCADE'
    )

    # ─── 8. Supprimer les tables obsolètes ───────────────────────────────────
    op.drop_table('supervisor_sites', schema='em')
    op.drop_table('supervisors', schema='em')
    op.drop_table('ascs', schema='em')
    op.drop_table('zones_asc', schema='em')


def downgrade():
    raise NotImplementedError(
        "Downgrade non supporté : cette migration fusionne des tables. "
        "Restaurer depuis un backup."
    )
