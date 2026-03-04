import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Globe, Layers, RefreshCw } from 'lucide-react';
import { StatusBadge } from '@components/ui/Badge/Badge';
import { type Column } from '@components/ui/Table/Table';
import { FormInput } from '@components/forms/FormInput/FormInput';
import { FormTextarea } from '@components/forms/FormTextarea/FormTextarea';
import { FormSelect } from '@components/forms/FormSelect/FormSelect';
import { FormCheckbox } from '@components/forms/FormCheckbox/FormCheckbox';
import { Tenant, Orgunit, OrgUnitLevel } from '@models/identity.model';
import { tenantService, orgunitService, levelService, identitySyncService, SyncResult } from '@/services/identity.service';
import { AdminEntityCrudModule, AdminEntityCrudModuleRef } from '@pages/admins/AdminEntityCrudModule';

// ─────────────────────────────────────────────────────────────────────────────
// Types sub-tabs
// ─────────────────────────────────────────────────────────────────────────────
type SubTab = 'orgunits' | 'levels';

// ─────────────────────────────────────────────────────────────────────────────
// Valeurs par défaut
// ─────────────────────────────────────────────────────────────────────────────
const defaultOrgunit: Orgunit = {
  id: null,
  name: '',
  description: '',
  tenant_id: null,
  level_id: null,
  code: '',
  is_active: true,
};

const defaultLevel: OrgUnitLevel = {
  id: null,
  tenant_id: null,
  name: '',
  code: '',
  level: 1,
  display_name: '',
  is_active: true,
};

