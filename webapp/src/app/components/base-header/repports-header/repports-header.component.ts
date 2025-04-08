import { Component } from '@angular/core';
import { SnackbarService } from '@kossi-services/snackbar.service';
import { UserContextService } from '@kossi-services/user-context.service';
import { FormGroupService } from '@kossi-services/form-group.service';
import { ModalService } from '@kossi-services/modal.service';
import { ConstanteService } from '@kossi-services/constantes.service';
import { ConnectivityService } from '@kossi-services/connectivity.service';
import { BAseHeaderSelectorComponent } from '../base-header.component';

@Component({
  standalone: false,
  selector: 'repports-header-selector',
  templateUrl: './repports-header.component.html',
  styleUrls: ['./repports-header.component.css']
})
export class RepportsHeaderSelectorComponent extends BAseHeaderSelectorComponent<any> {

  constructor(mService: ModalService, cst: ConstanteService,
    userCtx: UserContextService, 
    snackbar: SnackbarService, 
    fGroup: FormGroupService,
    conn: ConnectivityService
  ) {
    
    super(
      mService, 
      cst,
      userCtx, 
      snackbar, 
      fGroup,
      conn
    );
  
  }

}
