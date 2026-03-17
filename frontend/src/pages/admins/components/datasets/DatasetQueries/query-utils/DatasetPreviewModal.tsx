import { X, Copy } from "lucide-react";
import { useState } from "react";
import SyntaxHighlighter from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { SqlPreviewProps } from "./model";
import { Modal } from "@/components/ui/Modal/Modal";
import { Button } from "@/components/ui/Button/Button";



// PREVIEW SQL
export const DatasetPreviewModal = ({ title, open, data, type, onClose }: SqlPreviewProps) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        if (!data) return;
        await navigator.clipboard.writeText(data);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    if (!open) return null;

    return (
        <Modal
            isOpen={open}
            title={title}
            size="lg"
            onClose={onClose}
            footer={
                <>

                    <Button size="sm" variant="outline" onClick={onClose}>
                        <X size={20} /> Fermer
                    </Button>
                    <Button size="sm" onClick={handleCopy}>
                        <Copy size={16} /> {copied ? "Copié" : "Copier"}
                    </Button>
                </>
            }>

            {/* Body */}

            {type === "sql" ? (
                <SyntaxHighlighter
                    language="sql"
                    style={oneDark}
                    showLineNumbers
                    customStyle={{ margin: 0, padding: "1.5rem", background: "transparent", fontSize: "0.9rem" }}
                >
                    {data ?? "-- Aucun SQL disponible"}
                </SyntaxHighlighter>
            ) :
                (
                    <pre className="bg-gray-100 p-6 overflow-auto text-sm">
                        {data ?? "-- Aucun JSON disponible"}
                    </pre>
                )}
        </Modal>
    );
};