import { FormTextarea } from "@/components/forms/FormTextarea/FormTextarea";
import { VisualizationForm } from "@/models/visualization.model";
import { useState } from "react";


type JsonConfigSectionProps = {
    form: VisualizationForm;
    setForm: (f: VisualizationForm) => void;
    onOpenConfigModal: () => void;
}

export function JsonConfigSection({ form, setForm, onOpenConfigModal }: JsonConfigSectionProps) {
    const [open, setOpen] = useState(true);
    return (
        <section style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{
                padding: '0.5rem 1rem', background: '#f1f5f9',
                borderBottom: open ? '1px solid #e2e8f0' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                <button
                    onClick={() => setOpen(v => !v)}
                    style={{ flex: 1, textAlign: 'left', border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem', color: '#475569', letterSpacing: '0.03em', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                    <span>⚙️ CONFIG JSON</span>
                    <span style={{ fontSize: '0.7rem' }}>{open ? '▲' : '▼'}</span>
                </button>
                <button
                    onClick={onOpenConfigModal}
                    style={{
                        padding: '0.25rem 0.75rem', fontSize: '0.75rem', fontWeight: 600,
                        background: '#6366f1', color: 'white', border: 'none', borderRadius: 6,
                        cursor: 'pointer', whiteSpace: 'nowrap',
                    }}
                >
                    🗂️ Configurer
                </button>
            </div>
            {open && (
                <div style={{ padding: '0.875rem' }}>
                    <FormTextarea
                        rows={6}
                        value={JSON.stringify(form.definition?.config ?? {}, null, 2)}
                        onChange={e => {
                            try {
                                const definition = {
                                    ...(form.definition ?? {}),
                                    config: JSON.parse(e.target.value ?? '{}')
                                }
                                setForm({ ...form, definition });
                            } catch { }
                        }}
                    />
                </div>
            )}
        </section>
    );
}