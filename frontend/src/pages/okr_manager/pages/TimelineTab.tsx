import { useEffect, useState, useMemo, forwardRef } from "react";
import { AdminEntityCrudModule, AdminEntityCrudModuleRef } from "@pages/admins/AdminEntityCrudModule";
import { Column } from "@components/ui/Table/Table";
import { FormInput } from "@components/forms/FormInput/FormInput";
import { FormTextarea } from "@components/forms/FormTextarea/FormTextarea";
// import { FormDate } from "@components/forms/FormDate/FormDate";
import { timelineService } from "../services";
import { ActivityStatusEnum, OkrProjectTimelineItem } from "../models";


const DEFAULT: OkrProjectTimelineItem = {
  id: null,
  name: "",
  description: "",
  project_id: undefined,
  start_date: "",
  end_date: "",
  status: ActivityStatusEnum.PLANNED,
};

export const TimelineTab = forwardRef<AdminEntityCrudModuleRef>((_, ref) => {
  const columns: Column<OkrProjectTimelineItem>[] = [
    { key: "name", header: "Nom", searchable: true },
    { key: "start_date", header: "Début" },
    { key: "end_date", header: "Fin" },
    { key: "status", header: "Statut" },
  ];

  return (
    <AdminEntityCrudModule<OkrProjectTimelineItem>
      ref={ref}
      icon={undefined}
      title="Timeline / Gantt"
      entityName="timeline_item"
      service={timelineService}
      columns={columns}
      defaultValue={DEFAULT}
      isValid={(t) => !!t.name && t.name.trim().length > 0}
      renderForm={(e, set) => (
        <>
          <FormInput label="Nom" value={e.name} onChange={(v) => set("name", v.target.value)} />
          <FormTextarea label="Description" value={e.description} onChange={(v) => set("description", v.target.value)} />
          <FormInput type="date" label="Date de début" value={e.start_date} onChange={(v) => set("start_date", v)} />
          <FormInput type="date" label="Date de fin" value={e.end_date} onChange={(v) => set("end_date", v)} />
          <FormInput label="Statut" value={e.status} onChange={(v) => set("status", v.target.value)} />
        </>
      )}
    />
  );
});