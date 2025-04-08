import { AfterViewInit, Component } from '@angular/core';
import { RecoPerformanceDashboard } from '@kossi-models/dashboards';
import { ConnectivityService } from '@kossi-services/connectivity.service';
import { LocalDbDataFetchService } from '@kossi-services/local-db-data-fetch.service';
import { SnackbarService } from '@kossi-services/snackbar.service';
import { monthByArg } from '@kossi-shared/functions';
import { BaseDashboardsComponent } from '../base-dashboards.component';
import { from, takeUntil } from 'rxjs';
import { FormGroupService } from '@kossi-services/form-group.service';

import { Chart, ChartTypeRegistry, registerables } from "chart.js";
import { ChartDataSet, ChartOptions } from '@kossi-models/interfaces';
import { UserContextService } from '@kossi-services/user-context.service';


// declare var $: any;
// declare var Chart: any;


@Component({
  standalone: false,
  selector: 'reco-performance-dashboard',
  templateUrl: './reco-performance.component.html',
  styleUrl: './reco-performance.component.css'
})

export class RecoPerformanceDashboardComponent extends BaseDashboardsComponent<RecoPerformanceDashboard> implements AfterViewInit {

  RECOS_PERFORMANCE$!: RecoPerformanceDashboard | undefined;

  override DASHBOARD_NAME = 'RECOS_PERFORMANCES';


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




  constructor(private ldbfetch: LocalDbDataFetchService, fGroup: FormGroupService, conn: ConnectivityService, snackbar: SnackbarService, userCtx: UserContextService) {
    Chart.register(...registerables);

    super(
      fGroup,
      conn,
      snackbar,
      userCtx,
      (formData, isOnline) => from(this.ldbfetch.GetRecoPerformanceDashboard(formData, isOnline)),
    );

    this.fGroup.DASHBOARDS_DATA$.pipe(takeUntil(this.destroy$)).subscribe(dataSaved => {
      if (dataSaved) {

        this.RECOS_PERFORMANCE$ = (dataSaved as any)[this.DASHBOARD_NAME]?.data as RecoPerformanceDashboard;

        this.householdCount = this.RECOS_PERFORMANCE$?.householdCount ?? 0;
        this.patientCount = this.RECOS_PERFORMANCE$?.patientCount ?? 0;
        this.newborn0To2MonthsCount = this.RECOS_PERFORMANCE$?.newborn0To2MonthsCount ?? 0;
        this.child2To60MonthsCount = this.RECOS_PERFORMANCE$?.child2To60MonthsCount ?? 0;
        this.child5To14YearsCount = this.RECOS_PERFORMANCE$?.child5To14YearsCount ?? 0;
        this.adultOver14YearsCount = this.RECOS_PERFORMANCE$?.adultOver14YearsCount ?? 0;
        this.consultationCount = this.RECOS_PERFORMANCE$?.consultationCount ?? 0;
        this.followupCount = this.RECOS_PERFORMANCE$?.followupCount ?? 0;
        this.allActionsCount = this.RECOS_PERFORMANCE$?.allActionsCount ?? 0;
        const dtL = this.RECOS_PERFORMANCE$?.lineChart;
        const dtB = this.RECOS_PERFORMANCE$?.barChart;
        const dtYb = this.RECOS_PERFORMANCE$?.yearBarChart;
        const dtYl = this.RECOS_PERFORMANCE$?.yearLineChart;

        setTimeout(() => {

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

          if (dtL) {
            this.LINE_TITLE = dtL.title;
            this.generateChart({ cibleId: 'line-chart', type: 'line', absisseLabels: dtL.absisseLabels, datasets: dtL.datasets })
          }

          this.MONTH = monthByArg(this.form.value.month).labelFR;
          this.YEAR = this.form.value.year;
        }, 500);

      }
    });
  }

  quantityStyle(data: number) {
    if (data < 0) return 'quantity-error'
    return data > 0 ? 'quantity-up' : 'quantity-down';
  }


  // // Enregistrer les modules nécessaires de Chart.js
  // Chart.register(...registerables);



