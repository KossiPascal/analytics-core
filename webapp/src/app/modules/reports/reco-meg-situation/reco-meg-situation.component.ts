import { Component, HostListener } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Dhis2DataValueSetParams } from '@kossi-models/dhis2';
import { IndicatorsDataOutput, RecoMegQuantityUtils, RecoMegSituationReport } from '@kossi-models/reports';
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
  selector: 'reco-meg-situation',
  templateUrl: `./reco-meg-situation.component.html`,
  styleUrls: [
    './reco-meg-situation.component.css'
  ]
})
export class RecoMegSituationComponent {
  RECO_MEG_QUANTITIES$!:RecoMegQuantityUtils[] | undefined;
  RECO_MEG_SITUATION$!:RecoMegSituationReport | undefined;

  ALL_NEEDED_RECOS:string[] = [];
  SELECTED_RECOS!:string[];

  isOnline:boolean;
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

  ORG_UNIT_TO_SEND_DATA!: { id: string, external_id: string, name: string }


  constructor(private api: ApiService, private db: DbSyncService, private conn: ConnectivityService,private ldbfetch: LocalDbDataFetchService, private userCtx: UserContextService, private auth: AuthService, private snackbar: SnackbarService) {
    this.screenWidth = window.innerWidth;
    this.COLUMN_WIDTH = (window.innerWidth - 600) / 4;
    this.isOnline = window.navigator.onLine;
    this.conn.getOnlineStatus().subscribe(isOnline => this.isOnline = isOnline);
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
        if(this.userCtx.currentUserCtx?.can_use_offline_mode === true && this.isOnline) {
          await this.db.all(this._formGroup.value).then(res =>{});
        }
        this.SHOW_DATA(this._formGroup);
        this.snackbar.show('Validate successfuly', { backgroundColor: 'success', position: 'TOP' });
      }
      this.REPPORTS_HEADER.ON_VALIDATION = false;
    }, (err: any) => {
      this.REPPORTS_HEADER.ON_VALIDATION = false;
    });
  }

  cancelValidation(){
    this.REPPORTS_HEADER.ON_CANCEL_VALIDATION = true;
    this.api.CancelValidateRecoMegSituationReports(this._formGroup.value).subscribe(async (_c$: { status: number, data: string }) => {
      if (_c$.status == 200) {
        if(this.userCtx.currentUserCtx?.can_use_offline_mode === true && this.isOnline) {
          await this.db.all(this._formGroup.value).then(res =>{});
        }
        this.SHOW_DATA(this._formGroup);
        this.snackbar.show('Validation annulée avec succès', { backgroundColor: 'success', position: 'TOP' });
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

    if (this.RECO_MEG_SITUATION$ && dhis2FormGroup) {
      const mth = this._formGroup.value.months;
      const period = {
        year: this._formGroup.value.year,
        month: Array.isArray(mth) ? mth[0] : mth,
      };

      const orgunit_uid = dhis2FormGroup.value.dhis2_orgunit_uid;
      const orgunit_name = dhis2FormGroup.value.dhis2_orgunit_name;

      this.RECO_MEG_SITUATION$.orgunit = orgunit_uid;

      const dhis2Params:Dhis2DataValueSetParams = {
        months:this._formGroup.value.months,
        year:this._formGroup.value.year,
        recos:this._formGroup.value.recos,
        username: dhis2FormGroup.value.dhis2_username,
        password: dhis2FormGroup.value.dhis2_password,
        data: this.RECO_MEG_SITUATION$,
        period: period,
      }

        this.snackbar.show(`Envoi des données du au DHIS2 sur ${orgunit_name}`, { backgroundColor: 'success', position: 'TOP', duration:10000 });

        this.api.SendRecoMegSituationActivitiesToDhis2(dhis2Params).subscribe(async (_c$: { status: number, data: string }) => {
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
          this.REPPORTS_HEADER.DHIS2_SENDING_ERROR_MESSAGE = err.message??'Erreur lors de l\'envoi des données au serveur DHIS2';
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