import { useState } from "react";

interface InlineEditCellProps {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    className?: string;
}

export const InlineEditCell = ({ value, onChange, placeholder = "—", className }: InlineEditCellProps) => {
    const [editing, setEditing] = useState(false);
    const [local, setLocal] = useState(value);

    if (editing) {
        return (
            <input
                autoFocus
                value={local}
                onChange={e => setLocal(e.target.value)}
                onBlur={() => { setEditing(false); onChange(local); }}
                onKeyDown={e => {
                    if (e.key === "Enter") { setEditing(false); onChange(local); }
                    if (e.key === "Escape") { setEditing(false); setLocal(value); }
                }}
                className={`w-full text-xs border border-blue-300 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-400 ${className ?? ""}`}
            />
        );
    }

    return (
        <span
            onClick={() => { setLocal(value); setEditing(true); }}
            className={`cursor-pointer italic hover:text-gray-600 hover:underline ${value ? "text-gray-400" : "text-gray-300"} ${className ?? ""}`}
            title="Cliquer pour modifier"
        >
            {value || placeholder}
        </span>
    );
};
