import { CheckSquare } from 'lucide-react';
import { forwardRef, useMemo } from 'react';
import { AdminEntityCrudModule, AdminEntityCrudModuleRef } from '@pages/admins/AdminEntityCrudModule';
import { Column } from '@components/ui/Table/Table';
import { FormInput } from '@components/forms/FormInput/FormInput';
import { FormTextarea } from '@components/forms/FormTextarea/FormTextarea';
import { FormSelect } from '@components/forms/FormSelect/FormSelect';
import { FormCheckbox } from '@components/forms/FormCheckbox/FormCheckbox';
import { StatusBadge } from '@components/ui/Badge/Badge';

import { taskService } from '../services';
import { OkrProjectTask, TaskStatusEnum, OkrKeyResult } from '../models';

const columns: Column<OkrProjectTask>[] = [
    { key: 'name', header: 'Nom', sortable: true, searchable: true },
    { key: 'description', header: 'Description' },
    { 
        key: 'status', 
        header: 'Statut', 
        render: (t) => t.status
        // render: (t) => <StatusBadge label={t.status} isActive={t.status !== TaskStatusEnum.PENDING} /> 
    },
    { key: 'progress', header: 'Progression (%)' },
];

const getDefaultForm: OkrProjectTask = {
    id: null,
    name: '',
    description: '',
    tenant_id: undefined,
    project_id: undefined,
    assigned_to_id: undefined,
    keyresult_id: undefined,
    parent_id: undefined,
    status: TaskStatusEnum.TODO,
    progress: 0,
    start_date: '',
    end_date: ''
};

export const TaskTab = forwardRef<AdminEntityCrudModuleRef>((_, ref) => {

    const DEFAULT: OkrProjectTask = useMemo(() => getDefaultForm, []);

    // 👥 Exemple : listes dynamiques pour les assignations et KR
    const userOptions = useMemo(() => [] as { value: number; label: string }[], []);
    const keyResultOptions = useMemo(() => [] as { value: number; label: string }[], []);

    return (
        <AdminEntityCrudModule<OkrProjectTask>
            ref={ref}
            title="Tâches"
            entityName="task"
            service={taskService}
            icon={<CheckSquare />}
            columns={columns}
            defaultValue={DEFAULT}
            isValid={(e) => !!e.name && e.name.trim().length > 0}
            renderForm={(e, set) => (
                <>
                    <FormInput label="Nom" value={e.name} onChange={(ev) => set('name', ev.target.value)} />

                    <FormTextarea
                        label="Description"
                        value={e.description || ''}
                        onChange={(ev) => set('description', ev.target.value)}
                    />

                    <FormSelect
                        label="Assigné à"
                        value={e.assigned_to_id}
                        options={userOptions}
                        onChange={(v) => set('assigned_to_id', v)}
                    />

                    <FormSelect
                        label="Key Result"
                        value={e.keyresult_id}
                        options={keyResultOptions}
                        onChange={(v) => set('keyresult_id', v)}
                    />

                    <FormSelect
                        label="Statut"
                        value={e.status}
                        options={Object.values(TaskStatusEnum).map(s => ({ value: s, label: s }))}
                        onChange={(v) => set('status', v)}
                    />

                    <FormInput
                        label="Progression (%)"
                        type="number"
                        value={e.progress || 0}
                        onChange={(ev) => set('progress', Number(ev.target.value))}
                    />

                    <FormInput
                        label="Date de début"
                        type="date"
                        value={e.start_date || ''}
                        onChange={(ev) => set('start_date', ev.target.value)}
                    />

                    <FormInput
                        label="Date de fin"
                        type="date"
                        value={e.end_date || ''}
                        onChange={(ev) => set('end_date', ev.target.value)}
                    />

                    <FormSelect
                        label="Tâche parente"
                        value={e.parent_id}
                        options={[]} // à remplir dynamiquement avec les tâches du projet
                        onChange={(v) => set('parent_id', v)}
                    />

                    <FormCheckbox
                        label="Tâche terminée"
                        checked={e.status === TaskStatusEnum.DONE}
                        onChange={(ev) => set('status', ev.target.checked ? TaskStatusEnum.DONE : TaskStatusEnum.TODO)}
                    />
                </>
            )}
        />
    );
});