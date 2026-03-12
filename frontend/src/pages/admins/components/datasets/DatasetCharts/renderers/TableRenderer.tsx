import { ChartRenderProp } from "@/models/dataset.models";
import { useState, useMemo } from "react";
import clsx from "clsx";

export const TableRenderer = ({ chart, data }: ChartRenderProp) => {

  if (!data?.rows?.length) {
    return <div className="text-gray-400 p-4">Aucune donnée</div>;
  }

  const baseOptions = chart.options ?? {};
  const tableOptions = {
    ...baseOptions,
    ...(baseOptions.table ?? {})
  };

  const headerRows = data.header.header_rows || [];
  const rowDims: string[] = data.header.rows || [];
  const colDims = data.header.columns || [];
  const metrics = data.header.metrics || [];
  const rows = data.rows;
  const allColumns: string[] = (data.header as any)._all_columns_order || [];
  const pivot = chart.structure?.pivot || {};
  const pageSize = tableOptions.page_size ?? 10;

  const lastRowContent = headerRows[headerRows.length - 1];

  // const totalIndex: number[] = [];
  // for (let l = 0; l < lastRowContent.length; l++) {
  //   const cel = lastRowContent[l];
  //   if (['SUBTOTAL', 'TOTAL'].includes(cel)) {
  //     totalIndex.push(l);
  //   }
  // }

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Construction de l'ordre réel des colonnes pivot
  const pivotColumns: string[] = [];
  colDims.forEach((c: any) => {
    const colKey = Array.isArray(c) ? c.join("_") : c;
    metrics.forEach((m: string) => pivotColumns.push(`${colKey}_${m}`));
    if (pivot.cols_subtotal) {
      metrics.forEach((m: string) => pivotColumns.push(`SUBTOTAL_${m}`));
    }
  });
  if (pivot.cols_total) {
    metrics.forEach((m: string) => pivotColumns.push(`TOTAL_${m}`));
  }

  /* SEARCH */

  const filteredRows = useMemo(() => {
    if (!tableOptions.searchable || !searchQuery) return rows;

    return rows.filter((row: any) =>
      Object.values(row).some((v) =>
        String(v).toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [rows, searchQuery, tableOptions.searchable]);

  /* SORT */

  const sortedRows = useMemo(() => {
    if (!sortCol) return filteredRows;
    const sorted = [...filteredRows].sort((a: any, b: any) => {
      const av = a[sortCol];
      const bv = b[sortCol];
      if (av === bv) return 0;
      if (sortDir === "asc") {
        return av > bv ? 1 : -1;
      }
      return av < bv ? 1 : -1;
    });
    return sorted;
  }, [filteredRows, sortCol, sortDir]);

  /* PAGINATION */
  const paginatedRows = useMemo(() => {
    if (!tableOptions.pagination) return sortedRows;
    const start = (currentPage - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, currentPage, pageSize, tableOptions.pagination]);

  /* EXPORT */

  const exportCSV = () => {
    const csv = [
      [...rowDims, ...allColumns].join(","),
      ...sortedRows.map((r: any) =>
        [...rowDims, ...allColumns].map((c) => r[c] ?? "").join(",")
      )
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${tableOptions.title ?? "table"}.csv`;
    a.click();
  };

  const toggleSort = (col: string) => {
    if (!tableOptions.sortable) return;
    if (sortCol === col) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
  };


  const metricSpan = metrics.length + (pivot.cols_subtotal ? 1 : 0);

  return (
    <div className="border rounded bg-white p-4">

      {/* TITLE */}
      {tableOptions.title && (
        <div className="text-lg font-semibold mb-1">{tableOptions.title}</div>
      )}

      {tableOptions.subtitle && (
        <div className="text-gray-500 mb-3">{tableOptions.subtitle}</div>
      )}

      {/* TOOLBAR */}
      <div className="mb-3 flex justify-between mb-3 items-center">

        {tableOptions.searchable && (
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border rounded px-3 py-1 w-64 w-full md:w-1/3"
          />
        )}

        {tableOptions.exportable && (
          <div className="mt-2 flex justify-end">
            <button
              onClick={exportCSV}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Export CSV
            </button>
          </div>
        )}

      </div>

      {/* TABLE */}

      <div className="overflow-auto max-h-[600px]">
        <table className="table-auto w-full border-collapse text-sm">
          <thead className="sticky top-0 bg-gray-100 z-10">

            {headerRows.map((headerRow: any, i: number) => {

              const isLast = i === headerRows.length - 1;
              return (
                <tr key={i}>
                  {i === 0 &&
                    rowDims.map((dim, idx) => (
                      <th key={idx} rowSpan={headerRows.length} onClick={() => toggleSort(dim)}
                        className="border px-3 py-2 bg-gray-100 text-left cursor-pointer">
                        {dim}
                      </th>
                    ))}


                  {headerRow.map((cell: any, j: number) => {

                    const isArray = Array.isArray(cell);
                    const label = isArray ? cell[0] : cell;

                    let span = i === headerRows.length - 1 ? 1 : metricSpan;

                    if (pivot.cols_subtotal) {
                      console.log({label: label, i: i, j:j, lastRowContent: lastRowContent[j]})
                      if ((label === 'SUBTOTAL' || label === '') && i !== headerRows.length - 1) return null;

                    }
                    // if (pivot.cols_total) {
                    //   if (['', 'SUBTOTAL', 'TOTAL'].includes(label) && i !== headerRows.length - 1) return null;

                    // }


                    return (
                      <th
                        key={j}
                        // colSpan={isArray ? cell.length : 1}
                        colSpan={span}
                        onClick={() => toggleSort(label)}
                        className={clsx(
                          "border px-3 py-2 cursor-pointer",
                          isLast ? "text-right" : "text-center"
                        )}
                      >
                        {label}

                        {sortCol === label && (
                          <span className="ml-1">
                            {sortDir === "asc" ? "▲" : "▼"}
                          </span>
                        )}

                      </th>
                    );
                  })}

                </tr>
              );
            })}

          </thead>

          <tbody>

            {paginatedRows.map((row: any, i: number) => {

              const isSubtotal = row[rowDims[rowDims.length - 1]] === "SUBTOTAL";
              const isTotal = row[rowDims[0]] === "TOTAL";

              const rowClass = clsx({
                "bg-gray-200 font-bold": isTotal,
                "bg-gray-100 font-semibold": isSubtotal,
                "hover:bg-gray-50": tableOptions.row_highlight && !isSubtotal && !isTotal
              });

              return (
                <tr key={i} className={rowClass}>

                  {rowDims.map((dim) => (
                    <td key={dim} className="border px-3 py-2">
                      {row[dim] ?? "-"}
                    </td>
                  ))}

                  {allColumns.map((col) => {

                    let value = row[col] ?? 0;

                    if (tableOptions.conditional_formatting && typeof value === "number") {
                      if (value < 0) {
                        value = <span className="text-red-600">{value}</span>;
                      }

                      if (value > 1000) {
                        value = <span className="text-green-600">{value}</span>;
                      }
                    }

                    return (
                      <td key={col} className="border px-3 py-2 text-right">
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

      {tableOptions.pagination && (

        <div className="flex justify-end items-center gap-3 mt-3">

          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            className="px-2 py-1 border rounded disabled:opacity-50"
            disabled={currentPage === 1}
          >
            Prev
          </button>

          <span>
            Page {currentPage} / {Math.ceil(sortedRows.length / pageSize)}
          </span>

          <button
            className="px-2 py-1 border rounded disabled:opacity-50"
            disabled={currentPage === Math.ceil(sortedRows.length / pageSize)}
            onClick={() =>
              setCurrentPage((p) =>
                Math.min(Math.ceil(sortedRows.length / pageSize), p + 1)
              )
            }
          >
            Next
          </button>

        </div>

      )}

    </div>
  );
};