  generateChart({ cibleId, type, absisseLabels, datasets }: ChartOptions): void {
    const canvasElement: any = document.getElementById(cibleId) as HTMLCanvasElement | null;
    const selectElement: any = document.getElementById(`${cibleId}-select`) as HTMLCanvasElement | null;


    if (!canvasElement) {
      // console.error(`Canvas not found with ID: ${cibleId}`);
      return;
    }

    // Destroy the existing chart if present
    if (canvasElement.chart) {
      canvasElement.chart.destroy();
    }

    const ctx = canvasElement.getContext("2d");
    if (!ctx) {
      // console.error("Unable to get 2D context of the canvas");
      return;
    }

    if (!(datasets.length > 0)) {
      return;
    }

    // Global chart default settings
    Chart.defaults.color = "#6C7293";
    Chart.defaults.borderColor = "#000000";


    // Transforming datasets to the correct format
    const datasetsList:ChartDataSet[] = datasets.map(dataset => ({
      label: dataset.label,
      backgroundColor: Array.isArray(dataset.backgroundColor)
        ? dataset.backgroundColor.map(color => `${color}`)
        : [`${dataset.backgroundColor}`],
      data: dataset.data.map(value => Number(value)),  // Ensures values are numbers
      borderWidth: type !== 'bar' ? 3 : 0,
      pointBorderColor: '#000',
      pointBorderWidth: 3,
      pointRadius: 4,
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderWidth: 2,
      fill: dataset.fill || false,
      borderColor: dataset.borderColor || undefined,
      pointBackgroundColor: dataset.pointBackgroundColor || undefined,
      pointHoverBorderColor: dataset.pointHoverBorderColor || undefined
    }));




    if (selectElement) {
      selectElement.innerHTML = '';
      absisseLabels.forEach((label, index) => {
        const option = document.createElement("option");
        option.value = index.toString();
        option.textContent = label.toString();
        option.selected = true; // Tout est coché par défaut
        selectElement.appendChild(option);
      });
      selectElement.addEventListener("change", () => this.updateChartVisibility({ cibleId, type, absisseLabels, datasets }));

    }


    // Creating the chart with full configuration options
    const chart = new Chart(ctx, {
      type: type as keyof ChartTypeRegistry,  // Chart type, such as 'line', 'bar', etc.
      data: {
        labels: absisseLabels.map(a => `${a}`),  // Ensure all labels are strings
        datasets: datasetsList
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          title: {
            display: true,
            text: 'REOC DATA',  // Customize the chart title
            font: {
              size: 16,
              weight: 'bold',
              family: 'Arial'
            },
            color: '#333'
          },
          legend: {
            display: true,
            position: 'top',
            labels: {
              font: {
                size: 12,
                family: 'Arial',
                weight: 'normal'
              },
              color: '#666'
            }
          },
          tooltip: {
            enabled: true,
            mode: "nearest",//' | "index" | "dataset" | "point" | "x" | "y" | undefined',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleFont: {
              family: 'Arial',
              size: 14,
              weight: 'normal',
              // color: '#fff'
            },
            bodyFont: {
              family: 'Arial',
              size: 12,
              weight: 'normal',
              // color: '#fff'
            },
            displayColors: false
          }
        },
        scales: {
          x: {
            display: true,
            ticks: {
              // beginAtZero: true,
              font: {
                size: 12,
                family: 'Arial',
                weight: 'normal'
              },
              color: '#666'
            },
            grid: {
              display: true,
              color: "rgba(0, 0, 0, 0.1)",
              // offsetGridLines: true
            },
            // title: {
            //   display: true,
            //   text: 'Value'
            // }
          },
          y: {
            display: true,
            ticks: {
              // beginAtZero: true,
              font: {
                size: 12,
                family: 'Arial',
                weight: 'normal'
              },
              color: '#666'
            },
            grid: {
              display: true,
              color: "rgba(0, 0, 0, 0.1)",
              // offsetGridLines: true
            },
            // title: {
            //   display: true,
            //   text: 'Value'
            // }
          }
        }
      }
    });

    // Store the chart instance for future access (destruction or updates)
    canvasElement.chart = chart;
  }


  updateChartVisibility({ cibleId, type, absisseLabels, datasets }: ChartOptions) {
    const canvasElement: any = document.getElementById(cibleId) as HTMLCanvasElement | null;
    const selectElement: any = document.getElementById(`${cibleId}-select`) as HTMLCanvasElement | null;

    const chart = canvasElement?.chart;

    if (!chart) return;

    const selectedIndices = Array.from(selectElement.selectedOptions).map((option:any) => Number(option.value));

    // Mise à jour des labels sélectionnés
    const newLabels = selectedIndices.map(index => absisseLabels![index] as string);


    const datasetsList:ChartDataSet[] = datasets.map(dataset => ({
      label: dataset.label,
      backgroundColor: Array.isArray(dataset.backgroundColor)
        ? dataset.backgroundColor.map(color => `${color}`)
        : [`${dataset.backgroundColor}`],
      data: dataset.data.map(value => Number(value)),  // Ensures values are numbers
      borderWidth: type !== 'bar' ? 3 : 0,
      pointBorderColor: '#000',
      pointBorderWidth: 3,
      pointRadius: 4,
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderWidth: 2,
      fill: dataset.fill || false,
      borderColor: dataset.borderColor || undefined,
      pointBackgroundColor: dataset.pointBackgroundColor || undefined,
      pointHoverBorderColor: dataset.pointHoverBorderColor || undefined
    }));

    // Mise à jour des datasets avec toutes leurs valeurs correspondant aux indices sélectionnés
    const newDatasets = datasetsList.map(dataset => ({
        ...dataset,
        data: selectedIndices.map(index => dataset.data[index]) // Prend toutes les valeurs correspondant aux indices sélectionnés
    }));

    // Application des nouvelles données au graphique
    chart.data.labels = newLabels;
    chart.data.datasets = newDatasets;
    chart.update();
}


  ngAfterViewInit(): void {
    setTimeout(() => {
    });
  }

}


