import { Shield } from 'lucide-react';
import { forwardRef, useEffect, useState } from 'react';
import { StatusBadge } from '@components/ui/Badge/Badge';
import { type Column } from '@components/ui/Table/Table';
import { FormInput } from '@components/forms/FormInput/FormInput';
import { FormTextarea } from '@components/forms/FormTextarea/FormTextarea';
import { Tenant, Permission, Orgunit } from '@models/identity.model';
import { tenantService, orgunitService } from '@/services/identity.service';
import { FormSelect } from '@components/forms/FormSelect/FormSelect';
import { FormCheckbox } from '@components/forms/FormCheckbox/FormCheckbox';
import { AdminEntityCrudModuleRef, AdminEntityCrudModule } from '@pages/admins/AdminEntityCrudModule';

const defaultOrgunit: Orgunit = {
  id: null,
  name: "",
  description: "",
  tenant_id: null,
  code: "",
  is_active: false,
};

const orgunitColumns: Column<Orgunit>[] = [
  {
    key: "name",
    header: "Nom",
    sortable: true,
    searchable: true,
  },
  {
    key: "tenant",
    header: "Tenant",
    render: (ou) => ou ? ou.name : "",
    sortable: true,
    searchable: true,
  },
  {
    key: "description",
    header: "Description",
    sortable: true,
    searchable: true,
  },
  {
    key: "code",
    header: "Code",
    sortable: true,
    searchable: true,
  },
  {
    key: "is_active",
    header: "Statut",
    sortable: true,
    align: "center",
    render: (ou) => (<StatusBadge isActive={ou.is_active === true} />),
    searchable: false,
  },
];

export const OrgunitsTab = forwardRef<AdminEntityCrudModuleRef>((props, ref) => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [orgunits, setOrgunits] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const tenantRes = await tenantService.all();
      const orgunitRes = await orgunitService.all();
      setTenants(tenantRes || []);
      setOrgunits(orgunitRes || []);
    } catch {
      // showError(`Erreur chargement`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  return (
    <AdminEntityCrudModule<Orgunit>
      ref={ref}
      title="Gestion des unités d'organisation"
      icon={<Shield size={20} />}
      entityName="Orgunit"
      columns={orgunitColumns}
      defaultValue={defaultOrgunit}
      service={orgunitService}
      isValid={(r) => r.name.trim().length > 0}
      renderForm={(orgunit, setValue) => (
        <>
          <FormSelect
            label={`Tenant`}
            value={orgunit.tenant_id}
            options={tenants.map((c) => ({ value: c.id, label: c.name }))}
            onChange={(value) => { setValue("tenant_id", value) }}
            placeholder="Sélectionner Tenant"
            required
          />
          <FormInput
            label="Nom du Orgunit"
            value={orgunit.name}
            onChange={(e) => setValue("name", e.target.value)}
            required
          />
          <FormInput
            label="Code du Orgunit"
            value={orgunit.code}
            onChange={(e) => setValue("code", e.target.value)}
          />
          <FormSelect
            label={`Parent`}
            value={orgunit.parent_id}
            options={orgunits.filter(o => o.id !== orgunit.id).map((c) => ({ value: c.id, label: c.name }))}
            onChange={(value) => { setValue("parent_id", value) }}
            placeholder="Sélectionner Parent"
          />
          <FormCheckbox
            label={`Is Active`}
            checked={Boolean(orgunit.is_active)}
            onChange={(e) => setValue("is_active", e.target.checked)}
          />
          <FormTextarea
            label="Description"
            hint="Optionnel"
            placeholder="Description du orgunit"
            value={orgunit.description || ""}
            onChange={(e) => setValue("description", e.target.value)}
          />
        </>
      )}
    />
  );
});
