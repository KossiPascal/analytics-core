import { useState, useEffect } from 'react';
import { Table, type Column } from '@components/ui/Table/Table';
import { Modal } from '@components/ui/Modal/Modal';
import { Button } from '@components/ui/Button/Button';
import { Badge } from '@components/ui/Badge/Badge';
import { FormInput } from '@/components/forms/FormInput/FormInput';
import { Plus, Save } from 'lucide-react';
import { ticketsApi } from '../../api';
import type { DelayAlertRecipient } from '../../types';
import shared from '@components/ui/styles/shared.module.css';
import toast from 'react-hot-toast';

export function AlertRecipientsManager() {
  const [recipients, setRecipients] = useState<DelayAlertRecipient[]>([]);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const res = await ticketsApi.getAlertRecipients();
    if (res.success) setRecipients(res.data!);
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim() || !email.trim()) { toast.error('ID utilisateur et email requis'); return; }
    setSaving(true);
    const res = await ticketsApi.createAlertRecipient({ user_id: userId, email });
    if (res.success) { toast.success('Destinataire ajoute'); load(); setFormOpen(false); setUserId(''); setEmail(''); }
    else toast.error(res.message || 'Erreur');
    setSaving(false);
  };

  const handleToggle = async (id: string) => {
    const res = await ticketsApi.toggleAlertRecipient(id);
    if (res.success) { toast.success('Statut modifie'); load(); }
    else toast.error('Erreur');
  };

  const columns: Column<DelayAlertRecipient>[] = [
    { key: 'email', header: 'Email', render: (r) => r.email },
    { key: 'type', header: 'Type', render: (r) => r.recipient_type },
    {
      key: 'status',
      header: 'Statut',
      render: (r) => (
        <Badge variant={r.is_active ? 'success' : 'danger'}>
          {r.is_active ? 'Actif' : 'Inactif'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (r) => (
        <Button size="sm" variant="ghost" onClick={() => handleToggle(r.id)}>
          {r.is_active ? 'Desactiver' : 'Activer'}
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600 }}>Destinataires des alertes</h4>
        <Button size="sm" leftIcon={<Plus size={16} />} onClick={() => setFormOpen(true)}>Ajouter</Button>
      </div>

      <Table data={recipients} columns={columns} keyExtractor={(r) => r.id} isLoading={loading} emptyMessage="Aucun destinataire" />

      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title="Nouveau destinataire"
        size="sm"
        footer={
          <div className={shared.modalFooter}>
            <Button variant="outline" size="sm" onClick={() => setFormOpen(false)}>Annuler</Button>
            <Button variant="primary" size="sm" onClick={handleCreate} isLoading={saving}><Save size={16} /> Ajouter</Button>
          </div>
        }
      >
        <form className={shared.form} onSubmit={handleCreate}>
          <FormInput label="ID Utilisateur" required value={userId} onChange={(e) => setUserId(e.target.value)} />
          <FormInput label="Email" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </form>
      </Modal>
    </div>
  );
}
