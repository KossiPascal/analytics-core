import { Visualization } from "@/models/visualization.model";
import { VisualizationBtnStyle } from "./VisualizationUtils";


// ---------------- TOOLBAR ----------------
type ToolbarProps = {
    viz: Visualization;
    startAutoRefresh: boolean;
    showFilters: boolean;
    onToggleFilters: () => void;
    onToggleAutoRefresh: () => void;
    onManualRefresh: () => void;
    onFullscreen: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    onOpen?: () => void;
};

export function VisualizationToolbar({ viz, startAutoRefresh, showFilters, onToggleFilters, onToggleAutoRefresh, onManualRefresh, onFullscreen, onEdit, onDelete, onOpen }: ToolbarProps) {
    const sep = <div style={{ width: 1, height: 18, background: '#e2e8f0', margin: '0 2px' }} />;
    const iconBtn = (extra: React.CSSProperties = {}) => ({
        ...VisualizationBtnStyle(false), 
        width: 28, 
        height: 28, 
        padding: 0, 
        justifyContent: 'center' as const, 
        ...extra,
    });

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem' }}>
            {/* ── Gauche : nom ── */}
            <span style={{
                fontWeight: 700, fontSize: '0.82rem', color: '#1e293b',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                maxWidth: 160, flexShrink: 1,
            }} title={viz.name}>{viz.name}</span>

            {/* Spacer */}
            <div style={{ flex: 1 }} />

            {/* ── Droite : tous les boutons ── */}
            <button onClick={onToggleFilters} style={VisualizationBtnStyle(showFilters)} title="Filtres">🔍</button>
            {sep}
            <button onClick={onToggleAutoRefresh} style={VisualizationBtnStyle(startAutoRefresh)} title={startAutoRefresh ? 'Arrêter auto refresh' : 'Auto refresh'}>
                {startAutoRefresh ? '⏸' : '▶'}
            </button>
            <button onClick={onManualRefresh} style={VisualizationBtnStyle(false)} title="Rafraîchir">🔄</button>
            {sep}
            <button onClick={onFullscreen} style={iconBtn()} title="Plein écran">⛶</button>
            {onOpen && <button onClick={onOpen} style={iconBtn({ background: '#eff6ff', color: '#1d4ed8', borderColor: '#bfdbfe' })} title="Ouvrir">📂</button>}
            {onEdit && <button onClick={onEdit} style={iconBtn({ background: '#f0fdf4', color: '#15803d', borderColor: '#bbf7d0' })} title="Modifier">✏️</button>}
            {onDelete && <button onClick={onDelete} style={iconBtn({ background: '#fef2f2', color: '#b91c1c', borderColor: '#fecaca' })} title="Supprimer">🗑️</button>}
        </div>
    );
}