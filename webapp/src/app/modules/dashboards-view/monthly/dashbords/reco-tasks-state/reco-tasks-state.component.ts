import { Component } from '@angular/core';
import { ConnectivityService } from '@kossi-services/connectivity.service';
import { LocalDbDataFetchService } from '@kossi-services/local-db-data-fetch.service';
import { SnackbarService } from '@kossi-services/snackbar.service';
import { FormGroupService } from '@kossi-services/form-group.service';
import { UserContextService } from '@kossi-services/user-context.service';
import { RecoTasksStateDashboard, RecoTasksStateDashboardUtils, RecoTasksStateFamilies } from '@kossi-models/dashboards';
import { BaseDashboardsComponent } from '../../../base-dashboards.component';
import { from } from 'rxjs';


@Component({
  standalone: false,
  selector: 'reco-tasks-state-dashboard',
  templateUrl: './reco-tasks-state.component.html',
  styleUrl: './reco-tasks-state.component.css'
})

export class RecoTasksStateComponent extends BaseDashboardsComponent<RecoTasksStateDashboard[]> {

  override DASHBOARD_NAME = 'RECOS_TASKS_STATE';


  constructor(private ldbfetch: LocalDbDataFetchService, fGroup: FormGroupService, conn: ConnectivityService, snackbar: SnackbarService, userCtx: UserContextService) {
    super(
      fGroup,
      conn,
      snackbar,
      userCtx,
      (formData, isOnline) => from(this.ldbfetch.GetRecoTasksStateDashboard(formData, isOnline)),
    );
  }

  PAGINATION_DATA: RecoTasksStateDashboard[] = [];

  getTotalDataCountForReco(reco: RecoTasksStateDashboard): number {
    return reco.families.reduce((sum, f) => {
      return sum + f.patients.reduce((pSum, p) => pSum + p.data.length, 0);
    }, 0);
  }

  getTotalDataCountForFamily(family: RecoTasksStateFamilies): number {
    return family.patients.reduce((sum, p) => sum + p.data.length, 0);
  }

  taskDuration(data: RecoTasksStateDashboardUtils, formatted: boolean = true): string | number {
    const date1 = new Date(data.start_date);
    const date2 = new Date(data.end_date);

    // Vérifie la validité des dates
    if (isNaN(date1.getTime()) || isNaN(date2.getTime())) return '-';

    const diffInMs = date2.getTime() - date1.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (formatted) {
      const absDays = Math.abs(diffInDays);
      return `${absDays} jour${absDays > 1 ? 's' : ''}`;
    }

    return diffInDays;
  }

  formatForm(form: string): string {
    if (!form || typeof form !== 'string') return '';

    const parts = form.split('_');
    const isFollowup = parts.includes('followup');

    if (isFollowup) {
      const filteredParts = parts.filter(p => p !== 'followup');
      return `Suivi ${filteredParts.join(' ')}`;
    }

    return parts.join(' ');
  }


  formatDateToFr(dateStr: string): string {
    const date = new Date(dateStr);

    if (isNaN(date.getTime())) {
      return '-';
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Mois commence à 0
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  }

  onUpdatedPaginate(data: RecoTasksStateDashboard[]) {
    console.log(data[0])
    this.PAGINATION_DATA = data
  }

  get DATA_FETCHED() {
    return ((this.DASHBOARDS_DATA as any)[this.DASHBOARD_NAME]?.data ?? []) as RecoTasksStateDashboard[];
  }

}

