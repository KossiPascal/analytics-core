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
};

export const GlobalOkrTab = forwardRef<AdminEntityCrudModuleRef>((_, ref) => {

  const columns: Column<OkrGlobal>[] = useMemo(() => [
    { key: "name", header: "Cycle Name", searchable: true },
    { key: "start_date", header: "Start Date" },
    { key: "end_date", header: "End Date" },
    { key: "teams", header: "Teams", render: (okr) => okr.teams?.length || 0 },
    { key: "snapshots", header: "Snapshots", render: (okr) => okr.snapshots?.length || 0 },
  ], []);

  return (
    <AdminEntityCrudModule<OkrGlobal>
      ref={ref}
      title="Global OKRs"
      entityName="global"
      service={okrGlobalService}
      icon={<Calendar />}
      columns={columns}
      defaultValue={DEFAULT}
      
      isValid={(o) => !!o.name && o.name.trim().length > 0 && !!o.start_date && !!o.end_date}

      renderForm={(e, set) => (
        <>
          <FormInput
            label="Name"
            value={e.name}
            onChange={(ev) => set("name", ev.target.value)}
          />
          <FormTextarea
            label="Description"
            value={e.description || ""}
            onChange={(ev) => set("description", ev.target.value)}
          />
          <FormInput
            label="Start Date"
            type="date"
            value={e.start_date || ""}
            onChange={(ev) => set("start_date", ev.target.value)}
          />
          <FormInput
            label="End Date"
            type="date"
            value={e.end_date || ""}
            onChange={(ev) => set("end_date", ev.target.value)}
          />
        </>
      )}
    />
  );
});