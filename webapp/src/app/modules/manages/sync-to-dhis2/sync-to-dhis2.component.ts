import { Component } from '@angular/core';
import { UserContextService } from '@kossi-services/user-context.service';
import { AuthService } from '@kossi-services/auth.service';

@Component({
  selector: 'app-sync-to-dhis2',
  templateUrl: `./sync-to-dhis2.component.html`,
  styleUrls: ['./sync-to-dhis2.component.css'],
})
export class SyncToDhis2Component {
  constructor(private userCtx: UserContextService, private auth: AuthService) { }

}
