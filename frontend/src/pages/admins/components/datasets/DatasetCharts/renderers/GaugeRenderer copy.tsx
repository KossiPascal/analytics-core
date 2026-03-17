// import { ChartRenderProp } from "@/models/dataset.models";
// import { useMemo } from "react";

// export const GaugeRenderer = ({ chart, data }: ChartRenderProp) => {

//   if (!data?.rows?.length || !data?.header) {
//     return <div className="text-gray-400 p-4">No data</div>;
//   }

//   const header = data.header;
//   const metric = header._all_columns_order?.[0];

//   const options = useMemo(() => ({
//     ...(chart.options?.gauge ?? {}),
//     ...(chart.options ?? {})
//   }), [chart.options]);

//   const value = useMemo(()=>{

//     return data.rows.reduce((a:any,r:any)=>{
//       return a + (Number(r[metric]) || 0)
//     },0)

//   },[data.rows,metric]);

//   const max = options.max ?? 100;
//   const percentage = Math.min(100,(value/max)*100);

//   return (

//     <div style={{ textAlign:"center", padding:30 }}>

//       <h4>{metric}</h4>

//       <div
//         style={{
//           width:200,
//           height:200,
//           borderRadius:"50%",
//           background:`conic-gradient(#4caf50 ${percentage}%, #eee ${percentage}%)`,
//           display:"flex",
//           alignItems:"center",
//           justifyContent:"center",
//           margin:"auto",
//           fontSize:28,
//           fontWeight:700
//         }}
//       >

//         {percentage.toFixed(0)}%

//       </div>

//     </div>

//   );

// };