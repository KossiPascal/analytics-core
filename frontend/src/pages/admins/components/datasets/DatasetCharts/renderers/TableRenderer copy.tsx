// import { CHART_COLS_SEPARATOR, ChartRenderProp } from "@/models/dataset.models";
// import { useState, useMemo } from "react";
// import clsx from "clsx";

// export const TableRenderer = ({ chart, query, data }: ChartRenderProp) => {

//   if (!data?.rows?.length) {
//     return <div className="text-gray-400 p-4">Aucune donnée</div>;
//   }

//   const options = {
//     ...((chart.options ?? {}).table ?? {}),
//     ...(chart.options ?? {})
//   };

//   const header = data.header;

//   const headerRows = header.header_rows || [];
//   const rowDims = header.rows || [];
//   const colDims = header.columns || [];
//   const colDimsMap = header.column_maps || {};
//   const colDimsLabel = header.column_label_maps || {};
//   const metrics = header.metrics || [];
//   const rows = data.rows;
//   const allColumns = header._all_columns_order || [];

//   const pivot = chart.structure?.pivot || {};
//   const pageSize = options.page_size ?? 10;

//   // const lastHeadRowContent = headerRows[headerRows.length - 1];

//   const [searchQuery, setSearchQuery] = useState("");
//   const [currentPage, setCurrentPage] = useState(1);
//   const [sortCol, setSortCol] = useState<string | null>(null);
//   const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");


//   /* SEARCH */
//   const filteredRows = useMemo(() => {
//     if (!options.searchable || !searchQuery) return rows;

//     return rows.filter((row: any) =>
//       Object.values(row).some((v) =>
//         String(v).toLowerCase().includes(searchQuery.toLowerCase())
//       )
//     );
//   }, [rows, searchQuery, options.searchable]);

//   /* SORT */

//   const sortedRows = useMemo(() => {
//     if (!sortCol) return filteredRows;
//     const sorted = [...filteredRows].sort((a: any, b: any) => {
//       const av = a[sortCol];
//       const bv = b[sortCol];
//       if (av === bv) return 0;
//       if (sortDir === "asc") {
//         return av > bv ? 1 : -1;
//       }
//       return av < bv ? 1 : -1;
//     });
//     return sorted;
//   }, [filteredRows, sortCol, sortDir]);

//   /* PAGINATION */
//   const paginatedRows = useMemo(() => {
//     if (!options.pagination) return sortedRows;
//     const start = (currentPage - 1) * pageSize;
//     return sortedRows.slice(start, start + pageSize);
//   }, [sortedRows, currentPage, pageSize, options.pagination]);

//   /* EXPORT */

//   const exportCSV = () => {
//     const cols = [...rowDims, ...allColumns];
//     const csv = [
//       cols.map(c => `${c}`.replace(CHART_COLS_SEPARATOR, " ")).join(","),
//       ...sortedRows.map((r: any) => cols.map((c) => r[c] ?? "").join(","))
//     ].join("\n");

//     const blob = new Blob([csv], { type: "text/csv" });
//     const url = URL.createObjectURL(blob);

//     const a = document.createElement("a");
//     a.href = url;
//     a.download = `${options.title ?? "table"}.csv`;
//     a.click();
//   };

//   const toggleSort = (col: string) => {
//     if (!options.sortable) return;
//     if (sortCol === col) {
//       setSortDir(sortDir === "asc" ? "desc" : "asc");
//     } else {
//       setSortCol(col);
//       setSortDir("asc");
//     }
//   };


//   return (
//     <div className="border rounded bg-white p-4">

//       {/* TITLE */}
//       {options.title && (
//         <div className="text-lg font-semibold mb-1">{options.title}</div>
//       )}

//       {options.subtitle && (
//         <div className="text-gray-500 mb-3">{options.subtitle}</div>
//       )}

//       {/* TOOLBAR */}
//       <div className="mb-3 flex justify-between mb-3 items-center">

//         {options.searchable && (
//           <input
//             type="text"
//             placeholder="Rechercher..."
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//             className="border rounded px-3 py-1 w-64 w-full md:w-1/3"
//           />
//         )}

//         {options.exportable && (
//           <div className="mt-2 flex justify-end">
//             <button
//               onClick={exportCSV}
//               className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
//             >
//               Export CSV
//             </button>
//           </div>
//         )}

//       </div>

//       {/* TABLE */}

//       <div className="overflow-auto max-h-[600px]">
//         <table className="table-auto w-full border-collapse text-sm">
//           <thead className="sticky top-0 bg-gray-100 z-10">

