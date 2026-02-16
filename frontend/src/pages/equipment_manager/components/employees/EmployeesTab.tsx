import { useState, useEffect } from 'react';
import { Button } from '@components/ui/Button/Button';
import { Plus } from 'lucide-react';
import { employeesApi } from '../../api';
import type { Employee, Department } from '../../types';
import { DepartmentsTable } from './DepartmentsTable';
import { DepartmentFormModal } from './DepartmentFormModal';
import { EmployeesTable } from './EmployeesTable';
import { EmployeeFormModal } from './EmployeeFormModal';
import { EmployeeDetailModal } from './EmployeeDetailModal';
import styles from '../../EquipmentManager.module.css';
import toast from 'react-hot-toast';

type SubTab = 'departments' | 'employees';

export function EmployeesTab() {
  const [subTab, setSubTab] = useState<SubTab>('employees');
  const [departments, setDepartments] = useState<(Department & { children: Department[] })[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);

  // Department modal
  const [deptFormOpen, setDeptFormOpen] = useState(false);
  const [deptEditData, setDeptEditData] = useState<Department | null>(null);

  // Employee modal
  const [empFormOpen, setEmpFormOpen] = useState(false);
  const [empEditData, setEmpEditData] = useState<Employee | null>(null);
  const [empDetailOpen, setEmpDetailOpen] = useState(false);
  const [empDetailId, setEmpDetailId] = useState<string | null>(null);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [deptRes, empRes] = await Promise.all([
        employeesApi.getDepartments(),
        employeesApi.getAll(),
      ]);
      if (deptRes.success) setDepartments(deptRes.data!);
      if (empRes.success) setEmployees(empRes.data!);
    } catch {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (emp: Employee) => {
    const res = await employeesApi.toggleActive(emp.id);
    if (res.success) { toast.success(`Employe ${emp.is_active ? 'desactive' : 'active'}`); loadAll(); }
    else toast.error('Erreur');
  };

  const SUB_TABS: { key: SubTab; label: string }[] = [
    { key: 'employees', label: 'Employes' },
    { key: 'departments', label: 'Departements' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div className={styles.subTabsList}>
          {SUB_TABS.map((t) => (
            <button
              key={t.key}
              className={`${styles.subTabItem} ${subTab === t.key ? styles.active : ''}`}
              onClick={() => setSubTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <Button
          size="sm"
          leftIcon={<Plus size={16} />}
          onClick={() => {
            if (subTab === 'departments') { setDeptEditData(null); setDeptFormOpen(true); }
            else { setEmpEditData(null); setEmpFormOpen(true); }
          }}
        >
          {subTab === 'departments' ? 'Nouveau Departement' : 'Nouvel Employe'}
        </Button>
      </div>

      {subTab === 'departments' && (
        <DepartmentsTable
          data={departments}
          isLoading={loading}
          onEdit={(d) => { setDeptEditData(d); setDeptFormOpen(true); }}
        />
      )}

      {subTab === 'employees' && (
        <EmployeesTable
          data={employees}
          isLoading={loading}
          onEdit={(e) => { setEmpEditData(e); setEmpFormOpen(true); }}
          onView={(e) => { setEmpDetailId(e.id); setEmpDetailOpen(true); }}
          onToggleActive={handleToggleActive}
        />
      )}

      <DepartmentFormModal
        isOpen={deptFormOpen}
        onClose={() => setDeptFormOpen(false)}
        onSuccess={loadAll}
        editData={deptEditData}
        departments={departments}
      />

      <EmployeeFormModal
        isOpen={empFormOpen}
        onClose={() => setEmpFormOpen(false)}
        onSuccess={loadAll}
        editData={empEditData}
        departments={departments}
      />

      <EmployeeDetailModal
        isOpen={empDetailOpen}
        onClose={() => setEmpDetailOpen(false)}
        employeeId={empDetailId}
      />
    </div>
  );
}
