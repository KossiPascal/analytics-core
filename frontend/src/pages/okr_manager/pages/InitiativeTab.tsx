import { Rocket } from 'lucide-react';
import { forwardRef } from 'react';
import { AdminEntityCrudModule, AdminEntityCrudModuleRef } from '@pages/admins/AdminEntityCrudModule';
import { Column } from '@components/ui/Table/Table';
import { StatusBadge } from '@components/ui/Badge/Badge';
import { FormInput } from '@components/forms/FormInput/FormInput';
import { FormTextarea } from '@components/forms/FormTextarea/FormTextarea';

import { OkrInitiative, ProjectStatusEnum } from '../models';
import { initiativeService } from '../services';
import { FormSelect } from '@/components/forms/FormSelect/FormSelect';

export const InitiativeTab = forwardRef<AdminEntityCrudModuleRef>((_, ref) => {
    const DEFAULT: OkrInitiative = {
        id: undefined,
        tenant_id: undefined,
        okr_team_id: undefined,
        name: '',
        description: '',
        start_date: null,
        end_date: null,
        budget: 0,
        currency: 'USD',
        status: ProjectStatusEnum.DRAFT
    };

    const columns: Column<OkrInitiative>[] = [
        { key: 'name', header: 'Nom' },
        { key: 'budget', header: 'Budget' },
        { key: 'currency', header: 'Devise' },
        {
            key: 'status',
            header: 'Statut',
            render: (e) => e.status
        },
        {
            key: 'start_date',
            header: 'Début',
            render: (e) => e.start_date || '-'
        },
        {
            key: 'end_date',
            header: 'Fin',
            render: (e) => e.end_date || '-'
        }
    ];

    return (
        <AdminEntityCrudModule<OkrInitiative>
            ref={ref}
            title="Initiatives"
            entityName="initiative"
            service={initiativeService}
            icon={<Rocket />}
            columns={columns}
            defaultValue={DEFAULT}
            isValid={(e) =>
                !!e.name && e.name.trim().length > 0 &&
                e.budget >= 0 &&
                (!e.start_date || !e.end_date || e.start_date <= e.end_date)
            }
            renderForm={(e, set) => (
                <>
                    <FormInput
                        label="Nom"
                        value={e.name}
                        onChange={(ev) => set('name', ev.target.value)}
                    />

                    <FormTextarea
                        label="Description"
                        value={e.description}
                        onChange={(ev) => set('description', ev.target.value)}
                    />

                    <FormInput
                        type="number"
                        label="Budget"
                        value={e.budget}
                        onChange={(ev) => set('budget', Number(ev.target.value))}
                    />

                    <FormInput
                        label="Devise"
                        value={e.currency}
                        onChange={(ev) => set('currency', ev.target.value)}
                    />

                    <FormInput
                        type="date"
                        label="Date de début"
                        value={e.start_date || ''}
                        onChange={(ev) => set('start_date', ev.target.value)}
                    />

                    <FormInput
                        type="date"
                        label="Date de fin"
                        value={e.end_date || ''}
                        onChange={(ev) => set('end_date', ev.target.value)}
                    />

                    <FormSelect
                        label="Statut"
                        value={e.status}
                        options={Object.values(ProjectStatusEnum).map(s => ({
                            label: s,
                            value: s
                        }))}
                        onChange={(val) => set('status', val)}
                    />
                </>
            )}
        />
    );
});