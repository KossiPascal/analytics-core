import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { Building2 } from 'lucide-react';
import { Tenant, TenantSource } from '@models/identity.model';
import { type Column } from '@components/ui/Table/Table';
import { FormInput } from '@components/forms/FormInput/FormInput';
import { FormTextarea } from '@components/forms/FormTextarea/FormTextarea';
import { tenantSourceService, tenantService } from '@services/identity.service';
import { AdminEntityCrudModuleRef, AdminEntityCrudModule } from '@pages/admins/AdminEntityCrudModule';
import { useAuth } from "@/contexts/AuthContext";
import { FormSelect } from "@/components/forms/FormSelect/FormSelect";
import { FaDatabase, FaLock } from "react-icons/fa";

import styles from '@pages/admins/AdminPage.module.css';
import { FormSwitch } from "@/components/forms/FormSwitch/FormSwitch";

// Default value
const createDefaultQuery = (tenant_id: number): TenantSource => ({
  id: null,
  name: '',
  tenant_id: tenant_id,
  fetch_limit: 2000,
  chunk_size: 1000,
  host: '',
  target: 'cht',
  username: undefined,
  password: undefined,
  config: {},
  https: true,
  update_auth: false,
  is_active: true,
});

// Columns definition
const tenantColumns: Column<TenantSource>[] = [
  {
    key: "name",
    header: "name",
    sortable: true,
    searchable: true,
  },
  {
    key: "host",
    header: "host",
    sortable: true,
    searchable: true,
  },
  {
    key: "target",
    header: "target",
    sortable: true,
    searchable: true,
  },
  {
    key: "tenant",
    header: "tenant",
    sortable: true,
    searchable: true,
    render: (t) => t.tenant?.name ?? '-',
  },
  {
    key: "config",
    header: "config",
    sortable: true,
    searchable: true,
    render: (t) => JSON.stringify(t.config ?? {}),
  },
  {
    key: "fetch_limit",
    header: "Taille par requete",
    sortable: true,
    searchable: true,
  },
  {
    key: "chunk_size",
    header: "Taille de lot",
    sortable: true,
    searchable: true,
  },
];

export const TenantSourcesTab = forwardRef<AdminEntityCrudModuleRef>((props, ref) => {
  const { isSuperAdmin, user } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenant_id, setTenantId] = useState<number | undefined>();

  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    tenantService.list().then(t => {
      setTenants(t || []);
      setTenantId(user?.tenant_id);
    });
  }, []);

  const defaultTenant = useMemo(() => ({ required: true, ids: [tenant_id] }), [tenant_id]);
  const defaultForm = useMemo(() => createDefaultQuery(tenant_id ?? 0), [tenant_id]);


  return (
    <>
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

      <AdminEntityCrudModule<TenantSource>
        ref={ref}
        title="Gestion des TenantSource"
        icon={<Building2 size={20} />}
        entityName="TenantSource"
        columns={tenantColumns}
        defaultValue={defaultForm}
        service={tenantSourceService}
        defaultTenant={defaultTenant}
        isValid={(source: TenantSource): boolean => {
          return source.host.trim().length > 0;
        }}
        renderForm={(source, setValue) => {

          const isEditing = !!source.id;

          return (
            <>
              <FormInput
                label="Nom"
                placeholder="Ex: kendeya"
                value={source.name}
                onChange={(e) => setValue("name", e.target.value)}
                required
                leftIcon={<Building2 size={18} />}
              />
              <FormInput
                label="Host"
                placeholder="Ex: https://kendeya-analytics.org"
                value={source.host}
                onChange={(e) => setValue("host", e.target.value)}
                required
                leftIcon={<Building2 size={18} />}
              />

              <FormSelect
                label="Target"
                value={source.target}
                options={['cht', 'dhis2'].map((c) => ({ value: c, label: c }))}
                onChange={(value) => setValue("target", value)}
                leftIcon={<FaDatabase />}
                required
              />

              {isEditing && (<FormSwitch
                label={`Modifier Auth`}
                checked={Boolean(source.update_auth)}
                onChange={(e) => setValue("update_auth", e.target.checked)}
              />)}
              <br />


              {(!isEditing || isEditing && source.update_auth) && (
                <>
                  <FormInput
                    label="Username"
                    placeholder="Ex: kendeya"
                    value={source.username}
                    onChange={(e) => setValue("username", e.target.value)}
                    required
                    leftIcon={<Building2 size={18} />}
                  />
                  <FormInput
                    label="Password"
                    type="password"
                    placeholder="••••••••"
                    value={source.password}
                    onChange={(e) => setValue("password", e.target.value)}
                    leftIcon={<FaLock size={18} />}
                  />

                  <br />
                </>)}

              <div className={styles.grid + ' ' + styles.grid2}>
                <FormSwitch
                  label={`Secure Https`}
                  checked={Boolean(source.https)}
                  onChange={(e) => setValue("https", e.target.checked)}
                />
                <FormSwitch
                  label={`Is Active`}
                  checked={Boolean(source.is_active)}
                  onChange={(e) => setValue("is_active", e.target.checked)}
                />
              </div>
              <br />

              <div className={styles.grid + ' ' + styles.grid2}>
                <FormInput
                  label="Taille par requete"
                  type="number"
                  placeholder="Taille par requete"
                  value={source.fetch_limit}
                  onChange={(e) => setValue("fetch_limit", e.target.value)}
                  required
                  leftIcon={<Building2 size={18} />}
                />

                <FormInput
                  label="Taille de lot"
                  type="number"
                  placeholder="Taille de lot"
                  value={source.chunk_size}
                  onChange={(e) => setValue("chunk_size", e.target.value)}
                  required
                  leftIcon={<Building2 size={18} />}
                />
              </div>

              <FormTextarea
                label="Config"
                hint="Optionnel"
                placeholder="Config"
                value={JSON.stringify(source.config || {})}
                onChange={(e) => setValue("config", e.target.value)}
                rows={3}
              />
            </>
          );
        }} />
    </>
  );
});