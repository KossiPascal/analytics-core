import { CHART_COLS_SEPARATOR, ChartRenderProp } from "@/models/dataset.models";
import { useState, useMemo } from "react";
import clsx from "clsx";
import { FormInput } from "@/components/forms/FormInput/FormInput";

export const TableRenderer = ({ chart, data, customOptions }: ChartRenderProp) => {

  if (!data?.rows?.length) {
    return <div className="text-gray-400 p-4">Aucune donnée</div>;
  }

  const options = {
    ...((chart.options ?? {}).table ?? {}),
    ...(chart.options ?? {})
  };

  const header = data.header;
  const headerRows = header.header_rows || [];
  const rowDims = header.rows || [];
  const colDims = header.columns || [];
  const colDimsMap = header.column_maps || {};
  const colDimsLabel = header.column_label_maps || {};
  const metrics = header.metrics || [];
  const allColumns = header._all_columns_order || [];
  const rows = data.rows;
  const pivot = chart.structure?.pivot || {};
  const pageSize = options.page_size ?? 10;

  // const lastHeadRowContent = headerRows[headerRows.length - 1];

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  /* ---------------- SEARCH ---------------- */
  const filteredRows = useMemo(() => {
    let tempRows = rows;

    // Global search
    if (options.searchable && searchQuery) {
      tempRows = tempRows.filter(row =>
        Object.values(row).some(v =>
          String(v).toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    return tempRows;
  }, [rows, searchQuery, options.searchable]);

  /* ---------------- SORT ---------------- */
  const sortedRows = useMemo(() => {
    if (!sortCol) return filteredRows;

    const sorted = [...filteredRows].sort((a, b) => {
      const av = a[sortCol];
      const bv = b[sortCol];

      // Handle numbers first
      const isNumber = typeof av === "number" && typeof bv === "number";
      if (isNumber) {
        return sortDir === "asc" ? av - bv : bv - av;
      }

      // Otherwise string comparison
      return sortDir === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });

    return sorted;
  }, [filteredRows, sortCol, sortDir]);

  /* ---------------- PAGINATION ---------------- */
  const paginatedRows = useMemo(() => {
    if (!options.pagination) return sortedRows;
    const start = (currentPage - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, currentPage, pageSize, options.pagination]);

  /* ---------------- EXPORT ---------------- */
  const exportCSV = () => {
    const cols = [...rowDims, ...allColumns];
    const csv = [
      cols.map(c => `${c}`.replace(CHART_COLS_SEPARATOR, " ")).join(","),
      ...sortedRows.map(r => cols.map(c => r[c] ?? "").join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${options.title ?? "table"}.csv`;
    a.click();
  };

  const toggleSort = (col: string) => {
    if (!options.sortable) return;
    if (sortCol === col) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
  };

  const searchable = useMemo(() => {
    return options.searchable && customOptions?.showSearcInput !== false;
  }, [options.searchable, customOptions?.showSearcInput]);

  const exportable = useMemo(() => {
    return options.exportable && customOptions?.showExportBtn !== false;
  }, [options.exportable, customOptions?.showExportBtn]);

  const totalPages = Math.ceil(sortedRows.length / pageSize);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'white', borderRadius: 8, overflow: 'hidden', fontSize: '0.8rem' }}>

      {/* TITLE */}
      {(options.title && customOptions?.showTitle !== false) && (
        <div style={{ padding: '0.5rem 0.875rem 0', fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>{options.title}</div>
      )}
      {(options.subtitle && customOptions?.showSubTitle !== false) && (
        <div style={{ padding: '0 0.875rem 0.25rem', fontSize: '0.75rem', color: '#94a3b8' }}>{options.subtitle}</div>
      )}

      {/* TOOLBAR */}
      {(searchable || exportable) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem 0.75rem', borderBottom: '1px solid #e2e8f0', gap: 8, flexShrink: 0 }}>
          {searchable && (
            <input
              placeholder="🔍 Rechercher..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ flex: 1, maxWidth: 220, padding: '0.25rem 0.6rem', fontSize: '0.78rem', border: '1px solid #e2e8f0', borderRadius: 6, outline: 'none', background: '#f8fafc' }}
            />
          )}
          {exportable && (
            <button onClick={exportCSV} style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem', background: '#6366f1', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
              ⬇ CSV
            </button>
          )}
        </div>
      )}

      {/* TABLE */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', minHeight: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
            {headerRows.map((headerRow, i) => {
              const isLast = i === headerRows.length - 1;
              return (
                <tr key={i}>
                  {i === 0 && rowDims.map((dim, idx) => (
                    <th key={idx} rowSpan={headerRows.length} onClick={() => toggleSort(dim)}
                      style={{
                        padding: '0.45rem 0.75rem', textAlign: 'left', cursor: 'pointer', userSelect: 'none',
                        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                        color: 'white', fontWeight: 600, fontSize: '0.75rem',
                        borderRight: '1px solid rgba(255,255,255,0.1)', whiteSpace: 'nowrap',
                      }}>
                      {dim}{sortCol === dim && <span style={{ marginLeft: 4, opacity: 0.8 }}>{sortDir === 'asc' ? '▲' : '▼'}</span>}
                    </th>
                  ))}
                  {headerRow.map((cell, j) => {
                    const isArray = Array.isArray(cell);
                    let label = isArray ? cell[0] : cell;
                    const metricSpan = (isArray ? cell.length : 1) + (pivot.cols_subtotal ? 1 : 0);
                    const headLen = headerRows.length - 1;
                    if (pivot.cols_subtotal && label === "SUBTOTALS" && i !== headLen) return null;
                    if (pivot.cols_total && label === "TOTALS") {
                      return i === 0 ? (
                        <th key={`total_${i}`} rowSpan={headerRows.length} onClick={() => toggleSort(label)}
                          style={{ padding: '0.45rem 0.75rem', cursor: 'pointer', background: '#0f172a', color: '#fbbf24', fontWeight: 700, fontSize: '0.75rem', borderLeft: '2px solid #fbbf24', textAlign: 'right' }}>
                          {label}
                        </th>
                      ) : null;
                    }
                    const key = colDimsLabel[i];
                    label = ((options.renames ?? {})[key] ?? {})[label] ?? label;
                    return (
                      <th key={j} colSpan={i === headLen ? 1 : metricSpan} onClick={() => toggleSort(label)}
                        style={{
                          padding: '0.45rem 0.75rem', cursor: 'pointer', userSelect: 'none',
                          background: isLast ? '#1e293b' : '#334155',
                          color: isLast ? '#e2e8f0' : '#94a3b8',
                          fontWeight: 600, fontSize: '0.73rem',
                          textAlign: isLast ? 'right' : 'center',
                          borderRight: '1px solid rgba(255,255,255,0.07)',
                          whiteSpace: 'nowrap',
                        }}>
                        {label ?? '-'}{sortCol === label && <span style={{ marginLeft: 4, opacity: 0.7 }}>{sortDir === 'asc' ? '▲' : '▼'}</span>}
                      </th>
                    );
                  })}
                </tr>
              );
            })}
          </thead>

          <tbody>
            {paginatedRows.map((row, i) => {
              const isSubtotal = row[rowDims[rowDims.length - 1]] === "SUBTOTALS";
              const isTotal = row[rowDims[0]] === "TOTALS";
              const bg = isTotal ? '#fef9c3' : isSubtotal ? '#f1f5f9' : i % 2 === 0 ? '#ffffff' : '#f8fafc';
              const fw = isTotal ? 700 : isSubtotal ? 600 : 400;
              return (
                <tr key={i} style={{ background: bg, fontWeight: fw, transition: 'background 0.1s' }}
                  onMouseEnter={e => { if (!isTotal && !isSubtotal) (e.currentTarget as HTMLElement).style.background = '#eff6ff'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = bg; }}
                >
                  {rowDims.map((dim) => {
                    let field = row[dim];
                    const renames = (options.renames ?? {})[dim] ?? {};
                    if (field) field = renames[field] ?? field;
                    return (
                      <td key={dim} style={{ padding: '0.35rem 0.75rem', borderBottom: '1px solid #f1f5f9', borderRight: '1px solid #f1f5f9', color: isTotal ? '#92400e' : '#374151', whiteSpace: 'nowrap' }}>
                        {field ?? '-'}
                      </td>
                    );
                  })}
                  {allColumns.map((col) => {
                    let value = row[col] ?? 0;
                    let color = isTotal ? '#92400e' : '#475569';
                    if (options.conditional_formatting && typeof value === 'number') {
                      if (value < 0) color = '#dc2626';
                      else if (value > 1000) color = '#16a34a';
                    }
                    return (
                      <td key={col} style={{ padding: '0.35rem 0.75rem', borderBottom: '1px solid #f1f5f9', borderRight: '1px solid #f1f5f9', textAlign: 'right', color, fontVariantNumeric: 'tabular-nums' }}>
                        {value}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {options.pagination && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, padding: '0.4rem 0.75rem', borderTop: '1px solid #e2e8f0', flexShrink: 0, background: '#f8fafc' }}>
          <span style={{ fontSize: '0.73rem', color: '#94a3b8' }}>{sortedRows.length} ligne{sortedRows.length !== 1 ? 's' : ''}</span>
          <div style={{ flex: 1 }} />
          <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}
            style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem', border: '1px solid #e2e8f0', borderRadius: 5, background: currentPage === 1 ? '#f1f5f9' : 'white', color: currentPage === 1 ? '#cbd5e1' : '#475569', cursor: currentPage === 1 ? 'default' : 'pointer' }}>
            ‹ Préc
          </button>
          <span style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 500 }}>
            {currentPage} / {totalPages || 1}
          </span>
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0}
            style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem', border: '1px solid #e2e8f0', borderRadius: 5, background: currentPage === totalPages ? '#f1f5f9' : 'white', color: currentPage === totalPages ? '#cbd5e1' : '#475569', cursor: currentPage === totalPages ? 'default' : 'pointer' }}>
            Suiv ›
          </button>
        </div>
      )}
    </div>
  );
};