//             {headerRows.map((headerRow, i: number) => {

//               const isLast = i === headerRows.length - 1;

//               return (
//                 <tr key={i}>
//                   {i === 0 &&
//                     rowDims.map((dim, idx) => (
//                       <th key={idx} rowSpan={headerRows.length} onClick={() => toggleSort(dim)}
//                         className="border px-3 py-2 bg-gray-100 text-left cursor-pointer">
//                         {dim}
//                       </th>
//                     ))}

//                   {headerRow.map((cell, j: number) => {
//                     const isArray = Array.isArray(cell);
//                     let label = isArray ? cell[0] : cell;

//                     // const metricSpan = metrics.length + (pivot.cols_subtotal ? 1 : 0);
//                     const metricSpan = (isArray ? cell.length : 1) + (pivot.cols_subtotal ? 1 : 0);
//                     const headLen = headerRows.length - 1;

//                     if (pivot.cols_subtotal && label === "SUBTOTALS" && i !== headLen) {
//                       return null;
//                     }

//                     if (pivot.cols_total && label === "TOTALS") {
//                       return i == 0 ? (
//                         <th key={`total_${i}`} rowSpan={headerRows.length} onClick={() => toggleSort(label)}
//                           className="border px-3 py-2 bg-gray-100 text-left cursor-pointer">
//                           {label}
//                         </th>
//                       ) : null;
//                     }

//                     const key = colDimsLabel[i];
//                     label = ((options.renames ?? {})[key] ?? {})[label] ?? label;

//                     return (
//                       <th key={j} colSpan={i === headLen ? 1 : metricSpan}
//                         onClick={() => toggleSort(label)}
//                         className={clsx("border px-3 py-2 cursor-pointer", isLast ? "text-right" : "text-center")}>

//                         {label ?? '-'}

//                         {(options.sortable && sortCol === label) && (
//                           <span className="ml-1">
//                             {sortDir === "asc" ? "▲" : "▼"}
//                           </span>
//                         )}

//                       </th>
//                     );
//                   })}
//                 </tr>
//               );
//             })}
//           </thead>

//           <tbody>

//             {paginatedRows.map((row: any, i: number) => {

//               const isSubtotal = row[rowDims[rowDims.length - 1]] === "SUBTOTALS";
//               const isTotal = row[rowDims[0]] === "TOTALS";

//               const rowClass = clsx({
//                 "bg-gray-200 font-bold": isTotal,
//                 "bg-gray-100 font-semibold": isSubtotal,
//                 "hover:bg-gray-50": options.row_highlight && !isSubtotal && !isTotal
//               });

//               // const  = 

//               return (
//                 <tr key={i} className={rowClass}>

//                   {rowDims.map((dim, i) => {
//                     let field = row[dim];
//                     if (field) {
//                       const renames = (options.renames ?? {})[dim] ?? {};
//                       field = renames[field] ?? field;
//                     }
//                     return (
//                       <td key={dim} className="border px-3 py-2">
//                         {field ?? "-"}
//                       </td>
//                     );
//                   })}

//                   {allColumns.map((col) => {

//                     let value = row[col] ?? 0;

//                     if (options.conditional_formatting && typeof value === "number") {
//                       if (value < 0) {
//                         value = <span className="text-red-600">{value}</span>;
//                       }

//                       if (value > 1000) {
//                         value = <span className="text-green-600">{value}</span>;
//                       }
//                     }

//                     return (
//                       <td key={col} className="border px-3 py-2 text-right">
//                         {value}
//                       </td>
//                     );
//                   })}

//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>
//       </div>

//       {/* PAGINATION */}

//       {options.pagination && (

//         <div className="flex justify-end items-center gap-3 mt-3">

//           <button
//             onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
//             className="px-2 py-1 border rounded disabled:opacity-50"
//             disabled={currentPage === 1}
//           >
//             Prev
//           </button>

//           <span>
//             Page {currentPage} / {Math.ceil(sortedRows.length / pageSize)}
//           </span>

//           <button
//             className="px-2 py-1 border rounded disabled:opacity-50"
//             disabled={currentPage === Math.ceil(sortedRows.length / pageSize)}
//             onClick={() =>
//               setCurrentPage((p) =>
//                 Math.min(Math.ceil(sortedRows.length / pageSize), p + 1)
//               )
//             }
//           >
//             Next
//           </button>

//         </div>

//       )}

//     </div>
//   );
// };


