import { useState, useEffect, useMemo, forwardRef, useImperativeHandle, useCallback, JSX } from "react";

import { Modal, ModalSize } from "@components/ui/Modal/Modal";
import { Button } from "@components/ui/Button/Button";
import { Table, Column } from "@components/ui/Table/Table";
import { useNotification } from "@/contexts/OLD/useNotification";
import { RefreshCw, Building2, Save, Trash2, Edit2 } from "lucide-react";

import styles from "@pages/admins/AdminPage.module.css";
import { boolean } from "zod";

/* ============================= */
/* ========== TYPES ============ */
/* ============================= */

interface CrudService<T> {
    full(tenantId?: number): Promise<T[]>;
    all(tenantId?: number, v2?: number, v3?: number, v4?: number, v5?: number): Promise<T[]>;
    create(data: T): Promise<any>;
    update(id: number, data: T): Promise<any>;
    remove(id: number): Promise<any>;
}

export interface AdminEntityCrudModuleRef {
    handleNew: () => void;
    refresh: () => void;
}

interface AdminEntityCrudModuleProps<T> {
    title: string;
    icon: React.ReactNode;
    entityName: string;
    columns: Column<T>[];
    defaultValue?: T;
    service: CrudService<T>;
    defaultTenant?: {
        ids: (number | undefined)[]
        required: boolean
    };
    renderForm?: (
        entity: T,
        setValue: (key: keyof T, value: any) => void,
        saving: boolean,
    ) => React.ReactNode;
    modalSize?: ModalSize;

    formatedEntity?: (entity: T) => Promise<T>,

    /** Custom buttons rendered inside modal footer */
    formActionsButtons?: (props: {entity: T,isFormValid: boolean,saving: boolean,close?: (cls: boolean) => void}) => React.ReactNode;

    isValid?: (entity: T) => boolean;

    enableActions?: boolean;
    enableEdit?: boolean;
    enableDelete?: boolean;
    customActions?: (row: T) => React.ReactNode;

    onBeforeSave?: (entity: T) => Promise<T> | T;
    submitValidation?: (entity: T) => Promise<boolean>;
    afterSave?: (entity: T) => void;

    /** Actions supplémentaires affichées à droite du titre */
    headerActions?: React.ReactNode;
}

/* ============================= */
/* ========== COMPONENT ======== */
/* ============================= */

const AdminEntityCrudModuleInner = <
    T extends { id: number | null }
