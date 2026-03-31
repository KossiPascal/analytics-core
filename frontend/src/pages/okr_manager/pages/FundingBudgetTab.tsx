import { forwardRef, useMemo } from "react";
import { DollarSign } from "lucide-react";

import { AdminEntityCrudModule, AdminEntityCrudModuleRef } from "@pages/admins/AdminEntityCrudModule";
import { Column } from "@components/ui/Table/Table";
import { FormInput } from "@components/forms/FormInput/FormInput";
import { FormSelect } from "@components/forms/FormSelect/FormSelect";

import { fundingService } from "../services";
import { Funding, Currency } from "../models";

const DEFAULT: Funding = {
  id: null,
  tenant_id: undefined,
  project_id: undefined,
  donor: "",
  amount: 0,
  currency: "USD",
};

export const FundingBudgetTab = forwardRef<AdminEntityCrudModuleRef>((_, ref) => {

  const columns: Column<Funding>[] = useMemo(() => [
    { key: "donor", header: "Donor", searchable: true },
    { key: "amount", header: "Amount" },
    { key: "currency", header: "Currency" },
  ], []);

  return (
    <AdminEntityCrudModule<Funding>
      ref={ref}
      title="Funding / Budget"
      entityName="funding"
      service={fundingService}
      icon={<DollarSign />}
      columns={columns}
      defaultValue={DEFAULT}
      
      isValid={(f) => !!f.donor && f.donor.trim().length > 0 && f.amount > 0}

      renderForm={(e, set) => (
        <>
          <FormInput
            label="Donor"
            value={e.donor}
            onChange={(ev) => set("donor", ev.target.value)}
          />
          <FormInput
            label="Amount"
            type="number"
            value={e.amount}
            onChange={(ev) => set("amount", Number(ev.target.value))}
          />
          <FormSelect
            label="Currency"
            value={e.currency || "USD"}
            options={["USD", "EUR", "GBP", "XOF"].map(c => ({ value: c, label: c }))}
            onChange={(v) => set("currency", v as Currency)}
          />
        </>
      )}
    />
  );
});