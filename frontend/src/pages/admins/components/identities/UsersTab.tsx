import { RefreshCw, User as UserIcon, Network } from 'lucide-react';
import { StatusBadge } from '@components/ui/Badge/Badge';
import { type Column } from '@components/ui/Table/Table';
import { FormInput } from '@components/forms/FormInput/FormInput';
import { Tenant, Role, User, Orgunit } from '@models/identity.model';
import { tenantService, roleService, userService, orgunitService, identitySyncService, AscSyncResult } from '@services/identity.service';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { FormCheckbox } from '@components/forms/FormCheckbox/FormCheckbox';
import { FormMultiSelect } from '@components/forms/FormSelect/FormMultiSelect';
import { FormSelect } from '@components/forms/FormSelect/FormSelect';
import { AdminEntityCrudModuleRef, AdminEntityCrudModule } from '@pages/admins/AdminEntityCrudModule';
import { Modal } from '@components/ui/Modal/Modal';
import { Button } from '@components/ui/Button/Button';
import styles from '@pages/admins/AdminPage.module.css';
import { useAuth } from '@/contexts/AuthContext';
import { FaDatabase } from 'react-icons/fa';

const defaultUser: User = {
  id: null,
  username: "",
  lastname: "",
  firstname: "",
  password: "",
  password_confirm: '',
  email: "",
  phone: "",
  tenant_id: null,
  role_ids: [],
  permission_ids: [],
  orgunit_ids: [],
  is_active: false,
};

const userColumns: Column<User>[] = [
  {
    key: "tenant",
    header: "Tenant",
    render: (u) => u.tenant?.name || "-",
    sortable: true,
    searchable: true,
    getSearchValue: (u) => u.tenant?.name || "",
    getSortValue: (u) => u.tenant?.name || "",
  },
  {
    key: "username",
    header: "Username",
    sortable: true,
    searchable: true,
  },
  {
    key: "lastname",
    header: "Nom",
    sortable: true,
    searchable: true,
  },
  {
    key: "firstname",
    header: "Prénoms",
    sortable: true,
    searchable: true,
  },
  {
    key: "email",
    header: "Email",
    sortable: true,
    searchable: true,
  },
  {
    key: "phone",
    header: "Téléphone",
    sortable: true,
    searchable: true,
  },
  {
    key: "roles",
    header: "Rôles",
    render: (u) => u.roles?.length ? u.roles.map((r) => r.name).join(", ") : "-",
    sortable: true,
    searchable: true,
    getSearchValue: (u) => u.roles?.map((r) => r.name).join(" ") || "",
    getSortValue: (u) => u.roles?.map((r) => r.name).join(", ") || "",
  },
  {
    key: "permissions",
    header: "Permissions",
    render: (u) => u.permissions?.length ? u.permissions.map((p) => p.name).join(", ") : "-",
    sortable: true,
    searchable: true,
    getSearchValue: (u) => u.permissions?.map((p) => p.name).join(" ") || "",
    getSortValue: (u) => u.permissions?.map((p) => p.name).join(", ") || "",
  },
  {
    key: "orgunits",
    header: "Orgunits",
    render: (u) => u.orgunits?.length ? u.orgunits.map((o) => o.name).join(", ") : "-",
    sortable: true,
    searchable: true,
    getSearchValue: (u) => u.orgunits?.map((o) => o.name).join(" ") || "",
    getSortValue: (u) => u.orgunits?.map((o) => o.name).join(", ") || "",
  },
  {
    key: "is_active",
    header: "Statut",
    align: "center",
    sortable: true,
    searchable: false,
    render: (u) => (<StatusBadge isActive={u.is_active === true} />),
    getSortValue: (u) => u.is_active ? 1 : 0,
  },
];

