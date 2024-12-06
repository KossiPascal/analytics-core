import { Component, HostListener } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ChartUtils } from '@kossi-models/charts';
import { RecoPerformanceDashboard } from '@kossi-models/dashboards';
import { IndicatorsDataOutput } from '@kossi-models/reports';
import { LocalDbDataFetchService } from '@kossi-services/local-db-data-fetch.service';
import { SnackbarService } from '@kossi-services/snackbar.service';
import { toArray, monthByArg } from '@kossi-src/app/utils/functions';

declare var $: any;
declare var Chart: any;

export function getColors(numberOfColors: number) {
  const backgroundColor = [];
  const colors = [];
  for (let i = 0; i < (numberOfColors * 2); i++) {
    const color = '#' + Math.floor(Math.random() * 16777215).toString(16);
    if (backgroundColor.length !== numberOfColors) {
      backgroundColor.push(color);
    } else {
      colors.push(color);
    }
  }
  return { backgroundColors: backgroundColor, colors: colors };
}

@Component({
  selector: 'reco-performance',
  templateUrl: './reco-performance.component.html',
  styleUrl: './reco-performance.component.css'
})

export class RecoPerformanceDashboardComponent {

  RECOS_PERFORMANCE$!: RecoPerformanceDashboard | undefined;

  MONTH!: string;
  YEAR!: number;
  ON_FETCHING: boolean = false;

  BAR_TITLE!: string;
  LINE_TITLE!: string;
  YEAR_BAR_TITLE!: string;
  YEAR_LINE_TITLE!: string;


  householdCount!: number;
  patientCount!: number;
  newborn0To2MonthsCount!: number;
  child2To60MonthsCount!: number;
  child5To14YearsCount!: number;
  adultOver14YearsCount!: number;
  consultationCount!: number;
  followupCount!: number;
  allActionsCount!: number;

  screenWidth: number;
  COLUMN_WIDTH: number;
  _formGroup!: FormGroup;


  constructor(private ldbfetch: LocalDbDataFetchService, private snackbar: SnackbarService) {
    this.screenWidth = window.innerWidth;
    this.COLUMN_WIDTH = (window.innerWidth - 600) / 4;
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.screenWidth = window.innerWidth;
  }

  quantityStyle(data: number) {
    if (data < 0) return 'quantity-error'
    return data > 0 ? 'quantity-up' : 'quantity-down';
  }

  SHOW_DATA(updatedFormGroup: any) {
    this._formGroup = updatedFormGroup;
    if (!(this._formGroup.value.recos.length > 0)) {
      this.snackbar.show('Veuillez sélectionner au moins un RECO', { backgroundColor: 'warning', position: 'TOP' });
      return;
    }
    if (!(toArray(this._formGroup.value.months).length > 0)) {
      this.snackbar.show('Veuillez sélectionner au moins un mois', { backgroundColor: 'warning', position: 'TOP' });
      return;
    }
    if (!(this._formGroup.value.year > 0)) {
      this.snackbar.show('Veuillez sélectionner au moins une année', { backgroundColor: 'warning', position: 'TOP' });
      return;
    }

    this.ON_FETCHING = true;
    this._formGroup.value.months = toArray(this._formGroup.value.months);
    this.ldbfetch.GetRecoPerformanceDashboard(this._formGroup.value).then((_res$: IndicatorsDataOutput<RecoPerformanceDashboard> | undefined) => {
      // this.RECOS_PERFORMANCE$ = _res$?.data;
      this.householdCount = _res$?.data.householdCount ?? 0;
      this.patientCount = _res$?.data.patientCount ?? 0;
      this.newborn0To2MonthsCount = _res$?.data.newborn0To2MonthsCount ?? 0;
      this.child2To60MonthsCount = _res$?.data.child2To60MonthsCount ?? 0;
      this.child5To14YearsCount = _res$?.data.child5To14YearsCount ?? 0;
      this.adultOver14YearsCount = _res$?.data.adultOver14YearsCount ?? 0;
      this.consultationCount = _res$?.data.consultationCount ?? 0;
      this.followupCount = _res$?.data.followupCount ?? 0;
      this.allActionsCount = _res$?.data.allActionsCount ?? 0;
      const dtB = _res$?.data.barChart;
      // const dtL = _res$?.data.lineChart;
      const dtYb = _res$?.data.yearBarChart;
      const dtYl = _res$?.data.yearLineChart;
      // if (dtL) {
      //   this.LINE_TITLE = dtL.title;
      //   this.generateChart({ cibleId: 'line-chart', type: 'line', absisseLabels: dtL.absisseLabels, datasets: dtL.datasets })
      // }

      if (dtB) {
        this.BAR_TITLE = dtB.title;
        this.generateChart({ cibleId: 'bar-chart', type: 'bar', absisseLabels: dtB.absisseLabels, datasets: dtB.datasets })
      }

      if (dtYl) {
        this.YEAR_LINE_TITLE = dtYl.title;
        this.generateChart({ cibleId: 'year-line-chart', type: 'line', absisseLabels: dtYl.absisseLabels, datasets: dtYl.datasets })
      }

      if (dtYb) {
        this.YEAR_BAR_TITLE = dtYb.title;
        this.generateChart({ cibleId: 'year-bar-chart', type: 'bar', absisseLabels: dtYb.absisseLabels, datasets: dtYb.datasets })
      }

      this.MONTH = monthByArg(this._formGroup.value.month).labelFR;
      this.YEAR = this._formGroup.value.year;
      if (!_res$) {
        this.snackbar.show('Aucune données disponible pour ces paramettres. Veuillez reessayer!', { backgroundColor: 'info', position: 'TOP', duration: 5000 });
      }
      this.ON_FETCHING = false;
    }, (err: any) => {
      console.log(err)
      this.ON_FETCHING = false;
    });
  }




