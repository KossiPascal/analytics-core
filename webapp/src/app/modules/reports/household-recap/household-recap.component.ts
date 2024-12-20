import { Component, HostListener } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Dhis2DataValueSetParams } from '@kossi-models/dhis2';
import { HouseholdRecapReport, IndicatorsDataOutput } from '@kossi-models/reports';
import { ReportsHealth } from '@kossi-models/selectors';
import { ApiService } from '@kossi-services/api.service';
import { AuthService } from '@kossi-services/auth.service';
import { ConnectivityService } from '@kossi-services/connectivity.service';
import { DbSyncService } from '@kossi-services/db-sync.service';
import { LocalDbDataFetchService } from '@kossi-services/local-db-data-fetch.service';
import { SnackbarService } from '@kossi-services/snackbar.service';
import { UserContextService } from '@kossi-services/user-context.service';
import { monthByArg, toArray } from '@kossi-src/app/utils/functions';
@Component({
  selector: 'chws-reco',
  templateUrl: './household-recap.component.html',
  styleUrl: './household-recap.component.css',
})
export class HouseholdRecapComponent {

  HOUSE_HOLD_RECAP$!: HouseholdRecapReport[] | undefined;
  HOUSE_HOLD_RECAP_TOTAL$!: HouseholdRecapReport | undefined;

  ALL_NEEDED_RECOS:string[] = [];
  SELECTED_RECOS!:string[];

  isOnline:boolean;
  screenWidth: number;
  COLUMN_WIDTH: number;
  _formGroup!: FormGroup;
  _dhis2FormGroup!: FormGroup;


  REPPORTS_HEADER: ReportsHealth = {
    LOGO_TITLE1: undefined,
    LOGO_TITLE2: undefined,
    LOGO_TITLE3: undefined,
    REPPORT_TITLE: 'TABLEAU RECAPITULATIF DES MENAGES',
    REPPORT_SUBTITLE: undefined,
    HEALTH_CENTER_NAME: undefined,
    RECO_ASC_PHONE: undefined,
  };

  ORG_UNIT_TO_SEND_DATA!:{ id: string, external_id: string, name: string }

  constructor(private api: ApiService, private db: DbSyncService, private conn: ConnectivityService, private ldbfetch: LocalDbDataFetchService, private userCtx: UserContextService, private auth: AuthService, private snackbar: SnackbarService) {
    this.screenWidth = window.innerWidth;
    this.COLUMN_WIDTH = (window.innerWidth - 600) / 4;
    this.isOnline = window.navigator.onLine;
    this.conn.getOnlineStatus().subscribe(isOnline => this.isOnline = isOnline);
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.screenWidth = window.innerWidth;
  }

  validateData() {
    this.REPPORTS_HEADER.ON_VALIDATION = true;
    const dataIds = this.HOUSE_HOLD_RECAP$?.map(h => h.id) ?? [];
    this.api.ValidateHouseholdRecapReports({ ...this._formGroup.value, dataIds }).subscribe(async (_c$: { status: number, data: string }) => {
      if (_c$.status == 200) {
        this.SHOW_DATA(this._formGroup);
        this.snackbar.show('Validate successfuly', { backgroundColor: 'success', position: 'TOP' });
        this.REPPORTS_HEADER.ON_VALIDATION = false;
        
        if(this.userCtx.currentUserCtx?.can_use_offline_mode === true && this.isOnline) {
          await this.db.all(this._formGroup.value).then(res =>{});
        }
      }
      this.REPPORTS_HEADER.ON_VALIDATION = false;
    }, (err: any) => {
      this.REPPORTS_HEADER.ON_VALIDATION = false;
    });
  }

  cancelValidation(){
    this.REPPORTS_HEADER.ON_CANCEL_VALIDATION = true;
    this.api.CancelValidateHouseholdRecapReports(this._formGroup.value).subscribe(async (_c$: { status: number, data: string }) => {
      if (_c$.status == 200) {
        this.SHOW_DATA(this._formGroup);
        this.snackbar.show('Validation annulée avec succès', { backgroundColor: 'success', position: 'TOP' });
        this.REPPORTS_HEADER.ON_CANCEL_VALIDATION = false;

        if(this.userCtx.currentUserCtx?.can_use_offline_mode === true && this.isOnline) {
          await this.db.all(this._formGroup.value).then(res =>{});
        }
      }
      this.REPPORTS_HEADER.ON_CANCEL_VALIDATION = false;
    }, (err: any) => {
      this.REPPORTS_HEADER.ON_CANCEL_VALIDATION = false;
    });
  }

