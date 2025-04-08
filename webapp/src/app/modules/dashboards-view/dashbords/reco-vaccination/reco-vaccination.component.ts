import { Component } from '@angular/core';
import { RecoVaccinationDashboard } from '@kossi-models/dashboards';
import { ConnectivityService } from '@kossi-services/connectivity.service';
import { LocalDbDataFetchService } from '@kossi-services/local-db-data-fetch.service';
import { SnackbarService } from '@kossi-services/snackbar.service';
import { BaseDashboardsComponent } from '../base-dashboards.component';
import { from } from 'rxjs';
import { FormGroupService } from '@kossi-services/form-group.service';
import { UserContextService } from '@kossi-services/user-context.service';
import { ModalService } from '@kossi-services/modal.service';
import { SmsComponent } from '@kossi-modals/sms/sms.component';
import { formatGuineaPhone } from '@kossi-pipes/guinea-phone.pipe';
import { notNull } from '@kossi-shared/functions';

@Component({
  standalone: false,
  selector: 'reco-vaccinations-dashboard',
  templateUrl: './reco-vaccination.component.html',
  styleUrl: './reco-vaccination.component.css'
})

export class RecoVaccinationDashboardComponent extends BaseDashboardsComponent<RecoVaccinationDashboard[]> {

  PAGINATION_DATA: RecoVaccinationDashboard[][] = [];

  override DASHBOARD_NAME = 'RECOS_VACCINES';


  constructor(private ldbfetch: LocalDbDataFetchService, private mService: ModalService, fGroup: FormGroupService, conn: ConnectivityService, snackbar: SnackbarService, userCtx: UserContextService) {
    super(
      fGroup,
      conn,
      snackbar,
      userCtx,
      (formData, isOnline) => from(this.ldbfetch.GetRecoVaccinationDashboard(formData, isOnline)),
    );

    // this.fGroup.DASHBOARDS_DATA$.pipe(takeUntil(this.destroy$)).subscribe(dataSaved => {
    //   if (dataSaved) {
    //     this.RECO_VACCINES = (dataSaved as any)[this.DASHBOARD_NAME]?.data as RecoVaccinationDashboard[];
    //     this.CHANGE_STATE = new Date();
    //   }
    // });
  }





  async sendSms(event: Event, data?: { phone: string }) {
    event.preventDefault();
    let phoneNumbers: string[] = [];

    if (data) {
      if (notNull(data.phone)) {
        phoneNumbers = [formatGuineaPhone(data.phone)];
      }
    } else {
      for (const dts of this.DATA_FETCHED) {
        for (const dt of dts) {
          if (notNull(dt.parent_phone)) {
            const pn = formatGuineaPhone(dt.parent_phone)
            if (!phoneNumbers.includes(pn)) {
              phoneNumbers.push(pn)
            }
          }
        }
      }
    }

    if (phoneNumbers.length > 0) {
      this.mService.open(SmsComponent, { data: { DATAS: phoneNumbers, isCustomSms: false } }).subscribe((res?: { success: boolean, errorMsg?: string }) => {
        if (res) {
          if (res.success) {
            return this.snackbar.show({ msg: 'Méssage envoyé avec succès', color: 'success', duration: 3000 });
          } else {
            return this.snackbar.show({ msg: res.errorMsg || 'Méssage non envoyé', color: 'danger', duration: 5000 });
          }
        }
      });
    } else {
      return this.snackbar.show({ msg: 'Numero de téléphone invalide', color: 'danger', duration: 5000 });
    }
  }

