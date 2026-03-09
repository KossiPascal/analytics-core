// import { ChartRenderProp } from "@/models/dataset.models";

// export const TableRenderer = ({ chart, data }: ChartRenderProp) => {

//   if (!data?.rows?.length) {
//     return <div className="text-gray-400 p-4">Aucune donnée</div>;
//   }

//   const headerRows: string[][] = data.header.header_rows || []; // multi-niveau header

//   const rowDims = data.header.rows;         // dimensions lignes
//   const colDims = Array.from(data.header.columns); // valeurs uniques colonnes pivot
//   const metrics = data.header.metrics;          // metrics

//   const rows = data.rows;

//   const leafHeader = headerRows[headerRows.length - 1] || [];

//   console.log("rowDims")
//   console.log(rowDims)
//   console.log("colDims")
//   console.log(colDims)
//   console.log("metrics")
//   console.log(metrics)
//   console.log("rows")
//   console.log(rows)

//   return (
//     <div className="overflow-auto border rounded bg-white p-2">
//       <table className="table-auto w-full border-collapse">

//         <thead>

//           {/* HEADER ROW 1 (pivot dimension) */}
//           {headerRows.map((headerRow, i) => (

//             <tr key={i}>
//               {headerRow.map((h, j) => (
//                 <th
//                   key={`${i}_${j}`}
//                   colSpan={metrics.length}
//                   className={`border px-3 py-2 text-center ${i === headerRows.length - 1 ? "bg-gray-100 text-right" : "bg-gray-200"
//                     }`}
//                   style={{
//                     borderBottom: "1px solid #ccc",
//                     padding: 8,
//                     textAlign: i === headerRows.length - 1 && metrics.includes(h) ? "right" : "center",
//                   }}
//                 >
//                   {h || "-"}
//                 </th>
//               ))}
//             </tr>

//           ))}

//         </thead>

//         <tbody>


//           {rows.map((row, rowIndex) => {

//             const pivotColumns = [...colDims.map(c => Array.isArray(c) ? c.join("_") : c)];

//             // if (chart.structure?.pivot?.cols_subtotal) {
//             //   pivotColumns.push("SUBTOTAL");
//             // }
//             // if (chart.structure?.pivot?.rows_subtotal) {
//             //   pivotColumns.push("TOTAL");
//             // }

//             return (
//               <tr key={rowIndex}>
//                 {rowDims.map((dim) => (
//                   <td key={dim} className="border px-3 py-2">
//                     {row[dim] ?? "-"}
//                   </td>
//                 ))}

//                 {pivotColumns.flatMap((c) =>
//                   metrics.map((m) => {
//                     // const key = `${Array.isArray(colVal) ? colVal.join("_") : colVal}_${metric}`;
//                     const t = 'TOTAL';
//                     const s = 'SUBTOTAL';
//                     const key = c === s ? `${s}_${m}` : c === t ? `${t}_${m}` : `${c}_${m}`;

//                     const value = row[key] !== undefined && row[key] !== null ? row[key] : 0
//                     const align = metrics.includes(m) ? "right" : "left";
//                     // const align = typeof val === "number" ? "right" : "left"
//                     const className = "border px-3 py-2 text-right";

//                     if (key in [t, s]) {
//                       return (
//                         <th key={key} className={className} style={{ textAlign: align }}>
//                           {value}
//                         </th>
//                       );
//                     }

//                     return (
//                       <td key={key} className={className} style={{ textAlign: align }}>
//                         {value}
//                       </td>
//                     );
//                   })
//                 )}
//               </tr>
//             )
//           })}

//         </tbody>

//       </table>
//     </div>
//   );
// };








// // ##########################################################################




// // import React from "react";
// // import { ChartRenderProp, TableColumn } from "@/models/dataset.models";

// // export const TableRenderer = ({ chart, data }: ChartRenderProp) => {
// //   if (!data?.length) {
// //     return <div className="text-gray-400 p-4">Aucune donnée</div>;
// //   }

// //   const header = (data as any)?.header as string[];
// //   const rows = Array.isArray(data) ? data : (data as any)?.rows ?? [];

// //   // 1️⃣ Colonnes : table_columns si définies dans options, sinon inférées
// //   let columns: TableColumn[] = (chart.options as any)?.columns ?? [];

// //   if (!columns.length) {

// //     const headers = header ?? Object.keys(rows?.[0] || {});

// //     const metrics = (chart.structure?.metrics ?? []).map(
// //       m => m.alias ?? `${m.aggregation?.toLowerCase()}_${m.field}`
// //     );

// //     const dimensions = [
// //       ...(chart.structure?.rows_dimensions ?? []),
// //       // ...(chart.structure?.cols_dimensions ?? [])
// //     ].map(d => d.alias ?? d.field);

// //     const allFields = Array.from(
// //       new Set([
// //         ...dimensions,
// //         // ...metrics,
// //         ...headers
// //       ].filter(Boolean))
// //     );

// //     columns = allFields.map(field => ({
// //       field,
// //       label: field,
// //       align: metrics.includes(field) ? "right" : "left",
// //     }));
// //   }

