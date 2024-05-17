export interface ChartUtils {
  type: 'bar' | 'line' | 'pie' | 'radar' | 'doughnut' | 'polarArea' | 'bubble' | 'scatter' | 'mixed',
  datasets: {
    label: string,
    backgroundColor: string[]|string,
    data: number[] | string[],
    borderColor?: string[]|string,
    pointBackgroundColor?: string,
    pointHoverBorderColor?: string,
    fill?: boolean
  }
}
