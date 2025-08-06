import { Component } from '@angular/core';
import { RecoVaccinationDashboard } from '@kossi-models/dashboards';
import { ConnectivityService } from '@kossi-services/connectivity.service';
import { LocalDbDataFetchService } from '@kossi-services/local-db-data-fetch.service';
import { SnackbarService } from '@kossi-services/snackbar.service';
import { BaseDashboardsComponent } from '../../../base-dashboards.component';
import { FormGroupService } from '@kossi-services/form-group.service';
import { UserContextService } from '@kossi-services/user-context.service';
import { ModalService } from '@kossi-services/modal.service';
import { SmsComponent } from '@kossi-modals/sms/sms.component';
import { formatGuineaPhone } from '@kossi-pipes/guinea-phone.pipe';
import { notNull } from '@kossi-shared/functions';
import { from } from 'rxjs';

@Component({
  standalone: false,
  selector: 'reco-vaccinations-not-done-dashboard',
  templateUrl: './a-reco-vaccination.component.html',
  styleUrl: './a-reco-vaccination.component.css'
})

export class RecoVaccinationNotDoneDashboardComponent extends BaseDashboardsComponent<RecoVaccinationDashboard[]> {

  override DASHBOARD_NAME = 'RECOS_VACCINES_NOT_DONE';
  override showGeneralCallAndSmsButton = true;
  override showOneByOneCallAndSmsButton = true;


  constructor(private ldbfetch: LocalDbDataFetchService, private mService: ModalService, fGroup: FormGroupService, conn: ConnectivityService, snackbar: SnackbarService, userCtx: UserContextService) {
    super(
      fGroup,
      conn,
      snackbar,
      userCtx,
      (formData, isOnline) => from(this.ldbfetch.GetRecoVaccinationNotDoneDashboard(formData, isOnline)),
    );
  }


  PAGINATION_DATA: RecoVaccinationDashboard[][] = [];


  onUpdatedPaginate(data: RecoVaccinationDashboard[][]) {
    this.PAGINATION_DATA = data
  }

  get DATA_FETCHED() {
    return ((this.DASHBOARDS_DATA as any)[this.DASHBOARD_NAME]?.data ?? []) as RecoVaccinationDashboard[][];
  }

  override async sendSms(event: Event, data?: { phone: string }) {
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


  override async sendCustomSms(event: Event, data?: { vaccine: RecoVaccinationDashboard }) {
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

}

