import { forwardRef, useMemo } from "react";
import { Calendar } from "lucide-react";

import { AdminEntityCrudModule, AdminEntityCrudModuleRef } from "@pages/admins/AdminEntityCrudModule";
import { Column } from "@components/ui/Table/Table";
import { FormInput } from "@components/forms/FormInput/FormInput";
import { FormTextarea } from "@components/forms/FormTextarea/FormTextarea";

import { okrGlobalService } from "../services";
import { OkrGlobal } from "../models";

const DEFAULT: OkrGlobal = {
  id: null,
  tenant_id: undefined,
  name: "",
  description: "",
  start_date: null,
  end_date: null,
  teams: [],
  snapshots: [],
};

export const GlobalPerformanceTab = forwardRef<AdminEntityCrudModuleRef>((_, ref) => {

  const columns: Column<OkrGlobal>[] = useMemo(() => [
    { key: "name", header: "Cycle Name", searchable: true },
    { key: "start_date", header: "Start Date" },
    { key: "end_date", header: "End Date" },
    { key: "teams", header: "Teams", render: (g) => g.teams?.length || 0 },
    { key: "snapshots", header: "Snapshots", render: (g) => g.snapshots?.length || 0 },
  ], []);

  return (
    <AdminEntityCrudModule<OkrGlobal>
      ref={ref}
      title="Global Performance"
      entityName="okr_global"
      service={okrGlobalService}
      icon={<Calendar />}
      columns={columns}
      defaultValue={DEFAULT}
      
      isValid={(g) =>
        !!g.name && g.name.trim().length > 0 &&
        !!g.start_date && !!g.end_date
      }

      renderForm={(g, set) => (
        <>
          <FormInput
            label="Name"
            value={g.name}
            onChange={(ev) => set("name", ev.target.value)}
          />
          <FormTextarea
            label="Description"
            value={g.description || ""}
            onChange={(ev) => set("description", ev.target.value)}
          />
          <FormInput
            label="Start Date"
            type="date"
            value={g.start_date || ""}
            onChange={(ev) => set("start_date", ev.target.value)}
          />
          <FormInput
            label="End Date"
            type="date"
            value={g.end_date || ""}
            onChange={(ev) => set("end_date", ev.target.value)}
          />
        </>
      )}
    />
  );
});