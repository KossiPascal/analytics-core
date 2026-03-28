import React, { useState } from "react";
import { Layout, ResponsiveLayouts } from "react-grid-layout";
import { VisualizationForm } from "@/models/visualization.model";
import { FormTextarea } from "@/components/forms/FormTextarea/FormTextarea";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { LayoutGrid } from "lucide-react";
import { List } from "lucide-react";


export const STATUS = ["draft", "submitted", "reviewed", "approved", "published", "archived"];
export type VisualizationFilterType = 'all' | 'dashboard' | 'report';
export const TYPES: VisualizationFilterType[] = ["dashboard", "report"];
export type VisualizationViewMode = 'grid' | 'list';


// ---------------- UI HELPERS ----------------
export const Skeleton = () => (
    <div className="animate-pulse bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 h-full w-full rounded-xl" />
);

export const statusColor = (status?: string) => {
    switch (status) {
        case "published": return "bg-green-100 text-green-700";
        case "draft": return "bg-gray-100 text-gray-600";
        case "failed": return "bg-red-100 text-red-600";
        default: return "bg-blue-100 text-blue-600";
    }
};

export const VisualizationBtnStyle = (active: boolean): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '0.2rem 0.5rem',
    fontSize: '0.75rem', fontWeight: 500,
    borderRadius: 6, border: '1px solid',
    cursor: 'pointer',
    background: active ? '#e0e7ff' : '#ffffff',
    color: active ? '#4338ca' : '#475569',
    borderColor: active ? '#a5b4fc' : '#e2e8f0',
    transition: 'all 0.15s',
    whiteSpace: 'nowrap' as const,
});

export const exportBtnStyles: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 3,
    padding: '0.18rem 0.45rem',
    fontSize: '0.72rem', fontWeight: 500,
    borderRadius: 5, border: '1px solid #e2e8f0',
    cursor: 'pointer', background: 'white', color: '#475569',
    whiteSpace: 'nowrap',
};


const dropItemStyle = (active: boolean): React.CSSProperties => ({
    display: 'block', width: '100%', textAlign: 'left',
    padding: '0.5rem 0.875rem', fontSize: '0.82rem',
    border: 'none', cursor: 'pointer',
    background: active ? '#e0e7ff' : 'transparent',
    color: active ? '#4338ca' : '#1e293b',
    fontWeight: active ? 600 : 400,
});






export type ConfirmStateProps = {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
}

export type AskConfirmProps = {
    title: string,
    message: string,
    onConfirm: () => void
}

export const defaultConfirmState: ConfirmStateProps = {
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { }
}


type ViewGridOrListModeBtn = {
    viewMode: VisualizationViewMode
    style?: React.CSSProperties
    setViewMode: React.Dispatch<React.SetStateAction<VisualizationViewMode>>
    setCardsLayout?: (value: React.SetStateAction<Record<keyof ResponsiveLayouts, Layout>>) => void
}


export function ViewGridOrListModeBtn({ viewMode = 'list', style, setViewMode, setCardsLayout }: ViewGridOrListModeBtn) {

    return (
        <button
            onClick={() => {
                setViewMode(v => v === 'grid' ? 'list' : 'grid');
                if (setCardsLayout) setCardsLayout({ lg: [], md: [], sm: [] });
            }}
            title={viewMode === 'grid' ? "Vue grille" : "Vue liste"}
            style={style ?? {
                height: 34, width: 34, borderRadius: 8, fontSize: '1rem', fontWeight: 600,
                background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.15)',
                cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
        >{viewMode === 'grid' ? (<>☰ <LayoutGrid size={18} /></>) : (<>⊞ <List size={18} /></>)}</button>
    );
}
