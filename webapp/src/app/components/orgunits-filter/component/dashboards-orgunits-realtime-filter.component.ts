import { Component } from '@angular/core';
import { FormGroupService } from '@kossi-services/form-group.service';
import { ModalService } from '@kossi-services/modal.service';
import { SnackbarService } from '@kossi-services/snackbar.service';
import { UserContextService } from '@kossi-services/user-context.service';
import { BaseOrgunitsFilterComponent } from '../base-orgunits-filter.component';

@Component({
  standalone: false,
  selector: 'dashboards-orgunits-realtime-filter',
  templateUrl: './a-orgunits-filter.component.html',
  styleUrl: './a-orgunits-filter.component.css'
})
export class DashboardsOrgunitsRealtimeFilterComponent extends BaseOrgunitsFilterComponent<any> {

  override showMultipleSelectionMonth = false;
  override showMonthsSelection = false;
  override showYearsSelection = false;
  

  constructor(userCtx: UserContextService, fGroup: FormGroupService, mService: ModalService, snackbar: SnackbarService) {
    super(
      userCtx,
      fGroup,
      mService,
      snackbar
    );
  }

}