import { Component } from '@angular/core';
import { FormGroupService } from '@kossi-services/form-group.service';
import { ModalService } from '@kossi-services/modal.service';
import { SnackbarService } from '@kossi-services/snackbar.service';
import { UserContextService } from '@kossi-services/user-context.service';
import { BaseOrgunitsFilterComponent } from '../base-orgunits-filter.component';

@Component({
  standalone: false,
  selector: 'dashboards-orgunits-filter',
  templateUrl: './dashboards-orgunits-filter.component.html',
  styleUrl: './dashboards-orgunits-filter.component.css'
})
export class DashboardsOrgunitsFilterComponent extends BaseOrgunitsFilterComponent<any> {

  constructor(userCtx: UserContextService, fGroup: FormGroupService, mService: ModalService, snackbar: SnackbarService) {
    super(
      userCtx,
      fGroup,
      mService,
      snackbar
    );
  }

}