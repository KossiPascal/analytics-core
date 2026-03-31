import { Target } from 'lucide-react';
import { forwardRef } from 'react';
import { AdminEntityCrudModule, AdminEntityCrudModuleRef } from '@pages/admins/AdminEntityCrudModule';
import { Column } from '@components/ui/Table/Table';
import { StatusBadge } from '@components/ui/Badge/Badge';
import { FormInput } from '@components/forms/FormInput/FormInput';
import { FormTextarea } from '@components/forms/FormTextarea/FormTextarea';

import { OkrGlobalStatusEnum, OkrKeyResult } from '../models';
import { keyResultsService } from '../services';
import { FormSelect } from '@/components/forms/FormSelect/FormSelect';

export const KeyResultTab = forwardRef<AdminEntityCrudModuleRef>((_, ref) => {

    const DEFAULT: OkrKeyResult = {
        id: undefined,
        tenant_id: undefined,
        objective_id: undefined,
        name: '',
        description: '',
        target_value: 0,
        current_value: 0,
        start_value: 0,
        progress: 0,
        unit: '',
        type: '',
        status: OkrGlobalStatusEnum.DRAFT
    };

    const columns: Column<OkrKeyResult>[] = [
        { key: 'name', header: 'Key Result' },

        {
            key: 'current_value',
            header: 'Actuel',
        },
        {
            key: 'target_value',
            header: 'Cible',
        },
        {
            key: 'progress',
            header: 'Progression (%)',
            render: (e) => `${e.progress ?? 0}%`
        },
        {
            key: 'status',
            header: 'Statut',
            render: (e) => e.status
        }
    ];

    return (
        <AdminEntityCrudModule<OkrKeyResult>
            ref={ref}
            title="Key Results"
            entityName="key-result"
            service={keyResultsService}
            icon={<Target />}
            columns={columns}
            defaultValue={DEFAULT}

            isValid={(e) =>
                !!e.name &&
                e.target_value !== undefined &&
                e.current_value !== undefined
            }

            renderForm={(e, set) => {

                const computedProgress =
                    e.target_value && e.target_value !== 0
                        ? Math.round((e.current_value / e.target_value) * 100)
                        : 0;

                return (
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
                            label="Valeur initiale"
                            value={e.start_value ?? 0}
                            onChange={(ev) => set('start_value', Number(ev.target.value))}
                        />

                        <FormInput
                            type="number"
                            label="Valeur actuelle"
                            value={e.current_value}
                            onChange={(ev) => set('current_value', Number(ev.target.value))}
                        />

                        <FormInput
                            type="number"
                            label="Valeur cible"
                            value={e.target_value}
                            onChange={(ev) => set('target_value', Number(ev.target.value))}
                        />

                        <FormInput
                            label="Unité (%, FCFA, kg...)"
                            value={e.unit || ''}
                            onChange={(ev) => set('unit', ev.target.value)}
                        />

                        <FormInput
                            label="Type (ex: KPI, Output...)"
                            value={e.type || ''}
                            onChange={(ev) => set('type', ev.target.value)}
                        />

                        {/* 🔥 Progress calculée automatiquement */}
                        <FormInput
                            type="number"
                            label="Progression (%)"
                            value={computedProgress}
                            disabled
                        />

                        <FormInput
                            label="Statut"
                            value={e.status}
                            onChange={(ev) => set('status', ev.target.value as OkrGlobalStatusEnum)}
                        />

                        <FormSelect
                            label="Statut"
                            value={e.status}
                            options={Object.values(OkrGlobalStatusEnum).map(s => ({
                                label: s,
                                value: s
                            }))}
                            onChange={(val) => set('status', val)}
                        />
                    </>
                );
            }}
        />
    );
});