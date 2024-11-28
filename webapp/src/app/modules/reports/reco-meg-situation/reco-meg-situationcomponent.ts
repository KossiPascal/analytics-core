import { Component, HostListener } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { DataValue } from '@kossi-models/dhis2';
import { IndicatorsDataOutput, RecoMegQuantityUtils, RecoMegSituationReport } from '@kossi-models/reports';
import { ReportsHealth } from '@kossi-models/selectors';
import { ApiService } from '@kossi-services/api.service';
import { AuthService } from '@kossi-services/auth.service';
import { LocalDbDataFetchService } from '@kossi-services/local-db-data-fetch.service';
import { SnackbarService } from '@kossi-services/snackbar.service';
import { UserContextService } from '@kossi-services/user-context.service';
import { monthByArg, toArray } from '@kossi-src/app/utils/functions';

@Component({
  selector: 'reco-meg-situation',
  templateUrl: `./reco-meg-situation.component.html`,
  styleUrls: [
    './reco-meg-situation.component.css'
  ]
})
export class RecoMegSituationComponent {
  RECO_MEG_QUANTITIES$!:RecoMegQuantityUtils[] | undefined;
  RECO_MEG_SITUATION$!:RecoMegSituationReport | undefined;


  screenWidth: number;
  COLUMN_WIDTH: number;
  _formGroup!: FormGroup;


  REPPORTS_HEADER: ReportsHealth = {
    LOGO_TITLE1: undefined,
    LOGO_TITLE2: undefined,
    LOGO_TITLE3: undefined,
    REPPORT_TITLE: undefined,
    REPPORT_SUBTITLE: 'SITUATION MEG / INTRANTS DES RECOs',
    HEALTH_CENTER_NAME: undefined,
    RECO_ASC_PHONE: undefined,
  };

