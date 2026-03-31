import { TrendingUp } from 'lucide-react';
import { forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import { AdminEntityCrudModule, AdminEntityCrudModuleRef } from '@pages/admins/AdminEntityCrudModule';
import { Column } from '@components/ui/Table/Table';
import { FormInput } from '@components/forms/FormInput/FormInput';
import { FormTextarea } from '@components/forms/FormTextarea/FormTextarea';
import { FormMultiSelect } from '@/components/forms/FormSelect/FormMultiSelect';

import { outcomeService, indicatorService } from '../services';
import { Outcome, Indicator } from '../models';


type OutcomeType = "Health" | "Operational" | "Financial";

export const OutcomeTab = forwardRef<AdminEntityCrudModuleRef>((_, ref) => {

    const [indicators, setIndicators] = useState<Indicator[]>([]);

    const DEFAULT: Outcome = {
        id: undefined,
        tenant_id: undefined,
        name: '',
        description: '',
        indicators: []
    };

    const didLoad = useRef(false);
    const indicatorOptions = useMemo(() => indicators.map(i => ({ value: i.id!, label: i.name })), [indicators]);



    useEffect(() => {
        // if (didActiveLoad.current) return;
        // didActiveLoad.current = true;
        indicatorService.list().then(res => setIndicators(res))
    }, []);

    /**
     * 🔥 Calcul progression = moyenne des values
     */
    const computeProgress = (outcome: Outcome): number => {
        if (!outcome.indicators?.length) return 0;

        const values = outcome.indicators.flatMap(link =>
            link.indicator?.values || []
        );

        if (!values.length) return 0;

        const sum = values.reduce((acc, v) => acc + (v.value || 0), 0);
        return Math.round(sum / values.length);
    };

    const columns: Column<Outcome>[] = [
        {
            key: 'name',
            header: 'Outcome',
            searchable: true
        },
        {
            key: 'description',
            header: 'Description'
        },
        {
            key: 'indicators',
            header: 'Indicateurs',
            render: (e) =>
                e.indicators?.length
                    ? e.indicators.length
                    : "⚠ Aucun"
        },
        {
            key: 'progress',
            header: 'Progression (%)',
            render: (e) => computeProgress(e)
        }
    ];

    return (
        <AdminEntityCrudModule<Outcome>
            ref={ref}
            title="Outcomes"
            entityName="outcome"
            service={outcomeService}
            icon={<TrendingUp />}
            columns={columns}
            defaultValue={DEFAULT}
            onBeforeSave={(e) => ({
                ...e,
                indicator_ids: e.indicators?.map(i => i.indicator_id)
            })}

            isValid={(e) => !!e.name && e.name.trim().length > 0}

            /**
             * 🔥 FORM COMPLET
             */
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

                    <FormMultiSelect
                        label="Indicateurs"
                        value={e.indicators?.map(i => i.indicator_id!) || []}
                        options={indicatorOptions}
                        onChange={(ids: number[]) => {
                            const selected: Indicator[] = indicatorOptions
                                .filter(opt => ids.includes(opt.value))
                                .map(opt => ({
                                    id: opt.value,
                                    name: opt.label
                                } as Indicator));

                            set('indicators', selected);
                        }}
                    />
                </>
            )}
        />
    );
});