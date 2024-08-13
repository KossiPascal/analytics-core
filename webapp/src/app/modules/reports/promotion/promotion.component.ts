import { Component, HostListener } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { DataValue } from '@kossi-models/dhis2';
import { IndicatorsDataOutput, PromotionReport } from '@kossi-models/reports';
import { ReportsHealth } from '@kossi-models/selectors';
import { ApiService } from '@kossi-services/api.service';
import { AuthService } from '@kossi-services/auth.service';
import { LocalDbDataFetchService } from '@kossi-services/local-db-data-fetch.service';
import { SnackbarService } from '@kossi-services/snackbar.service';
import { UserContextService } from '@kossi-services/user-context.service';
import { monthByArg, toArray } from '@kossi-src/app/utils/functions';

@Component({
  selector: 'promotion',
  templateUrl: './promotion.component.html',
  styleUrl: './promotion.component.css',
})
export class PromotionComponent {

  PROMOTION$!: PromotionReport | undefined;

  screenWidth: number;
  COLUMN_WIDTH: number;
  _formGroup!: FormGroup;


  REPPORTS_HEADER: ReportsHealth = {
    LOGO_TITLE1: undefined,
    LOGO_TITLE2: undefined,
    LOGO_TITLE3: undefined,
    REPPORT_TITLE: 'RAPPORT MENSUEL',
    REPPORT_SUBTITLE: 'ACTIVITÉS PROMOTIONNELLES',
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
    this.api.ValidatePromotionReports(this._formGroup.value).subscribe(async (_c$: { status: number, data: string }) => {
      if (_c$.status == 200) {
        this.SHOW_DATA(this._formGroup);
        this.snackbar.show('Validate successfuly', { backgroundColor: 'success', position: 'TOP' });
      }
      this.REPPORTS_HEADER.ON_VALIDATION = false;
    }, (err: any) => {
      this.REPPORTS_HEADER.ON_VALIDATION = false;
    });
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
    this.ldbfetch.GetPromotionReports(this._formGroup.value).then((_res$: IndicatorsDataOutput<PromotionReport> | undefined) => {
      this.REPPORTS_HEADER.REGION_NAME = _res$?.region.name;
      this.REPPORTS_HEADER.RECO_ASC_TYPE = (_res$ as any)?.reco_asc_type;
      this.REPPORTS_HEADER.RECO_ASC_NAME = ((_res$ as any)?.reco_asc_type === 'RECO' ? (_res$?.reco?.name) : _res$?.chw.name);
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

      this.PROMOTION$ = _res$?.data;
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
    if (this.PROMOTION$) {
      const mth = this._formGroup.value.months;
      const period = {
        year: this._formGroup.value.year,
        month: Array.isArray(mth) ? mth[0] : mth,
      };

      const dataValues = this.dataTransformToDhis2(this.PROMOTION$, period);

      this.api.SendPromotionActivitiesToDhis2({ ...this._formGroup.value, dataValues }).subscribe(async (_c$: { status: number, data: string }) => {
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

  dataTransformToDhis2(data: PromotionReport, dataPeriod?: { year: number, month: string }): { dataValues: DataValue[] } {
    const orgUnit = data.orgUnit ?? 'erdjSX8MtGO';
    const period = dataPeriod ? `${dataPeriod.year}${dataPeriod.month}` : `${data.year}${data.month}`;
    return {
      dataValues: [
        {
          dataElement: 'reLr94WLodi',
          period: period,
          orgUnit: orgUnit,
          categoryOptionCombo: 'mkALVXEOmPV', //Paludisme VAD, Féminin
          value: data.malaria_nbr_touched_by_VAD_F
        },
        {
          dataElement: 'reLr94WLodi',
          period: period,
          orgUnit: orgUnit,
          categoryOptionCombo: 'nNLrVZLxiPp', //Paludisme CE, Féminin
          value: data.malaria_nbr_touched_by_CE_F
        },
        {
          dataElement: 'reLr94WLodi',
          period: period,
          orgUnit: orgUnit,
          categoryOptionCombo: 'TSV3DpdA7w9', //Paludisme Total, Féminin
          value: data.malaria_nbr_total_F
        },
        {
          dataElement: 'reLr94WLodi',
          period: period,
          orgUnit: orgUnit,
          categoryOptionCombo: 'eNSkQa5sZHi', //Paludisme VAD, Masculin
          value: data.malaria_nbr_touched_by_VAD_M
        },
        {
          dataElement: 'reLr94WLodi',
          period: period,
          orgUnit: orgUnit,
          categoryOptionCombo: 'f3r3iJeHc6u', //Paludisme CE, Masculin
          value: data.malaria_nbr_touched_by_CE_M
        },
        {
          dataElement: 'reLr94WLodi',
          period: period,
          orgUnit: orgUnit,
          categoryOptionCombo: 'PzLTFGsCfaD', //Paludisme Total, Masculin
          value: data.malaria_nbr_total_M
        },
        {
          dataElement: 'ZbwvBYb5QIF',
          period: period,
          orgUnit: orgUnit,
          categoryOptionCombo: 'QJ6Zh1w9Ixo', //Vaccination VAD, Féminin
          value: data.vaccination_nbr_touched_by_VAD_F
        },
        {
          dataElement: 'ZbwvBYb5QIF',
          period: period,
          orgUnit: orgUnit,
          categoryOptionCombo: 'FE24CbxVovJ', //Vaccination CE, Féminin
          value: data.vaccination_nbr_touched_by_CE_F
        },
        {
          dataElement: 'ZbwvBYb5QIF',
          period: period,
          orgUnit: orgUnit,
          categoryOptionCombo: 'Lcca81MKeqs', //Vaccination Total, Féminin
          value: data.vaccination_nbr_total_F
        },
        {
          dataElement: 'ZbwvBYb5QIF',
          period: period,
          orgUnit: orgUnit,
          categoryOptionCombo: 'usCbYR0Wy5X', //Vaccination VAD, Masculin
          value: data.vaccination_nbr_touched_by_VAD_M
        },
        {
          dataElement: 'ZbwvBYb5QIF',
          period: period,
          orgUnit: orgUnit,
          categoryOptionCombo: 'I6G9oRI644m', //Vaccination CE, Masculin
          value: data.vaccination_nbr_touched_by_CE_M
        },
        {
          dataElement: 'ZbwvBYb5QIF',
          period: period,
          orgUnit: orgUnit,
          categoryOptionCombo: 'kbqK0cKDJmZ', //Vaccination Total, Masculin
          value: data.vaccination_nbr_total_M
        },
        {
          dataElement: 'HHtuWuObqJi',
          period: period,
          orgUnit: orgUnit,
          categoryOptionCombo: 'n7ULwnhPmAr', //Santé Enfant VAD, Féminin
          value: data.child_health_nbr_touched_by_VAD_F
        },
        {
          dataElement: 'HHtuWuObqJi',
          period: period,
          orgUnit: orgUnit,
          categoryOptionCombo: 'aiwbLdNLhzg', //Santé Enfant CE, Féminin
          value: data.child_health_nbr_touched_by_CE_F
        },
        {
          dataElement: 'HHtuWuObqJi',
          period: period,
          orgUnit: orgUnit,
          categoryOptionCombo: 'pYRwaQnYl5u', //Santé Enfant Total, Féminin
          value: data.child_health_nbr_total_F
        },
        {
          dataElement: 'HHtuWuObqJi',
          period: period,
          orgUnit: orgUnit,
          categoryOptionCombo: 'vW8kmzUHqwp', //Santé Enfant VAD, Masculin
          value: data.child_health_nbr_touched_by_VAD_M
        },
        {
          dataElement: 'HHtuWuObqJi',
          period: period,
          orgUnit: orgUnit,
          categoryOptionCombo: 'AhtXoBVIobA', //Santé Enfant CE, Masculin
          value: data.child_health_nbr_touched_by_CE_M
        },
        {
          dataElement: 'HHtuWuObqJi',
          period: period,
          orgUnit: orgUnit,
          categoryOptionCombo: 'T9gCslKL4Ls', //Santé Enfant Total, Masculin
          value: data.child_health_nbr_total_M
        },
        {
          dataElement: 'ChfBVpGkz5M',
          period: period,
          orgUnit: orgUnit,
          categoryOptionCombo: 'NK69VuTWywA', //CPN/CPoN VAD, Féminin
          value: data.cpn_cpon_nbr_touched_by_VAD_F
        },
        {
          dataElement: 'ChfBVpGkz5M',
          period: period,
          orgUnit: orgUnit,
          categoryOptionCombo: 'liQvAH9VUVE', //CPN/CPoN CE, Féminin
          value: data.cpn_cpon_nbr_touched_by_CE_F
        },
        {
          dataElement: 'ChfBVpGkz5M',
          period: period,
          orgUnit: orgUnit,
          categoryOptionCombo: 'nDEFyvuYzdu', //CPN/CPoN Total, Féminin
          value: data.cpn_cpon_nbr_total_F
        },
        {
          dataElement: 'ChfBVpGkz5M',
          period: period,
          orgUnit: orgUnit,
          categoryOptionCombo: 'tILcB42WBVn', //CPN/CPoN VAD, Masculin
          value: data.cpn_cpon_nbr_touched_by_VAD_M
        },
        {
          dataElement: 'ChfBVpGkz5M',
          period: period,
          orgUnit: orgUnit,
          categoryOptionCombo: 'iHavRI7a5xI', //CPN/CPoN CE, Masculin
          value: data.cpn_cpon_nbr_touched_by_CE_M
        },
        {
          dataElement: 'ChfBVpGkz5M',
          period: period,
          orgUnit: orgUnit,
          categoryOptionCombo: 'GcCVmDklPK3', //CPN/CPoN Total, Masculin
          value: data.cpn_cpon_nbr_total_M
        },
        {
          dataElement: 'OjpoCrL4Tjj',
          period: period,
          orgUnit: orgUnit,
          categoryOptionCombo: 'G8TURgyVL6d', //PF VAD, Féminin
          value: data.family_planning_nbr_touched_by_VAD_F
        },
        {
          dataElement: 'OjpoCrL4Tjj',
          period: period,
          orgUnit: orgUnit,
          categoryOptionCombo: 'vxaeoYOCtoY', //PF CE, Féminin
          value: data.family_planning_nbr_touched_by_CE_F
        },
        {
          dataElement: 'OjpoCrL4Tjj',
          period: period,
          orgUnit: orgUnit,
          categoryOptionCombo: 'ubU9w7O79Lx', //PF Total, Féminin
          value: data.family_planning_nbr_total_F
        },
        {
          dataElement: 'OjpoCrL4Tjj',
          period: period,
          orgUnit: orgUnit,
          categoryOptionCombo: 'Y66GlWSiI1T', //PF VAD, Masculin
          value: data.family_planning_nbr_touched_by_VAD_M
        },
        {
          dataElement: 'OjpoCrL4Tjj',
          period: period,
          orgUnit: orgUnit,
          categoryOptionCombo: 'MxvzA5aZkHC', //PF CE, Masculin
          value: data.family_planning_nbr_touched_by_CE_M
        },
        {
          dataElement: 'OjpoCrL4Tjj',
          period: period,
          orgUnit: orgUnit,
          categoryOptionCombo: 'QDWqiGTesvJ', //PF Total, Masculin
          value: data.family_planning_nbr_total_M
        },
        {
          dataElement: 'KkmPdIa7V2o',
          period: period,
          orgUnit: orgUnit,
          categoryOptionCombo: 'vzMCrPXneax', //Eau Hygienne Assainissement VAD, Féminin
          value: data.hygienic_water_sanitation_nbr_touched_by_VAD_F
        },
        {
          dataElement: 'KkmPdIa7V2o',
          period: period,
          orgUnit: orgUnit,
          categoryOptionCombo: 'oVx6d4kyTEu', //Eau Hygienne Assainissement CE, Féminin
          value: data.hygienic_water_sanitation_nbr_touched_by_CE_F
        },
        {
          dataElement: 'KkmPdIa7V2o',
          period: period,
          orgUnit: orgUnit,
          categoryOptionCombo: 'eaS6K9KtyE1', //Eau Hygienne Assainissement Total, Féminin
          value: data.hygienic_water_sanitation_nbr_total_F
        },
        {
          dataElement: 'KkmPdIa7V2o',
          period: period,
          orgUnit: orgUnit,
          categoryOptionCombo: 'OOe0cGjJYsh', //Eau Hygienne Assainissement VAD, Masculin
          value: data.hygienic_water_sanitation_nbr_touched_by_VAD_M
        },
        {
          dataElement: 'KkmPdIa7V2o',
          period: period,
          orgUnit: orgUnit,
          categoryOptionCombo: 'DKS0Gy0wi9k', //Eau Hygienne Assainissement CE, Masculin
          value: data.hygienic_water_sanitation_nbr_touched_by_CE_M
        },
        {
          dataElement: 'KkmPdIa7V2o',
          period: period,
          orgUnit: orgUnit,
          categoryOptionCombo: 'B10GhHIJiz0', //Eau Hygienne Assainissement Total, Masculin
          value: data.hygienic_water_sanitation_nbr_total_M
        },
        {
          dataElement: 'OTn9Yv0V4Hf',
          period: period,
          orgUnit: orgUnit,
          categoryOptionCombo: 'NoM9m3ccl8q', //Autres Maladies VAD, Féminin
          value: data.other_diseases_nbr_touched_by_VAD_F
        },
        {
          dataElement: 'OTn9Yv0V4Hf',
          period: period,
          orgUnit: orgUnit,
          categoryOptionCombo: 'dGYCxhCzseB', //Autres Maladies CE, Féminin
          value: data.other_diseases_nbr_touched_by_CE_F
        },
        {
          dataElement: 'OTn9Yv0V4Hf',
          period: period,
          orgUnit: orgUnit,
          categoryOptionCombo: 'PqerZpQPbap', //Autres Maladies Total, Féminin
          value: data.other_diseases_nbr_total_F
        },
        {
          dataElement: 'OTn9Yv0V4Hf',
          period: period,
          orgUnit: orgUnit,
          categoryOptionCombo: 'IGv6dWZUJPp', //Autres Maladies VAD, Masculin
          value: data.other_diseases_nbr_touched_by_VAD_M
        },
        {
          dataElement: 'OTn9Yv0V4Hf',
          period: period,
          orgUnit: orgUnit,
          categoryOptionCombo: 'Uotr3YNyRpr', //Autres Maladies CE, Masculin
          value: data.other_diseases_nbr_touched_by_CE_M
        },
        {
          dataElement: 'OTn9Yv0V4Hf',
          period: period,
          orgUnit: orgUnit,
          categoryOptionCombo: 'OGAnbwef45x', //Autres Maladies Total, Masculin
          value: data.other_diseases_nbr_total_M
        }
      ]
    };
  }

}

