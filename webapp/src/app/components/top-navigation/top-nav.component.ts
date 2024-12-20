import { Component } from '@angular/core';
import { LogoutConfirmComponent } from '@kossi-modals/logout/logout-confirm.component';
import { SyncForOfflineConfirmComponent } from '@kossi-modals/sync-for-offline/sync-for-offline.component';
import { User } from '@kossi-models/user';
import { AuthService } from '@kossi-services/auth.service';
import { ConnectivityService } from '@kossi-services/connectivity.service';
import { FixeModalService } from '@kossi-services/fix-modal.service';
import { PublicPagesService } from '@kossi-services/public-pages.service';
import { SnackbarService } from '@kossi-services/snackbar.service';
import { UserContextService } from '@kossi-services/user-context.service';
import { ModalService } from '@kossi-src/app/services/modal.service';


@Component({
  selector: 'app-top-navigation',
  templateUrl: './top-nav.component.html',
  styleUrls: ['./top-nav.component.css'],
})
export class TopNavigationComponent {

  APP_NAME: string;
  USER: User | null;
  isOnline:boolean;

  constructor(private conn: ConnectivityService, private pb:PublicPagesService, private mService: ModalService, private snackbar: SnackbarService, private auth: AuthService, private userCtx: UserContextService, private fix: FixeModalService) {
    this.APP_NAME = this.auth.APP_NAME;
    this.USER = this.userCtx.currentUserCtx;
    this.isOnline = window.navigator.onLine;
    this.conn.getOnlineStatus().subscribe(isOnline => this.isOnline = isOnline);
  }

  async syncForOffline(event: Event) {
    event.preventDefault();
    this.mService.open({ component: SyncForOfflineConfirmComponent });
  }

  async TestMyModal(event: Event) {
    event.preventDefault();
    this.fix.show({
      showCloseButton: true,
      error: 'eeeee',
      processing: false,
      isFlatButton: true,
      modalTitle: 'TETETETETTETETE',
      cancelBtnName: 'CANCEL CNAKDK',
      submitBtnName: 'SUBMITTTTTTTTT',
      showBottomElements: true,
      showCancelButton: true,
      reloadApp: false,
      hideOnConfirm: false,
      modalActionColor: 'danger-back',
      modalContentHtmh: `
      <app-lockscreen><app-lockscreen>
      <h2 style="color:blue;">This is body</h2>

      `,
      onSubmit: async () => {

      },
      onCancel: async () => {

      },
      errorMsg: 'string'
    });
  }

  noAvailableImplementation(event: Event) {
    event.preventDefault();

    return this.snackbar.show('Pas encore implémenté pour le moment!', { backgroundColor: 'info', position:'TOP' });

  }

  logout(event: Event) {
    event.preventDefault();
    this.mService.open({ component: LogoutConfirmComponent });
  }

  downloadAPK(prodApp: boolean){
    this.pb.downloadAPK(prodApp);
  }

  openGuidePage(){
    this.pb.openGuidePage();
  }

  openRecoGuidePage(){
    this.pb.openRecoGuidePage();
  }
}

