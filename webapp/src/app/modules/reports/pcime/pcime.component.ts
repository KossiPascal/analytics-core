import { Component, HostListener } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { DataValue } from '@kossi-models/dhis2';
import { PcimneNewbornReport } from '@kossi-models/reports';
import { ReportsHealth } from '@kossi-models/selectors';
import { ApiService } from '@kossi-services/api.service';
import { AuthService } from '@kossi-services/auth.service';
import { LocalDbDataFetchService } from '@kossi-services/local-db-data-fetch.service';
import { SnackbarService } from '@kossi-services/snackbar.service';
import { UserContextService } from '@kossi-services/user-context.service';
import { monthByArg, toArray } from '@kossi-src/app/utils/functions';

@Component({
  selector: 'pcime',
  templateUrl: './pcime.component.html',
  styleUrl: './pcime.component.css',
})
export class PcimeComponent {

  PCIMNE_NEWBORN$!: PcimneNewbornReport | undefined;

  screenWidth: number;
  COLUMN_WIDTH: number;
  _formGroup!: FormGroup;
  _dhis2FormGroup!: FormGroup;


  REPPORTS_HEADER: ReportsHealth = {
    LOGO_TITLE1: undefined,
    LOGO_TITLE2: undefined,
    LOGO_TITLE3: undefined,
    REPPORT_TITLE: 'RAPPORT MENSUEL DE PCIMNE',
    REPPORT_SUBTITLE: undefined,
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

  validateData() {
    this.REPPORTS_HEADER.ON_VALIDATION = true;
    this.api.ValidatePcimneNewbornReports(this._formGroup.value).subscribe(async (_c$: { status: number, data: string }) => {
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
    this.ldbfetch.GetPcimneNewbornReports(this._formGroup.value).then((_res$: PcimneNewbornReport | undefined) => {
      this.REPPORTS_HEADER.REGION_NAME = _res$?.region.name;
      this.REPPORTS_HEADER.RECO_ASC_TYPE = (_res$ as any)?.reco_asc_type;
      this.REPPORTS_HEADER.RECO_ASC_NAME = ((_res$ as any)?.reco_asc_type === 'RECO' ? (_res$?.reco?.name) : ''); //_res$?.chw.name);
      this.REPPORTS_HEADER.PREFECTURE_NAME = _res$?.prefecture.name;
      this.REPPORTS_HEADER.COMMUNE_NAME = _res$?.commune.name;
      this.REPPORTS_HEADER.VILLAGE_SECTEUR_NAME = _res$?.village_secteur.name;
      // this.REPPORTS_HEADER.VILLAGE_CHIEF_NAME = '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';
      // this.REPPORTS_HEADER.VILLAGE_CHIEF_CONTACT = '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';
      this.REPPORTS_HEADER.MONTH = toArray(this._formGroup.value.months).map(m => monthByArg(m).labelFR).join(',');
      this.REPPORTS_HEADER.YEAR = this._formGroup.value.year;

      this.REPPORTS_HEADER.CAN_VISIBLE = (_res$ && this._formGroup.value.recos.length > 0) === true;
      this.REPPORTS_HEADER.IS_VALIDATED = _res$?.is_validate === true;
      this.REPPORTS_HEADER.IS_ALREADY_ON_DHIS2 = _res$?.already_on_dhis2 === true;

      this.PCIMNE_NEWBORN$ = _res$;
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
    if (this.PCIMNE_NEWBORN$) {
      const mth = this._formGroup.value.months;
      const period = {
        year: this._formGroup.value.year,
        month: Array.isArray(mth) ? mth[0] : mth,
      };

      const dataValues = this.dataTransformToDhis2(this.PCIMNE_NEWBORN$, period);

      // this.api.SendPcimneNewbornActivitiesToDhis2({...this._formGroup.value, dataValues}).subscribe(async (_c$: { status: number, data: string }) => {
      //   if (_c$.status == 200) {
      //     this.SHOW_DATA(this._formGroup);
      //     this.snackbar.show('Send to DHIS2 successfuly', { backgroundColor: 'success', position: 'TOP' });
      //     // this.openDhis2Modal(false);
      //   } else {
      //     this.snackbar.show('Error when sending data, retry!', { backgroundColor: 'warning', position: 'TOP' });
      //   }
      //   this.REPPORTS_HEADER.ON_DHIS2_SENDING = false;
      // }, (err: any) => {
      //   this.snackbar.show('Error when sending data, retry!', { backgroundColor: 'warning', position: 'TOP' });
      //   this.REPPORTS_HEADER.ON_DHIS2_SENDING = false;
      // });
    } else {
      this.snackbar.show('Invalid Data', { backgroundColor: 'warning', position: 'TOP' });
    }
  }

  dataTransformToDhis2(data: PcimneNewbornReport, dataPeriod?: { year: number, month: string }): { dataValues: DataValue[] } {
    const orgUnit = data.orgUnit ?? 'erdjSX8MtGO';
    const period = dataPeriod ? `${dataPeriod.year}${dataPeriod.month}` : `${data.year}${data.month}`;
    return {
      dataValues: [
        {
          dataElement: 'reLr94WLodi',
          period: period,
          orgUnit: orgUnit,
          categoryOptionCombo: 'mkALVXEOmPV', //Paludisme VAD, Féminin
          value: 0
        },
      ]
    };
  }


  shawDarkMode(data: number[], element: number): 'grey-back' | '' {
    return data.includes(element) ? 'grey-back' : '';
  }

}
