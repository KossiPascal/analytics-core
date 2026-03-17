// import { ChartRenderProp } from "@/models/dataset.models"
// import { PieRenderer } from "./PieRenderer"

// export const DonutRenderer = (props: ChartRenderProp) => {

//   const chart = {
//     ...props.chart,
//     options:{
//       ...(props.chart.options ?? {}),
//       pie:{
//         ...(props.chart.options?.pie ?? {}),
//         inner_radius: props.chart.options?.pie?.inner_radius ?? 70
//       }
//     }
//   }

//   return <PieRenderer {...props} chart={chart} />
// }