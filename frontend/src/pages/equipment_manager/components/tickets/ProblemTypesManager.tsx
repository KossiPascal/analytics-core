import { useState, useEffect } from 'react';
import { Table, type Column } from '@components/ui/Table/Table';
import { Modal } from '@components/ui/Modal/Modal';
import { Button } from '@components/ui/Button/Button';
import { Badge } from '@components/ui/Badge/Badge';
import { FormInput } from '@/components/forms/FormInput/FormInput';
import { FormSelect } from '@/components/forms/FormSelect/FormSelect';
import { Plus, Save } from 'lucide-react';
import { ticketsApi } from '../../api';
import type { ProblemType } from '../../types';
import shared from '@components/ui/styles/shared.module.css';
import toast from 'react-hot-toast';

export function ProblemTypesManager() {
  const [types, setTypes] = useState<ProblemType[]>([]);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState('HARDWARE');
  const [order, setOrder] = useState('0');
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const res = await ticketsApi.getProblemTypes();
    if (res.success) setTypes(res.data!);
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) { toast.error('Nom et code requis'); return; }
    setSaving(true);
    const res = await ticketsApi.createProblemType({ name, code, category, display_order: parseInt(order) || 0 });
    if (res.success) { toast.success('Type cree'); load(); setFormOpen(false); setName(''); setCode(''); }
    else toast.error(res.message || 'Erreur');
    setSaving(false);
  };

  const CATEGORY_VARIANT: Record<string, 'warning' | 'info' | 'secondary'> = {
    HARDWARE: 'warning', SOFTWARE: 'info', OTHER: 'secondary',
  };

  const columns: Column<ProblemType>[] = [
    { key: 'name', header: 'Nom', render: (pt) => pt.name },
    { key: 'code', header: 'Code', render: (pt) => pt.code },
    { key: 'category', header: 'Categorie', render: (pt) => <Badge variant={CATEGORY_VARIANT[pt.category] || 'secondary'}>{pt.category}</Badge> },
    { key: 'order', header: 'Ordre', render: (pt) => pt.display_order },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600 }}>Types de problemes</h4>
        <Button size="sm" leftIcon={<Plus size={16} />} onClick={() => setFormOpen(true)}>Nouveau type</Button>
      </div>

      <Table data={types} columns={columns} keyExtractor={(pt) => pt.id} isLoading={loading} features={{ search: true }} emptyMessage="Aucun type" />

      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title="Nouveau type de probleme"
        size="sm"
        footer={
          <div className={shared.modalFooter}>
            <Button variant="outline" size="sm" onClick={() => setFormOpen(false)}>Annuler</Button>
            <Button variant="primary" size="sm" onClick={handleCreate} isLoading={saving}><Save size={16} /> Creer</Button>
          </div>
        }
      >
        <form className={shared.form} onSubmit={handleCreate}>
          <FormInput label="Nom" required value={name} onChange={(e) => setName(e.target.value)} />
          <FormInput label="Code" required value={code} onChange={(e) => setCode(e.target.value)} />
          <FormSelect
            label="Categorie"
            required
            value={category}
            onChange={(v) => setCategory(v)}
            options={[{ value: 'HARDWARE', label: 'Hardware' }, { value: 'SOFTWARE', label: 'Software' }, { value: 'OTHER', label: 'Autre' }]}
          />
          <FormInput label="Ordre d'affichage" type="number" value={order} onChange={(e) => setOrder(e.target.value)} />
        </form>
      </Modal>
    </div>
  );
}