  SHOW_DATA(updatedFormGroup: FormGroup) {
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
    const orgUnit = this._formGroup.value.org_units.hospital

    this.ORG_UNIT_TO_SEND_DATA = {
      id:orgUnit.id,
      external_id:orgUnit.external_id,
      name:orgUnit.name
    }

    this.ALL_NEEDED_RECOS = this._formGroup.value.all_recos_ids;
    this.SELECTED_RECOS = this._formGroup.value.selected_recos_ids;

    this.REPPORTS_HEADER.ON_FETCHING = true;
    this._formGroup.value.months = toArray(this._formGroup.value.months);

    this.ldbfetch.GetHouseholdRecapReports(this._formGroup.value, this.isOnline).then((_res$: { total: HouseholdRecapReport, out: IndicatorsDataOutput<HouseholdRecapReport[]> } | undefined) => {
      this.REPPORTS_HEADER.REGION_NAME = _res$?.out.region.name;
      this.REPPORTS_HEADER.RECO_ASC_TYPE = _res$?.out.reco_asc_type;
      this.REPPORTS_HEADER.RECO_ASC_NAME = (_res$?.out.reco_asc_type === 'RECO' ? (_res$?.out.reco?.name) : ''); //_res$?.out.chw.name);
      this.REPPORTS_HEADER.PREFECTURE_NAME = _res$?.out.prefecture.name;
      this.REPPORTS_HEADER.COMMUNE_NAME = _res$?.out.commune.name;
      this.REPPORTS_HEADER.DISTRICT_QUARTIER_NAME = _res$?.out.district_quartier.name;
      this.REPPORTS_HEADER.VILLAGE_SECTEUR_NAME = _res$?.out.village_secteur.name;
      this.REPPORTS_HEADER.MONTH = monthByArg(this._formGroup.value.month).labelFR;
      this.REPPORTS_HEADER.YEAR = this._formGroup.value.year;

      this.REPPORTS_HEADER.CAN_VISIBLE = (_res$?.out.data && this._formGroup.value.recos.length > 0) === true;
      this.REPPORTS_HEADER.IS_VALIDATED = _res$?.out.is_validate === true;
      this.REPPORTS_HEADER.IS_ALREADY_ON_DHIS2 = _res$?.out.already_on_dhis2 === true;

      this.HOUSE_HOLD_RECAP$ = _res$?.out.data;
      this.HOUSE_HOLD_RECAP_TOTAL$ = _res$?.total;
      if (!_res$) {
        this.snackbar.show('Aucune données disponible pour ces paramettres. Veuillez reessayer!', { backgroundColor: 'info', position: 'TOP', duration: 5000 });
      }
      this.REPPORTS_HEADER.ON_FETCHING = false;
    }, (err: any) => {
      this.REPPORTS_HEADER.ON_FETCHING = false;
    });
  }


  sendDataToDhis2(dhis2FormGroup: FormGroup) {

    this.REPPORTS_HEADER.SHOW_DHIS2_MODAL = true;
    this.REPPORTS_HEADER.ON_DHIS2_SENDING = true;
    this.REPPORTS_HEADER.ON_DHIS2_SENDING_ERROR = false;

    if (this.HOUSE_HOLD_RECAP$ && dhis2FormGroup) {
      const mth = this._formGroup.value.months;
      const period = {
        year: this._formGroup.value.year,
        month: Array.isArray(mth) ? mth[0] : mth,
      };

      const orgunit_uid = dhis2FormGroup.value.dhis2_orgunit_uid;
      const orgunit_name = dhis2FormGroup.value.dhis2_orgunit_name;

      this.HOUSE_HOLD_RECAP$[0].orgunit = orgunit_uid;

      const dhis2Params:Dhis2DataValueSetParams = {
        months:this._formGroup.value.months,
        year:this._formGroup.value.year,
        recos:this._formGroup.value.recos,
        username: dhis2FormGroup.value.dhis2_username,
        password: dhis2FormGroup.value.dhis2_password,
        data: this.HOUSE_HOLD_RECAP$[0],
        period: period,
      }

        this.snackbar.show(`Envoi des données du au DHIS2 sur ${orgunit_name}`, { backgroundColor: 'success', position: 'TOP', duration:10000 });

        this.api.SendHouseholdActivitiesToDhis2(dhis2Params).subscribe(async (_c$: { status: number, data: string }) => {
          if (_c$.status == 200) {
            this.REPPORTS_HEADER.SHOW_DHIS2_MODAL = false;
            this.REPPORTS_HEADER.ON_DHIS2_SENDING_ERROR = false;
            this.SHOW_DATA(this._formGroup);
            this.snackbar.show('Données envoyées avec succès au DHIS2', { backgroundColor: 'success', position: 'TOP' });

          } else {
            // this.snackbar.show('Error when sending data, retry!', { backgroundColor: 'warning', position: 'TOP' });
            this.REPPORTS_HEADER.DHIS2_SENDING_ERROR_MESSAGE = _c$.data;
            this.REPPORTS_HEADER.ON_DHIS2_SENDING_ERROR = true;
          }
          this.REPPORTS_HEADER.ON_DHIS2_SENDING = false;
        }, (err: any) => {
          // this.snackbar.show('Error when sending data, retry!', { backgroundColor: 'warning', position: 'TOP' });
          this.REPPORTS_HEADER.DHIS2_SENDING_ERROR_MESSAGE = err.message??'ERROR: Erreur lors de l\'envoi des données au serveur DHIS2';
          this.REPPORTS_HEADER.ON_DHIS2_SENDING_ERROR = true;
          this.REPPORTS_HEADER.ON_DHIS2_SENDING = false;
        });
    } else {
      // this.snackbar.show('Invalid Data', { backgroundColor: 'warning', position: 'TOP' });
      this.REPPORTS_HEADER.DHIS2_SENDING_ERROR_MESSAGE = 'Les données à envoyer sont vides ou introuvable';
      this.REPPORTS_HEADER.ON_DHIS2_SENDING_ERROR = true;
      this.REPPORTS_HEADER.ON_DHIS2_SENDING = false;
    }
  }

}