>(
    {
        title,
        icon,
        entityName,
        columns,
        defaultValue,
        service,
        defaultTenant,
        renderForm,
        formatedEntity,
        modalSize = "sm",
        formActionsButtons,
        isValid,
        enableActions = true,
        enableEdit = true,
        enableDelete = true,
        customActions,
        onBeforeSave,
        submitValidation,
        afterSave,
        headerActions,
    }: AdminEntityCrudModuleProps<T>,
    ref: React.Ref<AdminEntityCrudModuleRef>
) => {
    const finalDefaultValue = useMemo(
        () => ({ ...(defaultValue ?? {}) } as T),
        [defaultValue]
    );

    const [list, setList] = useState<T[]>([]);
    const [entity, setEntity] = useState<T>(finalDefaultValue);
    const [loading, setLoading] = useState(true);
    const [openModal, setOpenModal] = useState(false);
    const [openDeleteModal, setOpenDeleteModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState(false);

    const { showError, showSuccess } = useNotification();

    /* ========== FETCH ============ */
    const fetchData = useCallback(async () => {
        if (defaultTenant && defaultTenant.required) {
            const ids = defaultTenant.ids ?? [];
            // 1️⃣ Vérifier longueur valide
            if (ids.length < 1 || ids.length > 5) {
                console.warn(`defaultTenant.ids must have between 1 and 5 elements. Got ${ids.length}`);
                setLoading(false);
                return;
            }
            // 2️⃣ Return si une valeur est undefined ou null
            if (ids.some(id => id === undefined || id === null)) {
                setLoading(false);
                return; // attend que tous les ids soient définis
            }
        }

        setLoading(true);
        try {
            let res: T[] = [];
            if (defaultTenant && defaultTenant.required) {
                const ids = defaultTenant.ids as number[];
                res = await service.all(...(ids as [number, number?, number?, number?, number?]));
            } else {
                res = await service.full();
            }
            setList(res ?? []);
        } catch {
            showError(`Erreur chargement ${entityName}`);
        } finally {
            setLoading(false);
        }
    }, [service, defaultTenant?.ids, defaultTenant?.required, entityName, showError]);
    useEffect(() => {
        fetchData();
    }, [fetchData, defaultTenant?.ids]);

    /* ========= FORM LOGIC ======== */
    const setValue = (key: keyof T, value: any) => {
        setEntity((prev) => ({ ...prev, [key]: value }));
    };

    const isFormValid = useMemo(() => {
        return isValid ? isValid(entity) : true;
    }, [entity, isValid]);

    /* ========= SAVE ============== */
    const handleSave = async () => {
        if (!isFormValid) {
            showError("Formulaire invalide");
            return;
        }
        let isFormValided = true;


        const formatedDataToSave = formatedEntity ? await formatedEntity(entity) : entity;

        if (submitValidation) {
            isFormValided = await submitValidation?.(formatedDataToSave)
        }

        if (!isFormValided) {
            showError("Formulaire invalide");
            return;
        }

        try {
            setSaving(true);

            let dataToSave = formatedDataToSave;
            if (onBeforeSave) {
                dataToSave = await onBeforeSave(entity);
            }

            if (editing && dataToSave.id) {
                await service.update(dataToSave.id, dataToSave);
                showSuccess(`${entityName} mise à jour`);
            } else {
                await service.create(dataToSave);
                showSuccess(`${entityName} créée`);
            }

            afterSave?.(dataToSave);
            setOpenModal(false);
            setEntity(finalDefaultValue);
            setEditing(false);

            await fetchData();
        } catch {
            showError("Erreur sauvegarde");
        } finally {
            setSaving(false);
        }
    };

    /* ========= CUSTOM ACTION ===== */
    const handleAction = async (action: () => Promise<void>, fethAfterAction: boolean) => {
        if (!isFormValid) {
            showError("Formulaire invalide");
            return;
        }

        try {
            setSaving(true);
            await action();
            if (fethAfterAction) {
                setOpenModal(false);
                await fetchData();
            }
        } catch {
            showError("Erreur action");
        } finally {
            setSaving(false);
        }
    };

    /* ========= DELETE ============ */
    const handleDelete = async () => {
        if (!entity.id) return;

        try {
            await service.remove(entity.id);
            showSuccess(`${entityName} supprimée`);
            setOpenDeleteModal(false);
            await fetchData();
        } catch {
            showError("Erreur suppression");
        }
    };

    /* ========= NEW =============== */
    const handleNew = () => {
        setEditing(false);
        setEntity(finalDefaultValue);
        setOpenModal(true);
    };

    useImperativeHandle(ref, () => ({
        handleNew,
        refresh: fetchData,
    }));

    /* ========= ACTION COLUMN ===== */
    const actionColumn: Column<T> = {
        key: "actions",
        header: "Actions",
        align: "center",
        searchable: false,
        render: (row: T) => (
            <div className={styles.actionsCell}>
                {enableEdit && (
                    <button
                        className={styles.actionBtn}
                        onClick={() => {
                            setEditing(true);
                            setEntity({ ...row });
                            setOpenModal(true);
                        }}
                    >
                        <Edit2 size={16} />
                    </button>
                )}

                {enableDelete && (
                    <button
                        className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                        onClick={() => {
                            setEntity({ ...row });
                            setOpenDeleteModal(true);
                        }}
                    >
                        <Trash2 size={16} />
                    </button>
                )}

                {customActions?.(row)}
            </div>
        ),
    };

    const finalColumns = useMemo(
        () => enableActions ? [...columns, actionColumn] : columns,
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [columns, enableActions]
    );

    /* ========= RENDER ============ */
    return (
        <>
            <div className={styles.card}>
                {/* style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} */}
                <div className={styles.cardHeader} >
                    <h3 className={styles.cardTitle}>{icon} {title}</h3>
                    {headerActions && <div style={{ display: 'flex', gap: '0.8rem' }}>{headerActions}</div>}
                </div>

                {loading ? (
                    <div className={styles.loading}>
                        <RefreshCw size={24} className="animate-spin" />
                    </div>
                ) : list.length === 0 && renderForm ? (
                    <div className={styles.emptyState}>
                        <Building2 size={48} />
                        <p>Aucune donnée</p>
                        <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleNew} >
                            Créer Nouveau
                        </button>
                    </div>
                ) : (
                    <Table
                        data={list}
                        columns={finalColumns}
                        keyExtractor={(e: T) => e.id as number}
                        isLoading={loading}
                        emptyMessage="Aucune donnée trouvée"
                        features={{
                            search: true,
                            export: true,
                            pagination: true,
                            pageSize: true,
                            animate: true,
                            columnVisibility: true,
                            scrollable: true,
                        }}
                        defaultPageSize={10}
                        pageSizeOptions={[10, 25, 50, 100]}
                        stickyHeader
                        maxHeight="600px"
                    />
                )}
            </div>

            {/* CREATE / EDIT MODAL */}
            {renderForm && (
                <Modal
                    isOpen={openModal}
                    onClose={() => setOpenModal(false)}
                    title={
                        editing
                            ? `Modifier ${entityName}`
                            : `Créer ${entityName}`
                    }
                    size={modalSize}
                    footer={
                        <div className={styles.buttonGroup}>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setOpenModal(false)}
                            >
                                Annuler
                            </Button>


                            {formActionsButtons?.({entity, isFormValid, saving, close: (act: boolean) => setOpenModal(act)})}

                            <Button
                                variant="primary"
                                size="sm"
                                onClick={handleSave}
                                disabled={!isFormValid || saving}
                            >
                                <Save size={16} />
                                {saving ? "Enregistrement..." : "Enregistrer"}
                            </Button>
                        </div>
                    }
                >
                    {renderForm(entity, setValue, saving)}
                </Modal>
            )}

            {/* DELETE MODAL */}
            <Modal
                isOpen={openDeleteModal}
                onClose={() => setOpenDeleteModal(false)}
                title="Confirmer la suppression"
                size="sm"
                footer={
                    <div className={styles.buttonGroup}>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setOpenDeleteModal(false)}
                        >
                            Annuler
                        </Button>
                        <Button
                            variant="danger"
                            size="sm"
                            onClick={handleDelete}
                        >
                            <Trash2 size={16} />
                            Supprimer
                        </Button>
                    </div>
                }
            >
                <div
                    className={styles.emptyState}
                    style={{ padding: "1rem" }}
                >
                    <Trash2
                        size={24}
                        style={{ color: "#dc2626", marginBottom: "0.5rem" }}
                    />
                    <p>
                        Êtes-vous sûr de vouloir supprimer cet élément ?
                    </p>
                    <p
                        style={{
                            fontSize: "0.875rem",
                            color: "#64748b",
                        }}
                    >
                        Cette action est irréversible.
                    </p>
                </div>
            </Modal>
        </>
    );
};

/* ============================= */
/* ========= EXPORT ============ */
/* ============================= */

export const AdminEntityCrudModule = forwardRef(
    AdminEntityCrudModuleInner
) as <T extends { id: number | null }>(
    props: AdminEntityCrudModuleProps<T> & {
        ref?: React.Ref<AdminEntityCrudModuleRef>;
    }
) => JSX.Element;