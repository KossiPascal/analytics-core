import { Component } from '@angular/core';
import { ConnectivityService } from '@kossi-services/connectivity.service';
import { LocalDbDataFetchService } from '@kossi-services/local-db-data-fetch.service';
import { SnackbarService } from '@kossi-services/snackbar.service';
import { BaseDashboardsComponent } from '../../../base-dashboards.component';
import { FormGroupService } from '@kossi-services/form-group.service';
import { UserContextService } from '@kossi-services/user-context.service';
import { ActiveRecoDashboard, ActiveRecoReco, ActiveRecoRecord, ActiveRecoUtils } from '@kossi-models/dashboards';
import { from } from 'rxjs';
import { currentYear, currentMonth, getMonthsList } from '@kossi-shared/functions';


@Component({
  standalone: false,
  selector: 'reco-active-dashboard',
  templateUrl: './reco-active.component.html',
  styleUrl: './reco-active.component.css'
})

export class RecoActiveComponent extends BaseDashboardsComponent<ActiveRecoDashboard> {

  override DASHBOARD_NAME = 'ACTIVE_RECOS';

  year: number = 0;
  wantedMonth: (keyof ActiveRecoReco)[] = [];

  CIBLE: { key: keyof ActiveRecoUtils, name: string, show: boolean }[] = [
    { key: 'fonctionnal', name: 'Fonctionnel', show: true },
    { key: 'supervised', name: 'Supervisé', show: false },
    { key: 'cover', name: 'Couvert', show: false },
  ];



  onCheckboxChange(event: Event, index: number) {
    const input = event.target as HTMLInputElement | null;
    if (input) {
      this.CIBLE[index].show = input.checked;
    }
  }

  get cibleCheckedLength(){
    return (this.CIBLE.filter(c=>c.show)).length;
  }



  constructor(private ldbfetch: LocalDbDataFetchService, fGroup: FormGroupService, conn: ConnectivityService, snackbar: SnackbarService, userCtx: UserContextService) {
    super(
      fGroup,
      conn,
      snackbar,
      userCtx,
      (formData, isOnline) => {
        this.year = Number(formData.year);
        const mth = currentMonth();
        const isLess = this.year < currentYear();
        const months = getMonthsList().filter(m => isLess ? true : mth && m.uid <= mth.uid);
        // this.monthNames = months.map(m => ({ key: m.short, label: m.labelFR.toUpperCase() }));
        this.wantedMonth = months.map(m => m.short as keyof ActiveRecoReco)
        return from(this.ldbfetch.GetActiveRecoDashboard(formData, isOnline))
      },
    );
  }




  PAGINATION_DATA: ActiveRecoRecord[] = [];

  isIncludeMonth(key: keyof ActiveRecoReco) {
    return this.wantedMonth.includes(key)
  }


  monthNames: { key: keyof ActiveRecoReco, label: string }[] = [
    { key: 'jan', label: 'JANVIER' },
    { key: 'fev', label: 'FÉVRIER' },
    { key: 'mar', label: 'MARS' },
    { key: 'avr', label: 'AVRIL' },
    { key: 'mai', label: 'MAI' },
    { key: 'jui', label: 'JUIN' },
    { key: 'jul', label: 'JUILLET' },
    { key: 'aou', label: 'AOÛT' },
    { key: 'sep', label: 'SEPTEMBRE' },
    { key: 'oct', label: 'OCTOBRE' },
    { key: 'nov', label: 'NOVEMBRE' },
    { key: 'dec', label: 'DÉCEMBRE' },
  ];

  monthKeys = this.monthNames.map(m => m.key as keyof ActiveRecoReco);

  getRecoIndex(chwIndex: number, recoIndex: number): number {
    let count = 0;
    for (let i = 0; i < chwIndex; i++) {
      count += this.PAGINATION_DATA[i].recos.length;
    }
    return count + recoIndex + 1;
  }


  onUpdatedPaginate(data: ActiveRecoRecord[]) {
    this.PAGINATION_DATA = data
  }

  get DATA_FETCHED() {
    return ((this.DASHBOARDS_DATA as any)[this.DASHBOARD_NAME]?.data ?? []) as ActiveRecoDashboard;
  }

}

