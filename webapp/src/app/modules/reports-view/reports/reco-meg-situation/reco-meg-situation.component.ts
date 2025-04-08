import { Component } from '@angular/core';
import { RecoMegQuantityUtils } from '@kossi-models/reports';
import { ApiService } from '@kossi-services/api.service';
import { ConnectivityService } from '@kossi-services/connectivity.service';
import { DbSyncService } from '@kossi-services/db-sync.service';
import { FormGroupService } from '@kossi-services/form-group.service';
import { LocalDbDataFetchService } from '@kossi-services/local-db-data-fetch.service';
import { SnackbarService } from '@kossi-services/snackbar.service';
import { UserContextService } from '@kossi-services/user-context.service';
import { from, takeUntil } from 'rxjs';
import { BaseReportsComponent } from '../base-reports.component';
import { Dhis2Service } from '@kossi-services/dhis2.service';

@Component({
  standalone: false,
  selector: 'reco-meg-situation-report',
  templateUrl: `./reco-meg-situation.component.html`,
  styleUrls: [
    './reco-meg-situation.component.css'
  ]
})
export class RecoMegSituationReportComponent extends BaseReportsComponent<RecoMegQuantityUtils[]> {

  override REPPORT_NAME = 'RECO_MEG_QUANTITIES';

  // private destroy$ = new Subject<void>();

  constructor(private api: ApiService, private ldbfetch: LocalDbDataFetchService, dhis2Service: Dhis2Service, db: DbSyncService, userCtx: UserContextService, conn: ConnectivityService, snackbar: SnackbarService, fGroup: FormGroupService) {

    super(
      fGroup,
      db,
      userCtx,
      conn,
      snackbar,
      dhis2Service,
      (formData, isOnline) => from(this.ldbfetch.GetRecoMegSituationReports(formData, isOnline)),
      (formData) => this.api.ValidateRecoMegSituationReports(formData),
      (formData) => this.api.CancelValidateRecoMegSituationReports(formData),
      (dhis2Params) => this.api.SendRecoMegSituationActivitiesToDhis2(dhis2Params),
    );

    this.dhis2Service.getDhis2SendingStatus().pipe(takeUntil(this.destroy$)).subscribe(dataSaved => {
      if (dataSaved) {
        // this.snackbar.show({ msg: dataSaved.msg, color: dataSaved.color, position: dataSaved.position ?? 'TOP', duration: dataSaved.duration ?? 5000 });
        this.CHANGE_STATE = new Date();
      }
    });
  }

  get DATA_FETCHED() {
    return (this.REPORTS_DATA as any)[this.REPPORT_NAME]?.data as RecoMegQuantityUtils[];
  }


  quantityStyle(data: number) {
    if (data < 0) return 'quantity-error'
    return data > 0 ? 'quantity-up' : 'quantity-down';
  }

  convertQty(v: any) {
    return v == 0 || v == '' || v == null || v == '0' || v == undefined ? undefined : v;
  }

  EcartColor(data: RecoMegQuantityUtils): { value: string, ecart: string, class: string } {
    const inventory = this.convertQty(data.month_inventory) ?? 0;
    const theoretical = this.convertQty(data.month_theoreticaly) ?? 0;
    if (inventory != 0 && theoretical != 0) {
      const diff = inventory - theoretical;
      const ec = (diff / theoretical) * 100;
      const ecart = ec < 0 ? -1 * ec : ec; // const ecart = Math.round((ec < 0 ? -1 * ec : ec) * 10) / 10;
      const sEcart = ecart > 100 ? '> 100%' : `${ecart.toFixed(0)}%`
      return { value: `${diff}`, ecart: sEcart, class: ecart > 5 ? 'quantity-error' : 'quantity-ok' };
    }
    return { value: '-', ecart: '-', class: '' };
  }

}
