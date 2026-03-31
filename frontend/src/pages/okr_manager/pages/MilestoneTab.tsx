import { Flag } from 'lucide-react';
import { forwardRef } from 'react';
import { AdminEntityCrudModule, AdminEntityCrudModuleRef } from '@pages/admins/AdminEntityCrudModule';
import { Column } from '@components/ui/Table/Table';
import { StatusBadge } from '@components/ui/Badge/Badge';
import { FormInput } from '@components/forms/FormInput/FormInput';
import { FormTextarea } from '@components/forms/FormTextarea/FormTextarea';

import { milestonesService } from '../services';
import { MilestoneStatusEnum, ProjectMilestone } from '../models';
import { FormSelect } from '@/components/forms/FormSelect/FormSelect';

export const MilestoneTab = forwardRef<AdminEntityCrudModuleRef>((_, ref) => {

    const DEFAULT: ProjectMilestone = {
        id: undefined,
        tenant_id: undefined,
        project_id: undefined,
        name: '',
        description: '',
        due_date: null,
        status: MilestoneStatusEnum.PENDING
    };

    const columns: Column<ProjectMilestone>[] = [
        { key: 'name', header: 'Nom' },

        {
            key: 'due_date',
            header: 'Date',
            render: (e) => e.due_date || '-'
        },

        {
            key: 'status',
            header: 'Statut',
            render: (e) => e.status
        }
    ];

    return (
        <AdminEntityCrudModule<ProjectMilestone>
            ref={ref}
            title="Milestones"
            entityName="milestone"
            service={milestonesService}
            icon={<Flag />}
            columns={columns}
            defaultValue={DEFAULT}

            isValid={(e) =>
                !!e.name &&
                e.name.trim().length > 0 &&
                (!e.due_date || new Date(e.due_date).toString() !== 'Invalid Date')
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
                        type="date"
                        label="Date d'échéance"
                        value={e.due_date || ''}
                        onChange={(ev) => set('due_date', ev.target.value)}
                    />

                    <FormSelect
                        label="Statut"
                        value={e.status}
                        options={Object.values(MilestoneStatusEnum).map(s => ({
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