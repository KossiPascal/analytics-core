import { CheckSquare } from 'lucide-react';
import { forwardRef, useMemo } from 'react';
import { AdminEntityCrudModule, AdminEntityCrudModuleRef } from '@pages/admins/AdminEntityCrudModule';
import { Column } from '@components/ui/Table/Table';
import { StatusBadge } from '@components/ui/Badge/Badge';
import { FormInput } from '@components/forms/FormInput/FormInput';
import { FormTextarea } from '@components/forms/FormTextarea/FormTextarea';
import { FormCheckbox } from '@components/forms/FormCheckbox/FormCheckbox';

import { Activity } from 'lucide-react';
import { indicatorService } from '../services';
import { Indicator } from '../models';


export const IndicatorTab = forwardRef<AdminEntityCrudModuleRef>((_, ref) => {
    const DEFAULT: Indicator = {
        id: undefined,
        tenant_id: undefined,
        name: '',
        description: '',
        unit: '',
    };

    const columns: Column<Indicator>[] = [
        { key: 'name', header: 'Nom' },
        { key: 'description', header: 'Description' },
        { key: 'unit', header: 'Unité' },
    ];

    return (
        <AdminEntityCrudModule<Indicator>
            ref={ref}
            title="Indicateurs"
            entityName="indicator"
            service={indicatorService}
            icon={<Activity />}
            columns={columns}
            defaultValue={DEFAULT}
            isValid={(e) => !!e.name && e.name.trim().length > 0}
            renderForm={(e, set) => (
                <>
                    <FormInput
                        label="Nom"
                        value={e.name}
                        onChange={(ev) => set('name', ev.target.value)}
                    />

                    <FormTextarea
                        label="Description"
                        value={e.description || ''}
                        onChange={(ev) => set('description', ev.target.value)}
                    />

                    <FormInput
                        label="Unité (ex: %, kg, FCFA)"
                        value={e.unit || ''}
                        onChange={(ev) => set('unit', ev.target.value)}
                    />
                </>
            )} />
    );
});