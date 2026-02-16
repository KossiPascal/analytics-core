import { useState, useEffect } from 'react';
import { Button } from '@components/ui/Button/Button';
import { Plus } from 'lucide-react';
import { equipmentApi, ascsApi, employeesApi } from '../../api';
import type { Equipment, ASC, Employee } from '../../types';
import { EquipmentTable } from './EquipmentTable';
import { EquipmentFormModal } from './EquipmentFormModal';
import { EquipmentDetailModal } from './EquipmentDetailModal';
import { AssignEquipmentModal } from './AssignEquipmentModal';
import toast from 'react-hot-toast';

export function EquipmentTab() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [ascs, setAscs] = useState<ASC[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState<Equipment | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState<Equipment | null>(null);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [eqRes, ascsRes, empRes] = await Promise.all([
        equipmentApi.getAll(),
        ascsApi.getAll(),
        employeesApi.getAll(),
      ]);
      if (eqRes.success) setEquipment(eqRes.data!);
      if (ascsRes.success) setAscs(ascsRes.data!);
      if (empRes.success) setEmployees(empRes.data!);
    } catch {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <Button size="sm" leftIcon={<Plus size={16} />} onClick={() => { setEditData(null); setFormOpen(true); }}>
          Nouvel Equipement
        </Button>
      </div>

      <EquipmentTable
        data={equipment}
        isLoading={loading}
        onEdit={(e) => { setEditData(e); setFormOpen(true); }}
        onView={(e) => { setDetailId(e.id); setDetailOpen(true); }}
        onAssign={(e) => { setAssignTarget(e); setAssignOpen(true); }}
      />

      <EquipmentFormModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={loadAll}
        editData={editData}
        ascs={ascs}
      />

      <EquipmentDetailModal isOpen={detailOpen} onClose={() => setDetailOpen(false)} equipmentId={detailId} />

      <AssignEquipmentModal
        isOpen={assignOpen}
        onClose={() => setAssignOpen(false)}
        onSuccess={loadAll}
        equipment={assignTarget}
        ascs={ascs}
        employees={employees}
      />
    </div>
  );
}
