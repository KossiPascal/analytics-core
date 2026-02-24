"""Merge branches: equipment_imeis + employee_tenant_user_profile

Revision ID: h1c2e4f6a8b0
Revises: a3d7e9f2b1c6, g3b5d1f8a2e6
Create Date: 2026-02-24 00:00:00.000000

Changes:
- Merge migration only (no schema change)
- Branch a3d7e9f2b1c6 (equipment_imeis + has_sim)
- Branch g3b5d1f8a2e6 (employees.tenant_id, employees.user_id, employee_profile)
- Note: em.employees.department_id was already removed in d5e2a1f7c863
"""
revision = 'h1c2e4f6a8b0'
down_revision = ('a3d7e9f2b1c6', 'g3b5d1f8a2e6')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
