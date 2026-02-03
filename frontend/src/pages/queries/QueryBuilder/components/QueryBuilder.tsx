// import { useEffect, useMemo, useState } from "react";
// import { ConnectionAPI } from "@services/connection.service";

// export default function QueryBuilder({ connectionId }:{ connectionId:string }) {
//   const [tables, setTables] = useState([]);
//   const [columns, setColumns] = useState([]);
//   const [table, setTable] = useState("");
//   const [selectedCols, setSelectedCols] = useState([]);
//   const [rows, setRows] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);

//   // Load tables
//   useEffect(() => {
//     if (!connectionId) return;
//     ConnectionAPI.schema(connectionId)
//       .then((d:any) => setTables(d.tables || []))
//       .catch((err:any) => setError(err.message));
//   }, [connectionId]);

//   // Load columns
//   useEffect(() => {
//     if (!table) return;
//     setSelectedCols([]);
//     ConnectionAPI.schema(connectionId, table)
//       .then((d:any) => setColumns(d.columns || []))
//       .catch((err:any) => setError(err.message));
//   }, [table, connectionId]);

//   const canRun = table && selectedCols.length > 0;

//   const run = async () => {
//     if (!canRun) return;
//     setLoading(true);
//     setError(null);

//     try {
//       const data = await ConnectionAPI.run({
//         connection_id: connectionId,
//         query: {table, columns: selectedCols, filters: [], metrics: [] }
//       });
//       setRows(data);
//     } catch (err:any) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const headers = useMemo(
//     () => (rows[0] ? Object.keys(rows[0]) : []),
//     [rows]
//   );

//   return (
//     <section className="qb">
//       <h3>Query Builder</h3>

//       <select value={table} onChange={e => setTable(e.target.value)}>
//         <option value="">-- Select table --</option>
//         {tables.map(t => <option key={t} value={t}>{t}</option>)}
//       </select>

//       <div className="cols">
//         {columns.map(c => (
//           <label key={c}>
//             <input
//               type="checkbox"
//               checked={selectedCols.includes(c)}
//               onChange={() =>
//                 setSelectedCols(s =>
//                   s.includes(c) ? s.filter(x => x !== c) : [...s, c]
//                 )
//               }
//             />
//             {c}
//           </label>
//         ))}
//       </div>

//       <button disabled={!canRun || loading} onClick={run}>
//         {loading ? "Running..." : "Run"}
//       </button>

//       {error && <div className="error">{error}</div>}

//       {rows.length > 0 && (
//         <table>
//           <thead>
//             <tr>
//               {headers.map(h => <th key={h}>{h}</th>)}
//             </tr>
//           </thead>
//           <tbody>
//             {rows.map((r, i) => (
//               <tr key={i}>
//                 {headers.map(h => <td key={h}>{String(r[h])}</td>)}
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       )}
//     </section>
//   );
// }