  constructor(private api: ApiService, private ldbfetch: LocalDbDataFetchService, private userCtx: UserContextService, private auth: AuthService, private snackbar: SnackbarService) {
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

  convertQty(v: any) {
    return v == 0 || v == '' || v == null || v == '0' || v == undefined ? undefined : v;
  }

  EcartColor(data: RecoMegQuantityUtils): { value: string, ecart: string, color: string } {
    const inventory = this.convertQty(data.month_inventory) ?? 0;
    const theoretical = this.convertQty(data.month_theoreticaly) ?? 0;
    if (inventory != 0 && theoretical != 0) {
      const diff = inventory - theoretical;
      const ec = (diff / theoretical) * 100;
      const ecart = ec < 0 ? -1 * ec : ec; // const ecart = Math.round((ec < 0 ? -1 * ec : ec) * 10) / 10;
      const sEcart = ecart > 100 ? '> 100%' : `${ecart.toFixed(0)}%`
      return { value: `${diff}`, ecart: sEcart, color: ecart > 5 ? 'red' : 'green' };
    }
    return { value: '-', ecart: '-', color: '' };
  }

  validateData() {
    this.REPPORTS_HEADER.ON_VALIDATION = true;
    this.api.ValidateRecoMegSituationReports(this._formGroup.value).subscribe(async (_c$: { status: number, data: string }) => {
      if (_c$.status == 200) {
        this.SHOW_DATA(this._formGroup);
        this.snackbar.show('Validate successfuly', { backgroundColor: 'success', position: 'TOP' });
      }
      this.REPPORTS_HEADER.ON_VALIDATION = false;
    }, (err: any) => {
      this.REPPORTS_HEADER.ON_VALIDATION = false;
    });
  }

  cancelValidation(){

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

    this.REPPORTS_HEADER.ON_FETCHING = true;
    this._formGroup.value.months = toArray(this._formGroup.value.months);
    this.ldbfetch.GetRecoMegSituationReports(this._formGroup.value).then((_res$: IndicatorsDataOutput<RecoMegQuantityUtils[]> | undefined) => {
      this.REPPORTS_HEADER.REGION_NAME = _res$?.region.name;
      this.REPPORTS_HEADER.RECO_ASC_TYPE = (_res$ as any)?.reco_asc_type;
      this.REPPORTS_HEADER.RECO_ASC_NAME = ((_res$ as any)?.reco_asc_type === 'RECO' ? (_res$?.reco?.name) : '');//_res$?.chw.name);
      this.REPPORTS_HEADER.PREFECTURE_NAME = _res$?.prefecture.name;
      this.REPPORTS_HEADER.COMMUNE_NAME = _res$?.commune.name;
      this.REPPORTS_HEADER.VILLAGE_SECTEUR_NAME = _res$?.village_secteur.name;
      // this.REPPORTS_HEADER.VILLAGE_CHIEF_NAME = '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';
      // this.REPPORTS_HEADER.VILLAGE_CHIEF_CONTACT = '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';
      this.REPPORTS_HEADER.MONTH = toArray(this._formGroup.value.months).map(m => monthByArg(m).labelFR).join(',');
      this.REPPORTS_HEADER.YEAR = this._formGroup.value.year;

      this.REPPORTS_HEADER.CAN_VISIBLE = (_res$?.data && this._formGroup.value.recos.length > 0) === true;
      this.REPPORTS_HEADER.IS_VALIDATED = _res$?.is_validate === true;
      this.REPPORTS_HEADER.IS_ALREADY_ON_DHIS2 = _res$?.already_on_dhis2 === true;

      this.RECO_MEG_QUANTITIES$ = _res$?.data;
      // this.RECO_MEG_SITUATION$ = _res$?.data;

      if (!_res$) {
        this.snackbar.show('No data found for this RECO with informations you provide!\nYou can sync data from cloud and retry!', { backgroundColor: 'info', position: 'TOP', duration: 5000 });
      }
      this.REPPORTS_HEADER.ON_FETCHING = false;
    }, (err: any) => {
      this.REPPORTS_HEADER.ON_FETCHING = false;
    });
  }

  sendDataToDhis2() {
    this.REPPORTS_HEADER.ON_DHIS2_SENDING = true;
    if (this.RECO_MEG_SITUATION$) {
      const mth = this._formGroup.value.months;
      const period = {
        year: this._formGroup.value.year,
        month: Array.isArray(mth) ? mth[0] : mth,
      };

      const dataValues = this.dataTransformToDhis2(this.RECO_MEG_SITUATION$, period);

      this.api.SendRecoMegSituationActivitiesToDhis2({ ...this._formGroup.value, dataValues }).subscribe(async (_c$: { status: number, data: string }) => {
        if (_c$.status == 200) {
          this.SHOW_DATA(this._formGroup);
          this.snackbar.show('Send to DHIS2 successfuly', { backgroundColor: 'success', position: 'TOP' });
          // this.openDhis2Modal(false);
        } else {
          this.snackbar.show('Error when sending data, retry!', { backgroundColor: 'warning', position: 'TOP' });
        }
        this.REPPORTS_HEADER.ON_DHIS2_SENDING = false;
      }, (err: any) => {
        this.snackbar.show('Error when sending data, retry!', { backgroundColor: 'warning', position: 'TOP' });
        this.REPPORTS_HEADER.ON_DHIS2_SENDING = false;
      });
    } else {
      this.snackbar.show('Invalid Data', { backgroundColor: 'warning', position: 'TOP' });
    }
  }

  dataTransformToDhis2(data: RecoMegSituationReport, dataPeriod?: { year: number, month: string }): { dataValues: DataValue[] } {
    const orgUnit = data?.orgUnit ?? 'erdjSX8MtGO';
    const period = dataPeriod ? `${dataPeriod.year}${dataPeriod.month}` : `${data?.year}${data?.month}`;
    return {
      dataValues: [
        {
          dataElement: 'reLr94WLodi',
          period: period,
          orgUnit: orgUnit,
          categoryOptionCombo: 'mkALVXEOmPV',
          value: 0
        }
      ]
    };
  }
}
