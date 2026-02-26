/**
 * JSONPreview Component
 * Affiche le JSON et SQL avec syntax highlighting
 */

import React, { useState, useMemo } from 'react';
import type { QueryJSON } from '../../../../models/builders.models';
import styles from '@pages/builders/SqlBuilder/SqlBuilder.module.css';

// ============================================================================
// TYPES
// ============================================================================

interface JSONPreviewProps {
  json: QueryJSON;
  sql: string;
}

type TabType = 'json' | 'sql';

// ============================================================================
// SYNTAX HIGHLIGHTING
// ============================================================================

const highlightJSON = (json: QueryJSON): React.ReactNode => {
  const jsonStr = JSON.stringify(json, null, 2);

  // Simple syntax highlighting
  const highlighted = jsonStr
    .replace(/"([^"]+)":/g, '<span class="key">"$1"</span>:')
    .replace(/: "([^"]+)"/g, ': <span class="string">"$1"</span>')
    .replace(/: (\d+)/g, ': <span class="number">$1</span>')
    .replace(/: (true|false|null)/g, ': <span class="keyword">$1</span>')
    .replace(/[{}\[\]]/g, '<span class="bracket">$&</span>');

  return (
    <pre
      dangerouslySetInnerHTML={{ __html: highlighted }}
      style={{
        margin: 0,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}
    />
  );
};

const highlightSQL = (sql: string): React.ReactNode => {
  const keywords = [
    'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'FULL',
    'ON', 'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'OFFSET', 'AS', 'IN', 'NOT',
    'BETWEEN', 'LIKE', 'IS', 'NULL', 'ASC', 'DESC', 'SUM', 'AVG', 'COUNT', 'MIN', 'MAX',
    'DISTINCT',
  ];

  let highlighted = sql;

  // Highlight keywords
  keywords.forEach((kw) => {
    const regex = new RegExp(`\\b${kw}\\b`, 'gi');
    highlighted = highlighted.replace(regex, `<span class="keyword">${kw}</span>`);
  });

  // Highlight strings
  highlighted = highlighted.replace(/'([^']+)'/g, '<span class="string">\'$1\'</span>');

  // Highlight numbers
  highlighted = highlighted.replace(/\b(\d+)\b/g, '<span class="number">$1</span>');

  return (
    <pre
      dangerouslySetInnerHTML={{ __html: highlighted }}
      style={{
        margin: 0,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}
    />
  );
};

// ============================================================================
// COMPONENT
// ============================================================================

export const JSONPreview: React.FC<JSONPreviewProps> = ({ json, sql }) => {
  const [activeTab, setActiveTab] = useState<TabType>('json');
  const [copied, setCopied] = useState(false);

  const content = useMemo(() => {
    if (activeTab === 'json') {
      return highlightJSON(json);
    }
    return highlightSQL(sql);
  }, [activeTab, json, sql]);

  const handleCopy = async () => {
    const textToCopy = activeTab === 'json' ? JSON.stringify(json, null, 2) : sql;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className={styles.previewPanel}>
      {/* Header */}
      <div className={styles.previewHeader}>
        <span className={styles.previewTitle}>Aperçu</span>
        <div className={styles.previewTabs}>
          <button
            type="button"
            className={`${styles.previewTab} ${activeTab === 'json' ? styles.previewTabActive : ''}`}
            onClick={() => setActiveTab('json')}
          >
            JSON
          </button>
          <button
            type="button"
            className={`${styles.previewTab} ${activeTab === 'sql' ? styles.previewTabActive : ''}`}
            onClick={() => setActiveTab('sql')}
          >
            SQL
          </button>
        </div>
      </div>

      {/* Content */}
      <div className={styles.previewContent}>
        <div className={styles.codeBlock}>
          <style>{`
            .key { color: #93c5fd; }
            .string { color: #86efac; }
            .number { color: #fde047; }
            .bracket { color: #fbbf24; }
            .keyword { color: #f472b6; font-weight: 600; }
          `}</style>
          {content}
        </div>

        {/* Copy button */}
        <button
          type="button"
          onClick={handleCopy}
          style={{
            position: 'absolute',
            top: '60px',
            right: '24px',
            padding: '6px 12px',
            background: copied ? 'var(--qb-success)' : 'var(--qb-bg-code)',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 'var(--qb-radius-sm)',
            fontSize: '0.75rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          {copied ? (
            <>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 6L5 9L10 3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Copié!
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="4" y="4" width="6" height="6" rx="1" />
                <path d="M2 8V2.5C2 2.22386 2.22386 2 2.5 2H8" />
              </svg>
              Copier
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default JSONPreview;