export const UsersTab = forwardRef<AdminEntityCrudModuleRef>((_props, ref) => {
  const moduleRef = useRef<AdminEntityCrudModuleRef>(null);
  const { isSuperAdmin, user } = useAuth();

  useImperativeHandle(ref, () => ({
    handleNew: () => moduleRef.current?.handleNew(),
    refresh: () => moduleRef.current?.refresh(),
  }));

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [orgunits, setOrgunits] = useState<Orgunit[]>([]);
  const [tenant_id, setTenantId] = useState<number | undefined>();

  // ── Assign Orgunits ───────────────────────────────────────────────────────
  const [orgunitModalUser, setOrgunitModalUser] = useState<User | null>(null);
  const [selectedOrgunitIds, setSelectedOrgunitIds] = useState<number[]>([]);
  const [savingOrgunits, setSavingOrgunits] = useState(false);
  const [orgunitMsg, setOrgunitMsg] = useState<string | null>(null);

  useEffect(() => {
    if (orgunitModalUser) {
      setSelectedOrgunitIds(orgunitModalUser.orgunit_ids ?? []);
      setOrgunitMsg(null);
    }
  }, [orgunitModalUser]);

  const handleSaveOrgunits = async () => {
    if (!orgunitModalUser?.id) return;
    setSavingOrgunits(true);
    setOrgunitMsg(null);
    try {
      await userService.update(orgunitModalUser.id, { ...orgunitModalUser, orgunit_ids: selectedOrgunitIds });
      setOrgunitMsg('✓ Zones d\'intervention mises à jour');
      setTimeout(() => {
        setOrgunitModalUser(null);
        moduleRef.current?.refresh();
      }, 800);
    } catch {
      setOrgunitMsg('Erreur lors de la sauvegarde');
    } finally {
      setSavingOrgunits(false);
    }
  };

  // ── Sync ASC ──────────────────────────────────────────────────────────────
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [syncTenantId, setSyncTenantId] = useState<number | null>(null);
  const [syncPositionCode, setSyncPositionCode] = useState('ASC');
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  const handleSyncAscs = async () => {
    if (!syncTenantId) return;
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res: AscSyncResult = await identitySyncService.syncAscs(syncTenantId, syncPositionCode || 'ASC');
      const skippedPart = res.skipped ? `, ${res.skipped} ignorés (username pris)` : '';
      setSyncMsg(
        `✓ ${res.created_users} users créés, ${res.updated_users} mis à jour${skippedPart} — ` +
        `${res.created_employees} employés créés, ${res.updated_employees} mis à jour (${res.total} total DHIS2)`
      );
      setSyncModalOpen(false);
      fetchInitialData();
    } catch (e) {
      setSyncMsg(`Erreur : ${e instanceof Error ? e.message : 'Synchronisation DHIS2 échouée'}`);
    } finally {
      setSyncing(false);
    }
  };

  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    tenantService.all().then(t => {
      setTenants(t || []);
      setTenantId(user?.tenant_id);
    });
  }, []);

  const fetchInitialData = async () => {
    if (!tenant_id) return;
    try {
      const [roleRes, orgunitRes] = await Promise.all([
        roleService.all(tenant_id),
        orgunitService.all(tenant_id),
      ]);
      setRoles(roleRes || []);
      setOrgunits(orgunitRes || []);
    } catch {
      // showError(`Erreur chargement`);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [tenant_id]);

  const tenantOptions = tenants.map((t) => ({ value: t.id, label: t.name }));

  return (
    <>
      {/* ── Modal attribution des zones d'intervention ───────────────────────── */}
      <Modal
        isOpen={!!orgunitModalUser}
        onClose={() => setOrgunitModalUser(null)}
        title={`Zones d'intervention — ${orgunitModalUser?.firstname} ${orgunitModalUser?.lastname}`}
        size="sm"
        footer={
          <div className={styles.buttonGroup}>
            <Button variant="outline" size="sm" onClick={() => setOrgunitModalUser(null)} disabled={savingOrgunits}>
              Annuler
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveOrgunits} disabled={savingOrgunits}>
              {savingOrgunits ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <FormMultiSelect
            label="Zones d'intervention"
            value={selectedOrgunitIds}
            options={orgunits.map((o) => ({ value: o.id, label: o.name }))}
            onChange={(values) => setSelectedOrgunitIds(values.filter((v): v is number => v !== null))}
            placeholder="Sélectionner les zones"
            searchable
            searchPlaceholder="Rechercher une zone..."
          />
          {orgunitMsg && (
            <div style={{
              padding: '0.5rem 0.75rem',
              borderRadius: '0.375rem',
              fontSize: '0.82rem',
              background: orgunitMsg.startsWith('✓') ? 'var(--color-success-bg, #f0fdf4)' : 'var(--color-error-bg, #fef2f2)',
              color: orgunitMsg.startsWith('✓') ? 'var(--color-success, #16a34a)' : 'var(--color-error, #dc2626)',
            }}>
              {orgunitMsg}
            </div>
          )}
        </div>
      </Modal>

      {/* ── Modal de synchronisation ASC ──────────────────────────────────────── */}
      <Modal
        isOpen={syncModalOpen}
        onClose={() => { setSyncModalOpen(false); setSyncMsg(null); }}
        title="Synchroniser les ASC depuis DHIS2"
        size="sm"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.25rem 0' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #64748b)', margin: 0 }}>
            Cette opération importe les utilisateurs DHIS2 comme comptes système
            et crée simultanément un profil employé pour chacun.
          </p>

          <FormSelect
            label="Tenant cible"
            required
            value={syncTenantId}
            options={tenantOptions}
            onChange={(v) => setSyncTenantId(v as number | null)}
            placeholder="Sélectionner un tenant"
          />

          <FormInput
            label="Code du poste ASC"
            value={syncPositionCode}
            onChange={(e) => setSyncPositionCode(e.target.value)}
            hint="Le poste avec ce code sera assigné aux employés créés (ex : ASC)"
          />

          {syncMsg && (
            <div style={{
              padding: '0.5rem 0.75rem',
              borderRadius: '0.375rem',
              fontSize: '0.82rem',
              background: syncMsg.startsWith('✓') ? 'var(--color-success-bg, #f0fdf4)' : 'var(--color-error-bg, #fef2f2)',
              color: syncMsg.startsWith('✓') ? 'var(--color-success, #16a34a)' : 'var(--color-error, #dc2626)',
            }}>
              {syncMsg}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button
              onClick={() => { setSyncModalOpen(false); setSyncMsg(null); }}
              disabled={syncing}
              style={{ padding: '0.4rem 1rem', borderRadius: '0.375rem', border: '1px solid var(--border-color, #e2e8f0)', background: 'transparent', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              Annuler
            </button>
            <button
              onClick={handleSyncAscs}
              disabled={syncing || !syncTenantId}
              style={{
                padding: '0.4rem 1rem',
                borderRadius: '0.375rem',
                border: 'none',
                background: (!syncing && syncTenantId) ? 'var(--color-primary, #3b82f6)' : 'var(--border-muted, #cbd5e1)',
                color: '#fff',
                cursor: (!syncing && syncTenantId) ? 'pointer' : 'not-allowed',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <RefreshCw size={13} style={syncing ? { animation: 'spin 1s linear infinite' } : undefined} />
              {syncing ? 'Synchronisation…' : 'Lancer la synchronisation'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Message résultat (hors modal) ─────────────────────────────────────── */}
      {syncMsg && !syncModalOpen && (
        <div style={{
          marginBottom: '0.75rem',
          padding: '0.5rem 0.75rem',
          borderRadius: '0.375rem',
          fontSize: '0.82rem',
          background: syncMsg.startsWith('✓') ? 'var(--color-success-bg, #f0fdf4)' : 'var(--color-error-bg, #fef2f2)',
          color: syncMsg.startsWith('✓') ? 'var(--color-success, #16a34a)' : 'var(--color-error, #dc2626)',
        }}>
          {syncMsg}
        </div>
      )}


      <div className="grid grid-cols-2 gap-4 pt-2">
        <FormSelect
          label="Tenant"
          value={tenant_id}
          options={tenants.map((t) => ({ value: t.id, label: t.name }))}
          onChange={(value) => setTenantId(value)}
          leftIcon={<FaDatabase />}
          required
        />
      </div>

      <AdminEntityCrudModule<User>
        ref={moduleRef}
        title="Gestion des utilisateurs"
        icon={<UserIcon size={20} />}
        entityName="User"
        columns={userColumns}
        defaultValue={defaultUser}
        service={userService}
        headerActions={
          <button
            onClick={() => { setSyncMsg(null); setSyncModalOpen(true); }}
            title="Synchroniser les ASC depuis DHIS2"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.3rem 0.75rem',
              borderRadius: '0.375rem',
              border: '1px solid var(--color-primary, #3b82f6)',
              background: 'transparent',
              color: 'var(--color-primary, #3b82f6)',
              cursor: 'pointer',
              fontSize: '0.8rem',
            }}
          >
            <RefreshCw size={13} />
            Sync ASC DHIS2
          </button>
        }
        customActions={(user) => (
          <button
            className={styles.actionBtn}
            title="Attribuer des zones d'intervention"
            onClick={() => setOrgunitModalUser(user)}
          >
            <Network size={16} />
          </button>
        )}
        isValid={(u) => {
          if (!u.username || !u.lastname || !u.firstname) return false;
          const isVaid = (
            u.username.trim().length > 0 &&
            u.lastname.trim().length > 0 &&
            u.firstname.trim().length > 0
          )
          return isVaid && (u.password === u.password_confirm);
        }
        }
        renderForm={(user, setValue) => (
          <>
            <FormSelect
              label={`Tenant`}
              value={user.tenant_id}
              options={tenants.map((c) => ({ value: c.id, label: c.name }))}
              onChange={(value) => { setValue("tenant_id", value) }}
              placeholder="Sélectionner Tenant"
              required
            />
            <FormInput
              label="Username"
              value={user.username}
              onChange={(e) => setValue("username", e.target.value)}
              required
            />
            <FormInput
              label="Nom"
              value={user.lastname}
              onChange={(e) => setValue("lastname", e.target.value)}
              required
            />
            <FormInput
              label="Prénoms"
              value={user.firstname}
              onChange={(e) => setValue("firstname", e.target.value)}
              required
            />
            <FormInput
              label="Email"
              type="email"
              value={user.email}
              onChange={(e) => setValue("email", e.target.value)}
            />
            <FormInput
              label="Mot de passe"
              type="password"
              value={user.password}
              onChange={(e) => setValue("password", e.target.value)}
              placeholder="........"
              required={user.id === null}
            />
            <FormInput
              label="Confirme Mot de passe"
              type="password"
              value={user.password_confirm}
              onChange={(e) => setValue("password_confirm", e.target.value)}
              placeholder="........"
              required={user.id === null}
            />
            <FormInput
              label="Téléphone"
              type="tel"
              value={user.phone}
              onChange={(e) => setValue("phone", e.target.value)}
            />
            <FormMultiSelect
              label={`Rôles`}
              value={user.role_ids}
              options={roles.map((r) => ({ value: r.id, label: r.name }))}
              onChange={(values) => setValue("role_ids", values.filter(v => v !== null))}
              placeholder="Sélectionner Rôle"
              required
            />
            <FormMultiSelect
              label={`Orgunits`}
              value={user.orgunit_ids}
              options={orgunits.map((c) => ({ value: c.id, label: c.name }))}
              onChange={(values) => setValue("orgunit_ids", values.filter(v => v !== null))}
              placeholder="Sélectionner Permissions"
              required
            />
            <FormCheckbox
              label={`Actif`}
              checked={Boolean(user.is_active)}
              onChange={(e) => setValue("is_active", e.target.checked)}
            />
          </>
        )}
      />
    </>
  );
});



// import { UserPlus, Edit2, Trash2 } from 'lucide-react';
// import { Table, type Column } from '@components/ui/Table/Table';
// import { Button } from '@components/ui/Button/Button';
// import { StatusBadge, RoleBadge } from '@components/ui/Badge/Badge';
// import shared from '@components/ui/styles/shared.module.css';
// import { User } from '../../../models/identity.model';
// import { userService } from '@/services/identity.service';



// userService
// export function UsersTab({users,isLoading,onEdit,onDelete,onCreate,getRolesName}: UserProp) {
//   const columns: Column<User>[] = [
//     {
//       key: 'username',
//       header: "Nom d'utilisateur",
//       sortable: true,
//       searchable: true,
//     },
//     {
//       key: 'fullname',
//       header: 'Nom complet',
//       sortable: true,
//       searchable: true,
//       render: (user) => user.fullname || '-',
//     },
//     {
//       key: 'email',
//       header: 'Email',
//       sortable: true,
//       searchable: true,
//       render: (user) => user.email || '-',
//     },
//     {
//       key: 'roles',
//       header: 'Rôles',
//       render: (user) => <RoleBadge>{getRolesName(user)}</RoleBadge>,
//       searchable: false,
//     },
//     {
//       key: 'isActive',
//       header: 'Statut',
//       sortable: true,
//       align: 'center',
//       render: (user) => <StatusBadge isActive={user.isActive} />,
//       searchable: false,
//     },
//     {
//       key: 'id',
//       header: 'Actions',
//       align: 'center',
//       render: (user) => (
//         <div className={shared.actionsCell}>
//           <button className={shared.actionBtn} onClick={() => onEdit(user)} title="Modifier">
//             <Edit2 size={16} />
//           </button>
//           <button
//             className={`${shared.actionBtn} ${shared.actionBtnDanger}`}
//             onClick={() => onDelete(user)}
//             title="Supprimer"
//           >
//             <Trash2 size={16} />
//           </button>
//         </div>
//       ),
//       searchable: false,
//     },
//   ];

//   if (users.length === 0 && !isLoading) {
//     return (
//       <div className={shared.emptyState}>
//         <UserPlus size={48} />
//         <p>Aucun utilisateur</p>
//         <Button variant="primary" onClick={onCreate}>
//           Créer un utilisateur
//         </Button>
//       </div>
//     );
//   }

//   return (
//     <Table
//       data={users as any}
//       columns={columns as any}
//       keyExtractor={(user: any) => user.id as string}
//       isLoading={isLoading}
//       emptyMessage="Aucun utilisateur trouvé"
//       features={{
//         search: true,
//         export: true,
//         pagination: true,
//         pageSize: true,
//         animate: true,
//         columnVisibility: true,
//       }}
//       searchPlaceholder="Rechercher un utilisateur..."
//       exportFilename="utilisateurs"
//       exportFormats={['csv', 'excel', 'json']}
//       defaultPageSize={10}
//       pageSizeOptions={[10, 25, 50, 100]}
//       stickyHeader
//     />
//   );
// }