  generateChart(p: { cibleId: string, type: ChartUtils['type'], absisseLabels: number[] | string[], datasets: ChartUtils['datasets'][] }) {

    const canvases = $("#" + p.cibleId)

    // Check if there is at least one canvas element
    if (!canvases || canvases.length <= 0) {
      return;
    }

    const canvas = canvases.get(0);


    if (canvas && canvas.chart) {
      // If a chart exists, destroy it
      canvas.chart.destroy();
    }

    // Chart Global Color
    Chart.defaults.color = "#6C7293";
    Chart.defaults.borderColor = "#000000";

    var datasetsList = [];

    for (const dt of p.datasets) {
      const datasetsShema: any = {
        label: dt.label,
        backgroundColor: dt.backgroundColor,
        data: dt.data,
        borderWidth: p.type !== 'bar' ? 3 : 0,
        pointBorderColor: '#000',
        pointBorderWidth: 3,
        pointRadius: 4,
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderWidth: 2
      };
      if (dt.fill) datasetsShema['fill'] = dt.fill === true;
      if (dt.borderColor) datasetsShema['borderColor'] = dt.borderColor;
      if (dt.pointBackgroundColor) datasetsShema['pointBackgroundColor'] = dt.pointBackgroundColor;
      if (dt.pointHoverBorderColor) datasetsShema['pointHoverBorderColor'] = dt.pointHoverBorderColor;
      datasetsList.push(datasetsShema);
    }


    const ctx = canvas.getContext("2d");
    const chart = new Chart(ctx, {
      type: p.type,
      data: {
        labels: p.absisseLabels,
        datasets: datasetsList
      },
      options: {
        responsive: true, // Enable responsiveness
        maintainAspectRatio: true, // Whether to maintain the aspect ratio or not
        hover: {
          mode: 'nearest',
          intersect: true
        },

        title: {
          display: true,
          text: 'REOC DATA',
          fontSize: 16,
          fontColor: '#333',
          fontFamily: 'Arial',
          fontStyle: 'bold'
        },

        legend: {
          display: true,
          position: 'top',
          labels: {
            fontSize: 12,
            fontColor: '#666',
            fontFamily: 'Arial',
            fontStyle: 'normal'
          }
        },

        tooltips: {
          enabled: true,
          mode: 'label',
          backgroundColor: 'rgba(0,0,0,0.2)',
          titleFontFamily: 'Arial',
          titleFontSize: 14,
          titleFontStyle: 'normal',
          titleFontColor: '#fff',
          bodyFontFamily: 'Arial',
          bodyFontSize: 12,
          bodyFontStyle: 'normal',
          bodyFontColor: '#fff',
          displayColors: false
        },
        scales: {
          x: {
            display: true,
            // stacked: true,
            ticks: {
              beginAtZero: true,
              fontSize: 12,
              fontColor: '#666',
              fontFamily: 'Arial',
              fontStyle: 'normal'
            },
            grid: {
              display: true,
              color: "rgba(0, 0, 0, 0.1)",
              offsetGridLines: true
            },
            scaleLabel: {
              display: true,
              labelString: 'Value'
            }
          },
          y: {
            display: true,
            // stacked: true,
            ticks: {
              beginAtZero: true,
              fontSize: 12,
              fontColor: '#666',
              fontFamily: 'Arial',
              fontStyle: 'normal'
            },
            grid: {
              display: true,
              color: "rgba(0, 0, 0, 0.1)",
              offsetGridLines: true
            },
            scaleLabel: {
              display: true,
              labelString: 'Value'
            }
          }
        }
      }

    });
    canvas.chart = chart;
  }



  genarateDataSet(): void {
    setTimeout(() => {
      // const datasets1: ChartUtils['datasets'][] = [
      //   {
      //     label: 'DATA 1',
      //     backgroundColor: getColors(1).backgroundColors,
      //     data: [55, 49, 44, 24, 15],
      //     borderColor: 'rgba(255, 99, 132, 0.0)',//'none',//getColors(2).colors,
      //     fill: false,
      //   },
      //   {
      //     label: 'DATA 2',
      //     backgroundColor: getColors(1).backgroundColors,
      //     data: [24, 15, 55, 49, 44],
      //     // borderColor: 'rgba(255, 99, 132, 0.0)',//'none',//getColors(2).colors,
      //     fill: false
      //   },
      // ]
      // const datasets2: ChartUtils['datasets'][] = [
      //   {
      //     label: 'DATA 1',
      //     backgroundColor: getColors(1).backgroundColors,
      //     data: [7, 8, 8, 9, 9, 9, 10, 11, 14, 14, 15],
      //     borderColor: getColors(2).colors,
      //     fill: false
      //   },
      //   {
      //     label: 'DATA 2',
      //     backgroundColor: getColors(1).backgroundColors,
      //     data: [10, 11, 14, 14, 7, 8, 8, 9, 9, 9, 15],
      //     borderColor: getColors(2).colors,
      //     fill: false
      //   },
      // ]
    });

  }


}


