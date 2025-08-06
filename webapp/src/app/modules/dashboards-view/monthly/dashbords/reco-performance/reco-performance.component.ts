import { Component } from '@angular/core';
import { RecoPerformanceDashboard } from '@kossi-models/dashboards';
import { ConnectivityService } from '@kossi-services/connectivity.service';
import { LocalDbDataFetchService } from '@kossi-services/local-db-data-fetch.service';
import { SnackbarService } from '@kossi-services/snackbar.service';
import { from } from 'rxjs';
import { FormGroupService } from '@kossi-services/form-group.service';
import { UserContextService } from '@kossi-services/user-context.service';

import { Chart, ChartTypeRegistry, registerables } from "chart.js";
import { ChartDataSet, ChartOptions } from '@kossi-models/interfaces';
import { BaseDashboardsComponent } from '../../../base-dashboards.component';


@Component({
  standalone: false,
  selector: 'reco-performance-dashboard',
  templateUrl: './reco-performance.component.html',
  styleUrl: './reco-performance.component.css'
})

export class RecoPerformanceDashboardComponent extends BaseDashboardsComponent<RecoPerformanceDashboard> {

  override DASHBOARD_NAME = 'RECOS_PERFORMANCES';

  modal: HTMLElement | null = null;
  openBtn: HTMLElement | null = null;
  closeBtn: HTMLElement | null = null;

  constructor(private ldbfetch: LocalDbDataFetchService, fGroup: FormGroupService, conn: ConnectivityService, snackbar: SnackbarService, userCtx: UserContextService) {
    super(
      fGroup,
      conn,
      snackbar,
      userCtx,
      (formData, isOnline) => from(this.ldbfetch.GetRecoPerformanceDashboard(formData, isOnline)),
    );

    Chart.register(...registerables);
  }

  showModal() {
  }

  closeModal() {
    if (this.modal) {
      this.modal.style.display = 'none';
    }
  }

  get DATA_FETCHED() {
    return ((this.DASHBOARDS_DATA as any)[this.DASHBOARD_NAME]?.data ?? []) as RecoPerformanceDashboard;
  }


  LINE_TITLE: string = '';

  startGenerateRecoChart(recoId: string, recoName: string) {
    if (!this.modal) {
      this.modal = document.getElementById('customModal');
      window.onclick = (event) => {
        if (this.modal && event.target === this.modal) this.modal.style.display = 'none';
      }
    }

    if (this.modal) {
      this.modal.style.display = 'block';

      const dtL = this.DATA_FETCHED.yearDatas?.[recoId];
      this.LINE_TITLE = dtL.title;
      setTimeout(() => {
        this.closeBtn = document.querySelector('.close-btn');
        this.generateChart({ cibleId: 'line-chart', title: recoName, type: 'line', absisseLabels: dtL.absisseLabels, datasets: dtL.datasets });
      })
    }
  }


  generateChart({ cibleId, title, type, absisseLabels, datasets }: ChartOptions): void {
    const canvasElement: any = document.getElementById(cibleId) as HTMLCanvasElement | null;
    const selectElement: any = document.getElementById(`${cibleId}-select`) as HTMLCanvasElement | null;


    if (!canvasElement) return;
    if (canvasElement.chart) canvasElement.chart.destroy();

    const ctx = canvasElement.getContext("2d");
    if (!ctx || !(datasets.length > 0)) return;

    // Global chart default settings
    Chart.defaults.color = "#6C7293";
    Chart.defaults.borderColor = "#000000";


    // Transforming datasets to the correct format
    const datasetsList: ChartDataSet[] = datasets.map(dataset => ({
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
      selectElement.addEventListener("change", () => this.updateChartVisibility({ cibleId, title, type, absisseLabels, datasets }));

    }

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
            text: title,  // Customize the chart title
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

    const selectedIndices = Array.from(selectElement.selectedOptions).map((option: any) => Number(option.value));

    // Mise à jour des labels sélectionnés
    const newLabels = selectedIndices.map(index => absisseLabels![index] as string);


    const datasetsList: ChartDataSet[] = datasets.map(dataset => ({
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

}


