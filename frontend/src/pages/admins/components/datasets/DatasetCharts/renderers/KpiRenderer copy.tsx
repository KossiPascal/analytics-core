// import { ChartRenderProp } from "@/models/dataset.models";
// import { useMemo } from "react";

// export const KpiRenderer = ({ chart, data }: ChartRenderProp) => {

//   if (!data?.rows?.length || !data?.header) {
//     return <div className="text-gray-400 p-4">No data</div>;
//   }

//   const header = data.header;
//   const allColumns = header._all_columns_order ?? [];

//   const options = useMemo(() => ({
//     ...(chart.options?.kpi ?? {}),
//     ...(chart.options ?? {})
//   }), [chart.options]);

//   const colors = options.color_scheme ?? [
//     "#4caf50","#2196f3","#ff9800","#9c27b0"
//   ];

//   const totals = useMemo(()=>{

//     const res:any = {}

//     allColumns.forEach(col=>{
//       res[col] = data.rows.reduce((a:any,r:any)=>a+(Number(r[col])||0),0)
//     })

//     return res

//   },[data.rows,allColumns])

//   return (

//     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">

//       {allColumns.map((col,i)=>(
//         <div
//           key={col}
//           className="p-4 border rounded text-center"
//           style={{backgroundColor:colors[i % colors.length]+"20"}}
//         >

//           <div className="text-gray-600">{col}</div>

//           <div className="text-3xl font-bold mt-2">
//             {totals[col].toLocaleString()}
//           </div>

//         </div>
//       ))}

//     </div>

//   )

// }