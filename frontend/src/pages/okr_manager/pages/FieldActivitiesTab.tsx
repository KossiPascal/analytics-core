import { forwardRef, useMemo } from "react";
import { Activity as ActivityIcon} from "lucide-react";

import { AdminEntityCrudModule, AdminEntityCrudModuleRef } from "@pages/admins/AdminEntityCrudModule";
import { Column } from "@components/ui/Table/Table";
import { FormInput } from "@components/forms/FormInput/FormInput";
import { FormTextarea } from "@components/forms/FormTextarea/FormTextarea";
import { FormSelect } from "@components/forms/FormSelect/FormSelect";
import { StatusBadge } from "@components/ui/Badge/Badge";

import { activityService } from "../services";
import { Activity, ActivityStatusEnum, ActivityPriorityEnum } from "../models";

const DEFAULT: Activity = {
  id: null,
  tenant_id: undefined,
  project_id: undefined,
  team_id: undefined,

  name: "",
  description: "",

  start_date: "",
  end_date: "",
  due_date: "",

  status: ActivityStatusEnum.PLANNED,
  priority: ActivityPriorityEnum.MEDIUM,

  budget: null,
  spent_budget: 0,
  progress: 0,
  currency: "USD",
  beneficiaries: null,

  owners: [],
  kr_links: [],
  indicator_values: [],
};

export const FieldActivitiesTab = forwardRef<AdminEntityCrudModuleRef>((_, ref) => {

  const columns: Column<Activity>[] = useMemo(() => [
    { key: "name", header: "Nom", searchable: true },
    { 
      key: "status", 
      header: "Statut", 
      render: (a) => a.status
      // render: (a) => <StatusBadge label={a.status} /> 
    },
    { key: "priority", header: "Priorité" },
    { key: "progress", header: "Progression (%)" },
    { key: "beneficiaries", header: "Bénéficiaires" },
  ], []);

  return (
    <AdminEntityCrudModule<Activity>
      ref={ref}
      title="Field Activities"
      entityName="activity"
      service={activityService}
      icon={<ActivityIcon />}
      columns={columns}
      defaultValue={DEFAULT}

      isValid={(a) =>
        !!a.name &&
        a.name.trim().length > 0
      }

      renderForm={(e, set) => (
        <>
          <FormInput
            label="Nom"
            value={e.name}
            onChange={(ev) => set("name", ev.target.value)}
          />

          <FormTextarea
            label="Description"
            value={e.description || ""}
            onChange={(ev) => set("description", ev.target.value)}
          />

          <FormSelect
            label="Statut"
            value={e.status}
            options={Object.values(ActivityStatusEnum).map(s => ({ value: s, label: s }))}
            onChange={(v) => set("status", v)}
          />

          <FormSelect
            label="Priorité"
            value={e.priority}
            options={Object.values(ActivityPriorityEnum).map(p => ({ value: p, label: p }))}
            onChange={(v) => set("priority", v)}
          />

          <FormInput
            type="number"
            label="Progression (%)"
            value={e.progress || 0}
            onChange={(ev) => set("progress", Number(ev.target.value))}
          />

          <FormInput
            type="number"
            label="Bénéficiaires"
            value={e.beneficiaries || 0}
            onChange={(ev) => set("beneficiaries", Number(ev.target.value))}
          />

          <FormInput
            type="date"
            label="Date de début"
            value={e.start_date || ""}
            onChange={(ev) => set("start_date", ev.target.value)}
          />

          <FormInput
            type="date"
            label="Date de fin"
            value={e.end_date || ""}
            onChange={(ev) => set("end_date", ev.target.value)}
          />

          <FormInput
            type="date"
            label="Date limite"
            value={e.due_date || ""}
            onChange={(ev) => set("due_date", ev.target.value)}
          />

          <FormInput
            type="number"
            label="Budget prévu"
            value={e.budget || ""}
            onChange={(ev) => set("budget", ev.target.value)}
          />

          <FormInput
            type="number"
            label="Budget dépensé"
            value={e.spent_budget || 0}
            onChange={(ev) => set("spent_budget", Number(ev.target.value))}
          />
        </>
      )}
    />
  );
});