// export interface DataValueSet {
//   dataSet: string,
//   period: string,
//   orgUnit: string,
//   dataValues: {
//     dataElement: string,
//     categoryOptionCombo: string,
//     value: number
//   }[]
// }

export interface Dhis2DataValueSetParams {
  username:string,
  password:string,
  months: string[],
  year: number,
  recos: string[],
  period: { year: any, month: any }
  data: any,
}
