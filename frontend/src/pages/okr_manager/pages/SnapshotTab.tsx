import { Camera } from 'lucide-react';
import { forwardRef, useMemo } from 'react';
import { AdminEntityCrudModule, AdminEntityCrudModuleRef } from '@pages/admins/AdminEntityCrudModule';
import { Column } from '@components/ui/Table/Table';
import { FormInput } from '@components/forms/FormInput/FormInput';
import { FormTextarea } from '@components/forms/FormTextarea/FormTextarea';

import { snapshotService } from '../services';
import { OkrSnapshot } from '../models';

export const SnapshotTab = forwardRef<AdminEntityCrudModuleRef>((_, ref) => {

    const DEFAULT: OkrSnapshot = {
        id: null,
        tenant_id: undefined,
        global_id: undefined,
        name: '',
        description: '',
        date: '',
        breakdown: {},
        progress: null
    };

    const columns: Column<OkrSnapshot>[] = [
        { key: 'name', header: 'Nom', searchable: true },
        { key: 'date', header: 'Date' },
        { key: 'progress', header: 'Progression (%)', render: (r) => r.progress ?? '-' }
    ];

    return (
        <AdminEntityCrudModule<OkrSnapshot>
            ref={ref}
            title="Snapshots"
            entityName="snapshot"
            service={snapshotService}
            icon={<Camera />}
            columns={columns}
            defaultValue={DEFAULT}

            isValid={(e) => !!e.name && e.name.trim().length > 0}

            onBeforeSave={(e) => ({
                ...e,
                progress: e.progress != null ? Number(e.progress) : null
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

                    <FormInput
                        label="Date"
                        type="date"
                        value={e.date || ''}
                        onChange={(v) => set('date', v.target.value)}
                    />

                    <FormInput
                        label="Progression (%)"
                        type="number"
                        value={e.progress ?? ''}
                        onChange={(v) => set('progress', v.target.value ? Number(v.target.value) : null)}
                    />
                </>
            )}
        />
    );
});