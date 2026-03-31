import { AlertTriangle } from 'lucide-react';
import { forwardRef, useMemo } from 'react';
import { AdminEntityCrudModule, AdminEntityCrudModuleRef } from '@pages/admins/AdminEntityCrudModule';
import { Column } from '@components/ui/Table/Table';
import { FormInput } from '@components/forms/FormInput/FormInput';
import { FormTextarea } from '@components/forms/FormTextarea/FormTextarea';
import { FormSelect } from '@components/forms/FormSelect/FormSelect';

import { ProjectRisk, RiskLevelEnum } from '../models';
import { risksService } from '../services';


export const RiskTab = forwardRef<AdminEntityCrudModuleRef>((_, ref) => {

    const DEFAULT: ProjectRisk = {
        id: null,
        tenant_id: undefined,
        project_id: undefined,
        name: '',
        description: '',
        level: RiskLevelEnum.LOW,
        mitigation_plan: '',
        impact: null,
        probability: null
    };

    const levelOptions = useMemo(() => 
        Object.values(RiskLevelEnum).map(lvl => ({ label: lvl, value: lvl })), 
    []);

    const columns: Column<ProjectRisk>[] = [
        { key: 'name', header: 'Risque', searchable: true },
        { key: 'level', header: 'Niveau', render: (r) => r.level },
        { key: 'impact', header: 'Impact', render: (r) => r.impact ?? '-' },
        { key: 'probability', header: 'Probabilité', render: (r) => r.probability ?? '-' },
        { key: 'mitigation_plan', header: 'Plan de mitigation', render: (r) => r.mitigation_plan || '-' }
    ];

    return (
        <AdminEntityCrudModule<ProjectRisk>
            ref={ref}
            title="Risques"
            entityName="risk"
            service={risksService}
            icon={<AlertTriangle />}
            columns={columns}
            defaultValue={DEFAULT}
            isValid={(e) => !!e.name && e.name.trim().length > 0}
            onBeforeSave={(e) => ({
                ...e,
                impact: e.impact != null ? Number(e.impact) : null,
                probability: e.probability != null ? Number(e.probability) : null,
                mitigation_plan: e.mitigation_plan || null
            })}
            renderForm={(e, set) => (
                <>
                    <FormInput
                        label="Nom"
                        value={e.name}
                        onChange={(v) => set('name', v.target.value)}
                    />

                    <FormTextarea
                        label="Description"
                        value={e.description || ''}
                        onChange={(v) => set('description', v.target.value)}
                    />

                    <FormSelect
                        label="Niveau"
                        value={e.level}
                        options={levelOptions}
                        onChange={(v) => set('level', v)}
                    />

                    <FormInput
                        label="Impact"
                        type="number"
                        value={e.impact ?? ''}
                        onChange={(v) => set('impact', v.target.value ? Number(v.target.value) : null)}
                    />

                    <FormInput
                        label="Probabilité"
                        type="number"
                        value={e.probability ?? ''}
                        onChange={(v) => set('probability', v.target.value ? Number(v.target.value) : null)}
                    />

                    <FormTextarea
                        label="Plan de mitigation"
                        value={e.mitigation_plan || ''}
                        onChange={(v) => set('mitigation_plan', v.target.value)}
                    />
                </>
            )}
        />
    );
});