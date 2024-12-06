import { Component, HostListener } from '@angular/core';
import { FormGroup} from '@angular/forms';
import { RecoVaccinationDashboard } from '@kossi-models/dashboards';
import { IndicatorsDataOutput } from '@kossi-models/reports';
import { LocalDbDataFetchService } from '@kossi-services/local-db-data-fetch.service';
import { SnackbarService } from '@kossi-services/snackbar.service';
import { toArray, monthByArg } from '@kossi-src/app/utils/functions';

@Component({
  selector: 'reco-vaccination',
  templateUrl: './reco-vaccination.component.html',
  styleUrl: './reco-vaccination.component.css'
})

export class RecoVaccinationDashboardComponent {

  RECO_VACCINES$: RecoVaccinationDashboard[]|undefined;

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

  vaccineUtils(arg0: boolean,arg1: number,arg2: number): {class:'vaccine-on'|'vaccine-off'|'vaccine-NA', action:'&#10003;'|'&times;'|'NA'} {
    if (arg1 >= arg2) {
      return {class:arg0 === true ? 'vaccine-on' : 'vaccine-off', action:arg0 === true ? '&#10003;' : '&times;'};
    }
    return {class:'vaccine-NA', action:'NA'};
  }

  quantityStyle(data:number) {
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
    this.ldbfetch.GetRecoVaccinationDashboard(this._formGroup.value).then((_res$: IndicatorsDataOutput<RecoVaccinationDashboard[]> | undefined) => {
      this.RECO_VACCINES$ = _res$?.data;

      this.MONTH = monthByArg(this._formGroup.value.month).labelFR;
      this.YEAR = this._formGroup.value.year;
      if (!_res$) {
        this.snackbar.show('Aucune données disponible pour ces paramettres. Veuillez reessayer!', { backgroundColor: 'info', position: 'TOP', duration: 5000 });
      }
      this.ON_FETCHING = false;
    }, (err: any) => {
      this.ON_FETCHING = false;
    });
  }

}