// ─────────────────────────────────────────────────────────────────────────────
// Colonnes — Orgunits
// ─────────────────────────────────────────────────────────────────────────────
const orgunitColumns: Column<Orgunit>[] = [
  { key: 'name',        header: 'Nom',         sortable: true,  searchable: true },
  { key: 'code',        header: 'Code',        sortable: true,  searchable: true },
  {
    key: 'level',
    header: 'Niveau',
    sortable: true,
    searchable: true,
    render: (ou) => ou.level ? `${ou.level.level} — ${ou.level.display_name ?? ou.level.name}` : '—',
  },
  {
    key: 'tenant',
    header: 'Tenant',
    sortable: true,
    searchable: true,
    render: (ou) => ou.tenant?.name ?? '—',
  },
  {
    key: 'parent',
    header: 'Parent',
    render: (ou) => ou.parent?.name ?? '—',
  },
  { key: 'description', header: 'Description', sortable: false, searchable: true },
  {
    key: 'is_active',
    header: 'Statut',
    align: 'center',
    sortable: true,
    searchable: false,
    render: (ou) => <StatusBadge isActive={ou.is_active === true} />,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Colonnes — Levels
// ─────────────────────────────────────────────────────────────────────────────
const levelColumns: Column<OrgUnitLevel>[] = [
  {
    key: 'level',
    header: 'Numéro',
    sortable: true,
    searchable: false,
    render: (lv) => <strong>{lv.level}</strong>,
  },
  { key: 'name',         header: 'Nom',          sortable: true, searchable: true },
  { key: 'code',         header: 'Code DHIS2',   sortable: true, searchable: true },
  { key: 'display_name', header: 'Nom affiché',   sortable: true, searchable: true },
  {
    key: 'is_active',
    header: 'Statut',
    align: 'center',
    sortable: true,
    searchable: false,
    render: (lv) => <StatusBadge isActive={lv.is_active === true} />,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Ref exposée au parent
// ─────────────────────────────────────────────────────────────────────────────
export interface OrgunitsTabRef {
  handleNew: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────
export const OrgunitsTab = forwardRef<AdminEntityCrudModuleRef>((_, ref) => {
  const [activeTab, setActiveTab]   = useState<SubTab>('orgunits');
  const [tenants, setTenants]       = useState<Tenant[]>([]);
  const [orgunits, setOrgunits]     = useState<Orgunit[]>([]);
  const [levels, setLevels]         = useState<OrgUnitLevel[]>([]);
  const [loading, setLoading]       = useState(true);
  const [syncing, setSyncing]       = useState(false);
  const [syncMsg, setSyncMsg]       = useState<string | null>(null);

  const orgunitModuleRef = useRef<AdminEntityCrudModuleRef>(null);
  const levelModuleRef   = useRef<AdminEntityCrudModuleRef>(null);

  // Expose handleNew selon le sous-onglet actif
  useImperativeHandle(ref, () => ({
    handleNew: () => {
      if (activeTab === 'levels') levelModuleRef.current?.handleNew();
      else orgunitModuleRef.current?.handleNew();
    },
  }), [activeTab]);

  // ── Chargement initial ──────────────────────────────────────────────────
  const fetchAll = async () => {
    setLoading(true);
    const [tenantRes, orgunitRes, levelRes] = await Promise.allSettled([
      tenantService.all(),
      orgunitService.all(),
      levelService.all(),
    ]);
    if (tenantRes.status  === 'fulfilled') setTenants(tenantRes.value  ?? []);
    if (orgunitRes.status === 'fulfilled') setOrgunits(orgunitRes.value ?? []);
    if (levelRes.status   === 'fulfilled') setLevels(levelRes.value     ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  // ── Synchronisation DHIS2 ───────────────────────────────────────────────
  const handleSync = async (type: SubTab) => {
    setSyncing(true);
    setSyncMsg(null);
    const tenantId = tenants[0]?.id ?? null;
    try {
      const res: SyncResult = type === 'levels'
        ? await identitySyncService.syncLevels(tenantId)
        : await identitySyncService.syncOrgunits(tenantId);
      setSyncMsg(`✓ ${res.created} créés, ${res.updated} mis à jour (${res.total} total)`);
      await fetchAll();
    } catch (e) {
      setSyncMsg(`Erreur : ${e instanceof Error ? e.message : 'Synchronisation DHIS2 échouée'}`);
    } finally {
      setSyncing(false);
    }
  };

  // ── Options de sélection ────────────────────────────────────────────────
  const tenantOptions  = tenants.map((t) => ({ value: t.id, label: t.name }));
  const orgunitOptions = orgunits.map((o) => ({ value: o.id, label: o.name }));
  const levelOptions   = levels
    .filter((lv) => lv.is_active !== false)
    .sort((a, b) => a.level - b.level)
    .map((lv) => ({ value: lv.id, label: `${lv.level} — ${lv.display_name ?? lv.name}` }));

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* ── Navigation sous-onglets ───────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color, #e2e8f0)', paddingBottom: '0.5rem' }}>
        <SubTabButton active={activeTab === 'orgunits'} icon={<Globe size={15} />} label="Unités d'organisation" onClick={() => setActiveTab('orgunits')} />
        <SubTabButton active={activeTab === 'levels'}   icon={<Layers size={15} />} label="Niveaux"               onClick={() => setActiveTab('levels')}   />
      </div>

      {/* ── Message sync ──────────────────────────────────────────────────── */}
      {syncMsg && (
        <div style={{ marginBottom: '0.75rem', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', fontSize: '0.82rem', background: syncMsg.startsWith('✓') ? 'var(--color-success-bg, #f0fdf4)' : 'var(--color-error-bg, #fef2f2)', color: syncMsg.startsWith('✓') ? 'var(--color-success, #16a34a)' : 'var(--color-error, #dc2626)' }}>
          {syncMsg}
        </div>
      )}

      {/* ── Onglet Orgunits ───────────────────────────────────────────────── */}
      {activeTab === 'orgunits' && (
        <AdminEntityCrudModule<Orgunit>
          ref={orgunitModuleRef}
          title="Unités d'organisation"
          icon={<Globe size={20} />}
          headerActions={
            <SyncButton syncing={syncing} onClick={() => handleSync('orgunits')} />
          }
          entityName="Unité d'organisation"
          columns={orgunitColumns}
          defaultValue={defaultOrgunit}
          service={orgunitService}
          isValid={(ou) => !!ou.name.trim() && !!ou.tenant_id}
          renderForm={(ou, setValue) => (
            <>
              <FormSelect
                label="Tenant"
                required
                value={ou.tenant_id}
                options={tenantOptions}
                onChange={(v) => setValue('tenant_id', v)}
                placeholder="Sélectionner un tenant"
              />
              <FormInput
                label="Nom"
                required
                value={ou.name}
                onChange={(e) => setValue('name', e.target.value)}
              />
              <FormInput
                label="Code"
                value={ou.code ?? ''}
                onChange={(e) => setValue('code', e.target.value)}
              />
              <FormSelect
                label="Niveau"
                value={ou.level_id ?? null}
                options={[{ value: null, label: '— Aucun' }, ...levelOptions]}
                onChange={(v) => setValue('level_id', v ?? null)}
                placeholder="Sélectionner un niveau"
              />
              <FormSelect
                label="Unité parente"
                value={ou.parent_id ?? null}
                options={[{ value: null, label: '— Aucun (racine)' }, ...orgunitOptions.filter((o) => o.value !== ou.id)]}
                onChange={(v) => setValue('parent_id', v ?? null)}
                placeholder="Sélectionner le parent"
              />
              <FormCheckbox
                label="Actif"
                checked={Boolean(ou.is_active)}
                onChange={(e) => setValue('is_active', e.target.checked)}
              />
              <FormTextarea
                label="Description"
                hint="Optionnel"
                value={ou.description ?? ''}
                onChange={(e) => setValue('description', e.target.value)}
              />
            </>
          )}
        />
      )}

      {/* ── Onglet Niveaux ────────────────────────────────────────────────── */}
      {activeTab === 'levels' && (
        <AdminEntityCrudModule<OrgUnitLevel>
          ref={levelModuleRef}
          title="Niveaux d'organisation"
          icon={<Layers size={20} />}
          entityName="Niveau"
          headerActions={
            <SyncButton syncing={syncing} onClick={() => handleSync('levels')} />
          }
          columns={levelColumns}
          defaultValue={defaultLevel}
          service={levelService}
          isValid={(lv) => !!lv.name.trim() && !!lv.tenant_id && lv.level > 0}
          renderForm={(lv, setValue) => (
            <>
              <FormSelect
                label="Tenant"
                required
                value={lv.tenant_id}
                options={tenantOptions}
                onChange={(v) => setValue('tenant_id', v)}
                placeholder="Sélectionner un tenant"
              />
              <FormInput
                label="Numéro de niveau"
                required
                type="number"
                value={String(lv.level ?? 1)}
                onChange={(e) => setValue('level', Number(e.target.value))}
                hint="1 = National, 2 = Régional, 3 = District, …"
              />
              <FormInput
                label="Nom"
                required
                value={lv.name}
                onChange={(e) => setValue('name', e.target.value)}
                hint="Ex : National, Région, District, Commune"
              />
              <FormInput
                label="Code"
                value={lv.code ?? ''}
                onChange={(e) => setValue('code', e.target.value)}
                hint="Identifiant utilisé dans DHIS2"
              />
              <FormInput
                label="Nom d'affichage"
                value={lv.display_name ?? ''}
                onChange={(e) => setValue('display_name', e.target.value)}
                hint="Alias utilisé dans l'interface"
              />
              <FormCheckbox
                label="Actif"
                checked={Boolean(lv.is_active)}
                onChange={(e) => setValue('is_active', e.target.checked)}
              />
            </>
          )}
        />
      )}
    </div>
  );
});

OrgunitsTab.displayName = 'OrgunitsTab';

// ─────────────────────────────────────────────────────────────────────────────
// Sous-composant bouton de navigation
// ─────────────────────────────────────────────────────────────────────────────
function SubTabButton({ active, icon, label, onClick }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.375rem',
        padding: '0.375rem 0.875rem',
        borderRadius: '0.375rem 0.375rem 0 0',
        border: 'none',
        cursor: 'pointer',
        fontSize: '0.85rem',
        fontWeight: active ? 600 : 400,
        background: active ? 'var(--color-primary, #3b82f6)' : 'transparent',
        color: active ? '#fff' : 'var(--text-secondary, #64748b)',
        transition: 'background 0.15s, color 0.15s',
      }}
    >
      {icon}
      {label}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Bouton synchronisation DHIS2
// ─────────────────────────────────────────────────────────────────────────────
function SyncButton({ syncing, onClick }: { syncing: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={syncing}
      title="Synchroniser depuis DHIS2"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.35rem',
        padding: '0.3rem 0.75rem',
        borderRadius: '0.375rem',
        border: '1px solid var(--color-primary, #3b82f6)',
        background: 'transparent',
        color: 'var(--color-primary, #3b82f6)',
        cursor: syncing ? 'not-allowed' : 'pointer',
        fontSize: '0.8rem',
        opacity: syncing ? 0.6 : 1,
      }}
    >
      <RefreshCw size={13} style={syncing ? { animation: 'spin 1s linear infinite' } : undefined} />
      {syncing ? 'Synchronisation…' : 'Sync DHIS2'}
    </button>
  );
}
