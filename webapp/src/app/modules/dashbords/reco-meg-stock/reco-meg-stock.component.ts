import { Component, HostListener } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { RecoMegDashboardUtils } from '@kossi-models/dashboards';
import { IndicatorsDataOutput } from '@kossi-models/reports';
import { LocalDbDataFetchService } from '@kossi-services/local-db-data-fetch.service';
import { SnackbarService } from '@kossi-services/snackbar.service';
import { toArray, monthByArg } from '@kossi-src/app/utils/functions';

@Component({
  selector: 'reco-meg-stock',
  templateUrl: './reco-meg-stock.component.html',
  styleUrl: './reco-meg-stock.component.css'
})

export class RecoMegDashboardComponent {
  RECO_MEG$!: RecoMegDashboardUtils[] | undefined;

  MONTH!: string;
  YEAR!: number;
  ON_FETCHING: boolean = false;

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

  quantityStyle(data:number) {
    if (data < 0) return 'quantity-error'
    return data > 0 ? 'quantity-up' : 'quantity-down';
  }

  SHOW_DATA(updatedFormGroup: any) {
    this._formGroup = updatedFormGroup;
    if (!(this._formGroup.value.recos.length > 0)) {
      this.snackbar.show('You don\'t provide recos, please select reco!', { backgroundColor: 'warning', position: 'TOP' });
      return;
    }
    if (!(toArray(this._formGroup.value.months).length > 0)) {
      this.snackbar.show('You don\'t provide month, please select month!', { backgroundColor: 'warning', position: 'TOP' });
      return;
    }

    if (!(this._formGroup.value.year > 0)) {
      this.snackbar.show('You don\'t provide year, please select year!', { backgroundColor: 'warning', position: 'TOP' });
      return;
    }

    this.ON_FETCHING = true;
    this._formGroup.value.months = toArray(this._formGroup.value.months);
    this.ldbfetch.GetRecoMegDashboard(this._formGroup.value).then((_res$: IndicatorsDataOutput<RecoMegDashboardUtils[]> | undefined) => {
      this.RECO_MEG$ = _res$?.data;
      this.MONTH = monthByArg(this._formGroup.value.month).labelFR;
      this.YEAR = this._formGroup.value.year;
      if (!_res$) {
        this.snackbar.show('No data found for this RECO with informations you provide!\nYou can sync data from cloud and retry!', { backgroundColor: 'info', position: 'TOP', duration: 5000 });
      }
      this.ON_FETCHING = false;
    }, (err: any) => {
      this.ON_FETCHING = false;
    });
  }

}
