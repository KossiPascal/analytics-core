import { useState, useEffect } from 'react';
import { Button } from '@components/ui/Button/Button';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { equipmentApi, ascsApi, employeesApi } from '../../api';
import type { Equipment, ASC, Employee, EquipmentCategory, EquipmentCategoryGroup, EquipmentBrand } from '../../types';
import { EquipmentTable } from './EquipmentTable';
import { EquipmentFormModal } from './EquipmentFormModal';
import { EquipmentDetailModal } from './EquipmentDetailModal';
import { AssignEquipmentModal } from './AssignEquipmentModal';
import { DeclareStatusModal } from './DeclareStatusModal';

export function EquipmentTab() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [ascs, setAscs] = useState<ASC[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [categories, setCategories] = useState<EquipmentCategory[]>([]);
  const [categoryGroups, setCategoryGroups] = useState<EquipmentCategoryGroup[]>([]);
  const [brands, setBrands] = useState<EquipmentBrand[]>([]);
  const [loading, setLoading] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState<Equipment | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState<Equipment | null>(null);
  const [declareOpen, setDeclareOpen] = useState(false);
  const [declareTarget, setDeclareTarget] = useState<Equipment | null>(null);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [eqRes, ascsRes, empRes, catRes, brandRes, groupRes] = await Promise.all([
        equipmentApi.getAll(),
        ascsApi.getAll(),
        employeesApi.getAll(),
        equipmentApi.getCategories(),
        equipmentApi.getBrands(),
        equipmentApi.getCategoryGroups(),
      ]);
      if (eqRes.success) setEquipment(eqRes.data!);
      if (ascsRes.success) setAscs(ascsRes.data!);
      if (empRes.success) setEmployees(empRes.data!);
      if (catRes.success) setCategories(catRes.data!);
      if (brandRes.success) setBrands(brandRes.data!);
      if (groupRes.success) setCategoryGroups(groupRes.data!);
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
        onEdit={async (e) => {
          const res = await equipmentApi.get(e.id);
          setEditData(res.success && res.data ? res.data : e);
          setFormOpen(true);
        }}
        onView={(e) => { setDetailId(e.id); setDetailOpen(true); }}
        onAssign={(e) => { setAssignTarget(e); setAssignOpen(true); }}
        onDeclare={(e) => { setDeclareTarget(e); setDeclareOpen(true); }}
        onGeneratePdf={async (e) => {
          try {
            await equipmentApi.downloadReceptionPdf(e.id);
          } catch {
            toast.error('Erreur lors de la génération du PDF');
          }
        }}
      />

      <EquipmentFormModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={loadAll}
        editData={editData}
        ascs={ascs}
        categories={categories}
        categoryGroups={categoryGroups}
        brands={brands}
      />

      <EquipmentDetailModal
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        equipmentId={detailId}
        onStatusChange={loadAll}
      />

      <DeclareStatusModal
        isOpen={declareOpen}
        onClose={() => setDeclareOpen(false)}
        onSuccess={loadAll}
        equipment={declareTarget}
      />

      <AssignEquipmentModal
        isOpen={assignOpen}
        onClose={() => setAssignOpen(false)}
        onSuccess={loadAll}
        equipment={assignTarget}
        employees={employees}
      />
    </div>
  );
}