  getVaccineInfos(vaccines: RecoVaccinationDashboard[][]): { phone: string, message: string }[] {
    const msg = (vaccineInfo: string[]) => {
      return `Retard de vaccin::\nVous devez anemer votre enfant pour: ${vaccineInfo.join(', ')}`.trim();
    }
    const outPutData: { phone: string, message: string }[] = [];

    const vaccineInfos: { [key: string]: string[] } = {};
    for (const vaccins of vaccines) {
      for (const v of vaccins) {
        if (![undefined, null, 'null', 'undefined', '', ' '].includes(v.parent_phone)) {
          if (!(v.parent_phone in vaccineInfos)) vaccineInfos[v.parent_phone] = []
          if (this.vaccinationUtils(v.vaccine_BCG, v.child_age_in_days, 0) == 'off') vaccineInfos[v.parent_phone].push('BCG');
          if (this.vaccinationUtils(v.vaccine_VPO_0, v.child_age_in_days, 0) == 'off') vaccineInfos[v.parent_phone].push('VPO0');
          if (this.vaccinationUtils(v.vaccine_PENTA_1, v.child_age_in_days, 42) == 'off') vaccineInfos[v.parent_phone].push('PENTA1');
          if (this.vaccinationUtils(v.vaccine_VPO_1, v.child_age_in_days, 42) == 'off') vaccineInfos[v.parent_phone].push('VPO1');
          if (this.vaccinationUtils(v.vaccine_PENTA_2, v.child_age_in_days, 70) == 'off') vaccineInfos[v.parent_phone].push('PENTA2');
          if (this.vaccinationUtils(v.vaccine_VPO_2, v.child_age_in_days, 70) == 'off') vaccineInfos[v.parent_phone].push('VPO2');
          if (this.vaccinationUtils(v.vaccine_PENTA_3, v.child_age_in_days, 98) == 'off') vaccineInfos[v.parent_phone].push('PENTA3');
          if (this.vaccinationUtils(v.vaccine_VPO_3, v.child_age_in_days, 98) == 'off') vaccineInfos[v.parent_phone].push('VPO3');
          if (this.vaccinationUtils(v.vaccine_VPI_1, v.child_age_in_days, 98) == 'off') vaccineInfos[v.parent_phone].push('VPI1');
          if (this.vaccinationUtils(v.vaccine_VAR_1, v.child_age_in_months, 9) == 'off') vaccineInfos[v.parent_phone].push('VAR1');
          if (this.vaccinationUtils(v.vaccine_VAA, v.child_age_in_months, 9) == 'off') vaccineInfos[v.parent_phone].push('VAA');
          if (this.vaccinationUtils(v.vaccine_VPI_2, v.child_age_in_months, 9) == 'off') vaccineInfos[v.parent_phone].push('VPI2');
          if (this.vaccinationUtils(v.vaccine_MEN_A, v.child_age_in_months, 15) == 'off') vaccineInfos[v.parent_phone].push('MENA');
          if (this.vaccinationUtils(v.vaccine_VAR_2, v.child_age_in_months, 15) == 'off') vaccineInfos[v.parent_phone].push('VAR2');
        }
      }
    }

    for (const key of Object.keys(vaccineInfos)) {
      if (vaccineInfos[key].length > 0) {
        outPutData.push({ phone: formatGuineaPhone(key), message: msg(vaccineInfos[key]) })
      }
    }

    return outPutData;

  }

  async sendCustomSms(event: Event, data?: { vaccine: RecoVaccinationDashboard }) {
    event.preventDefault();
    let datas: { phone: string, message: string }[] = [];
    if (data) {
      datas = this.getVaccineInfos([[data.vaccine]])
    } else {
      datas = this.getVaccineInfos(this.DATA_FETCHED)
    }

    if (datas.length > 0) {
      this.mService.open(SmsComponent, { data: { DATAS: datas, isCustomSms: true } }).subscribe((res?: { success: boolean, errorMsg?: string }) => {
        if (res) {
          if (res.success) {
            return this.snackbar.show({ msg: 'Méssage envoyé avec succès', color: 'success', duration: 3000 });
          } else {
            return this.snackbar.show({ msg: res.errorMsg || 'Méssage non envoyé', color: 'danger', duration: 5000 });
          }
        }
      });
    } else {
      return this.snackbar.show({ msg: 'Numero de téléphone invalide', color: 'danger', duration: 5000 });
    }
  }

  onUpdatedPaginate(data: RecoVaccinationDashboard[][]) {
    this.PAGINATION_DATA = data
  }

  get DATA_FETCHED() {
    return ((this.DASHBOARDS_DATA as any)[this.DASHBOARD_NAME]?.data ?? []) as RecoVaccinationDashboard[][];
  }

  vaccineUtils(arg0: boolean, arg1: number, arg2: number): { class: 'vaccine-on' | 'vaccine-off' | 'vaccine-NA', action: '&#10003;' | '&times;' | 'NA' } {
    const dt = this.vaccinationUtils(arg0, arg1, arg2);
    return {
      class: dt == 'on' ? 'vaccine-on' : dt == 'off' ? 'vaccine-off' : 'vaccine-NA',
      action: dt == 'on' ? '&#10003;' : dt == 'off' ? '&times;' : 'NA'
    };
  }

  vaccinationUtils(arg0: boolean, arg1: number, arg2: number): 'on' | 'off' | 'na' {
    if (arg1 >= arg2) return arg0 === true ? 'on' : 'off';
    return 'na';
  }

  quantityStyle(data: number) {
    if (data < 0) return 'quantity-error'
    return data > 0 ? 'quantity-up' : 'quantity-down';
  }

}