// //   // 2️⃣ Tri si order_by défini
// //   const sortedData = [...data];
// //   if (chart.structure?.order_by?.length) {
// //     chart.structure.order_by.forEach(({ field, direction }) => {
// //       sortedData.sort((a, b) => {
// //         const va = a[field];
// //         const vb = b[field];
// //         if (va === vb) return 0;
// //         if (va === null || va === undefined) return 1;
// //         if (vb === null || vb === undefined) return -1;
// //         return direction === "ASC" ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
// //       });
// //     });
// //   }

// //   // 3️⃣ Pivot visuel (si pivot actif)
// //   let displayData = sortedData;
// //   if (chart.structure?.pivot) {
// //     // exemple simple : transformer metrics en colonnes par valeur de la première dimension
// //     const dim = chart.structure.rows_dimensions[0];
// //     const pivotDim = dim.alias?.trim() ?? dim.field?.trim();
// //     if (pivotDim) {
// //       const pivotMap: Record<string, any> = {};
// //       displayData.forEach((row) => {
// //         const key = row[pivotDim];
// //         if (!pivotMap[key]) pivotMap[key] = { [pivotDim]: key };
// //         chart.structure.metrics.forEach((m) => {
// //           pivotMap[key][m.field] = row[m.field];
// //         });
// //       });
// //       displayData = Object.values(pivotMap);
// //     }
// //   }

// //   return (
// //     <div className="overflow-auto border rounded bg-white p-2">
// //       <table className="table-auto w-full border-collapse" style={{ borderCollapse: "collapse" }}>
// //         <thead>
// //           <tr>
// //             {columns.map((c) => (
// //               <th
// //                 key={c.field}
// //                 className="border-b px-3 py-2 bg-gray-100"
// //                 style={{
// //                   borderBottom: "1px solid #ccc",
// //                   padding: 8,
// //                   textAlign: c.align || "left",
// //                   position: "sticky",
// //                   top: 0,
// //                   background: "#f9fafb",
// //                 }}
// //                 title={c.label}
// //               >
// //                 {c.label}
// //               </th>
// //             ))}
// //           </tr>
// //         </thead>
// //         <tbody>
// //           {/* {displayData.map((row, rowIndex) => ( */}
// //           {rows.map((row:any, rowIndex:number) => (
// //             <tr key={rowIndex} className="hover:bg-gray-50">
// //               {columns.map((c) => {
// //                 const val = row[c.field];
// //                 return (
// //                   <td
// //                     key={c.field}
// //                     className="border-b px-3 py-2"
// //                     style={{
// //                       padding: 8,
// //                       borderBottom: "1px solid #eee",
// //                       textAlign: c.align || "left",
// //                     }}
// //                   >
// //                     {val !== undefined && val !== null
// //                       ? typeof val === "number"
// //                         ? val.toLocaleString()
// //                         : !isNaN(Number(val))
// //                           ? Number(val).toLocaleString()
// //                           : String(val)
// //                       : "-"}
// //                   </td>
// //                 );
// //               })}
// //             </tr>
// //           ))}
// //         </tbody>
// //       </table>
// //     </div>
// //   );
// // };





// // ###########################################################################








// // import { ChartRenderProp, TableColumn } from "@/models/dataset.models";

// // export const TableRenderer = ({ chart, data }: ChartRenderProp) => {
// //   if (!data?.length) {
// //     return <div className="text-gray-400 p-4">Aucune donnée</div>;
// //   }

// //   // Colonnes : table_columns si définies, sinon inférées depuis les données et metrics
// //   let columns: TableColumn[] = ((chart.options as any)?.table_columns as TableColumn[]) ?? [];

// //   if (!columns?.length) {
// //     const headers = Object.keys(data[0] || {});
// //     const metrics = chart.structure?.metrics ?? [];
// //     columns = [...headers, ...metrics.map(m=>m.field)].map((k) => ({ field: k, label: k }));
// //   }

// //   return (
// //     <div className="overflow-auto border rounded bg-white p-2">
// //       <table
// //         className="table-auto w-full border-collapse"
// //         style={{ width: "100%", borderCollapse: "collapse" }}
// //       >
// //         <thead>
// //           <tr>
// //             {columns.map((c) => (
// //               <th
// //                 key={c.field}
// //                 className="border-b px-3 py-2 bg-gray-100"
// //                 style={{ borderBottom: "1px solid #ccc", padding: 8, textAlign: "left" }}
// //               >
// //                 {c.label}
// //               </th>
// //             ))}
// //           </tr>
// //         </thead>
// //         <tbody>
// //           {data.map((row, rowIndex) => (
// //             <tr key={rowIndex} className="hover:bg-gray-50">
// //               {columns.map((c) => (
// //                 <td
// //                   key={c.field}
// //                   className="border-b px-3 py-2"
// //                   style={{ padding: 8, borderBottom: "1px solid #eee" }}
// //                 >
// //                   {row[c.field] !== undefined && row[c.field] !== null
// //                     ? String(row[c.field])
// //                     : "-"}
// //                 </td>
// //               ))}
// //             </tr>
// //           ))}
// //         </tbody>
// //       </table>
// //     </div>
// //   );
// // };