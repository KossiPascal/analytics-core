import { useState, useEffect } from 'react';
import { Button } from '@components/ui/Button/Button';
import { Plus } from 'lucide-react';
import { employeesApi } from '../../api';
import type { Employee, Department, Position } from '../../types';
import { DepartmentsTable } from './DepartmentsTable';
import { DepartmentFormModal } from './DepartmentFormModal';
import { PositionsTable } from './PositionsTable';
import { PositionFormModal } from './PositionFormModal';
import { EmployeesTable } from './EmployeesTable';
import { EmployeeFormModal } from './EmployeeFormModal';
import { EmployeeDetailModal } from './EmployeeDetailModal';
import { EmployeeTransferModal } from './EmployeeTransferModal';
import { ConfirmToggleEmployeeModal } from './ConfirmToggleEmployeeModal';
import styles from '../../EquipmentManager.module.css';
import toast from 'react-hot-toast';

type SubTab = 'employees' | 'departments' | 'positions';

export function EmployeesTab() {
  const [subTab, setSubTab] = useState<SubTab>('employees');
  const [departments, setDepartments] = useState<(Department & { children: Department[] })[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);

  // Department modal
  const [deptFormOpen, setDeptFormOpen] = useState(false);
  const [deptEditData, setDeptEditData] = useState<Department | null>(null);

  // Position modal
  const [posFormOpen, setPosFormOpen] = useState(false);
  const [posEditData, setPosEditData] = useState<Position | null>(null);

  // Employee modal
  const [empFormOpen, setEmpFormOpen] = useState(false);
  const [empEditData, setEmpEditData] = useState<Employee | null>(null);
  const [empDetailOpen, setEmpDetailOpen] = useState(false);
  const [empDetailId, setEmpDetailId] = useState<string | null>(null);
  const [empTransferOpen, setEmpTransferOpen] = useState(false);
  const [empTransferTarget, setEmpTransferTarget] = useState<Employee | null>(null);
  const [toggleModalOpen, setToggleModalOpen] = useState(false);
  const [toggleTarget, setToggleTarget] = useState<Employee | null>(null);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [deptRes, posRes, empRes] = await Promise.all([
        employeesApi.getDepartments(),
        employeesApi.getPositions(),
        employeesApi.getAll(),
      ]);
      if (deptRes.success) setDepartments(deptRes.data!);
      if (posRes.success) setPositions(posRes.data!);
      if (empRes.success) setEmployees(empRes.data!);
    } catch {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = (emp: Employee) => {
    setToggleTarget(emp);
    setToggleModalOpen(true);
  };

  const SUB_TABS: { key: SubTab; label: string }[] = [
    { key: 'employees', label: 'Employes' },
    { key: 'departments', label: 'Departements' },
    { key: 'positions', label: 'Postes' },
  ];

  const getAddButtonLabel = () => {
    if (subTab === 'departments') return 'Nouveau Departement';
    if (subTab === 'positions') return 'Nouveau Poste';
    return 'Nouvel Employe';
  };

  const handleAddClick = () => {
    if (subTab === 'departments') { setDeptEditData(null); setDeptFormOpen(true); }
    else if (subTab === 'positions') { setPosEditData(null); setPosFormOpen(true); }
    else { setEmpEditData(null); setEmpFormOpen(true); }
  };

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
          onClick={handleAddClick}
        >
          {getAddButtonLabel()}
        </Button>
      </div>

      {subTab === 'departments' && (
        <DepartmentsTable
          data={departments}
          isLoading={loading}
          onEdit={(d) => { setDeptEditData(d); setDeptFormOpen(true); }}
        />
      )}

      {subTab === 'positions' && (
        <PositionsTable
          data={positions}
          isLoading={loading}
          onEdit={(p) => { setPosEditData(p); setPosFormOpen(true); }}
        />
      )}

      {subTab === 'employees' && (
        <EmployeesTable
          data={employees}
          isLoading={loading}
          onEdit={(e) => { setEmpEditData(e); setEmpFormOpen(true); }}
          onView={(e) => { setEmpDetailId(e.id); setEmpDetailOpen(true); }}
          onToggleActive={handleToggleActive}
          onTransfer={(e) => { setEmpTransferTarget(e); setEmpTransferOpen(true); }}
        />
      )}

      <DepartmentFormModal
        isOpen={deptFormOpen}
        onClose={() => setDeptFormOpen(false)}
        onSuccess={loadAll}
        editData={deptEditData}
        departments={departments}
      />

      <PositionFormModal
        isOpen={posFormOpen}
        onClose={() => setPosFormOpen(false)}
        onSuccess={loadAll}
        editData={posEditData}
      />

      <EmployeeFormModal
        isOpen={empFormOpen}
        onClose={() => setEmpFormOpen(false)}
        onSuccess={loadAll}
        editData={empEditData}
        departments={departments}
        positions={positions}
      />

      <EmployeeDetailModal
        isOpen={empDetailOpen}
        onClose={() => setEmpDetailOpen(false)}
        employeeId={empDetailId}
      />

      <EmployeeTransferModal
        isOpen={empTransferOpen}
        onClose={() => { setEmpTransferOpen(false); setEmpTransferTarget(null); }}
        onSuccess={loadAll}
        employee={empTransferTarget}
      />

      <ConfirmToggleEmployeeModal
        isOpen={toggleModalOpen}
        onClose={() => { setToggleModalOpen(false); setToggleTarget(null); }}
        onSuccess={loadAll}
        employee={toggleTarget}
      />
    </div>
  );
}
