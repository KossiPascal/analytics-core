import { Component, OnInit } from '@angular/core';
import { NewRoleUtils } from '@kossi-models/interfaces';
import { Routes, User, Roles} from '@kossi-models/user-role';
import { ApiService } from '@kossi-services/api.service';
import { ConstanteService } from '@kossi-services/constantes.service';
import { ModalService } from '@kossi-services/modal.service';
import { SnackbarService } from '@kossi-services/snackbar.service';
import { UserContextService } from '@kossi-services/user-context.service';
import { CreateUpdateDeleteShowRoleComponent } from './create-update-delete/create-update-delete.component';


@Component({
  standalone: false,
  selector: 'app-roles-view',
  templateUrl: `./roles.component.html`,
  styleUrls: ['./roles.component.css'],
})
export class RolesComponent implements OnInit {
 
  roles$: Roles[] = [];
  routes$: Routes[] = [];
  authorizations$: string[] = [];

  APP_LOGO: string = '';

  USER!: User | null;

  visibleSection: string = 'info';

  constructor(private userCtx: UserContextService, private api: ApiService, private snackbar: SnackbarService, private mService: ModalService, private cst: ConstanteService) {
    this.initializeComponent();
  }

  private async initializeComponent() {
    this.APP_LOGO = this.cst.APP_LOGO;
    this.USER = await this.userCtx.currentUser();
  }


  toggleSection(section: string) {
    this.visibleSection = this.visibleSection === section ? '' : section;
  }

  ngOnInit(): void {
    this.GetRoles();
    this.GetUserAuthorizations();
    this.GetUserRoutes();
  }


  GetRoles() {
    this.api.GetRoles().subscribe(async (_c$: { status: number, data: Roles[] }) => {
      if (_c$.status == 200) this.roles$ = _c$.data;
    }, (err: any) => { });
  }

  GetUserAuthorizations() {
    this.api.UserAuthorizations().subscribe(async (_c$: { status: number, data: string[] }) => {
      if (_c$.status == 200) this.authorizations$ = _c$.data;
    }, (err: any) => { });
  }

  GetUserRoutes() {
    this.api.UserRoutes().subscribe(async (_c$: { status: number, data: Routes[] }) => {
      if (_c$.status == 200) this.routes$ = _c$.data;
    }, (err: any) => { });
  }


  generateSelectedRole(role?: Roles | null): NewRoleUtils {
    return {
      roles: this.roles$,
      routes: this.routes$,
      authorizations: this.authorizations$,
      role: role ?? null,
    }
  }

  openCreateOrEditRoleModal(role?:Roles){
      this.mService.open(CreateUpdateDeleteShowRoleComponent, { data: { DATAS: this.generateSelectedRole(role), IS_CREATE_OR_UPDATE:true } }).subscribe((data?: { created: boolean, updated: boolean }) => {
        if (data) {
          if (data.created == true) {
            this.GetRoles();
            return this.snackbar.show({ msg: 'Sauvegardé avec succès', color: 'success', duration: 3000 });
          }
          if (data.updated == true) {
            this.GetRoles();
            return this.snackbar.show({ msg: 'Modifié avec succès', color: 'success', duration: 3000 });
          } 
        }
      });
  }

  openDeleteRoleModal(role:Roles){
      this.mService.open(CreateUpdateDeleteShowRoleComponent, { data: { SELECTED_ROLE: role, IS_DELETE_MODE:true } }).subscribe((data?: { deleted: boolean }) => {
        if (data && data.deleted == true) {
          this.GetRoles();
          return this.snackbar.show({ msg: 'Supprimé avec succès!', color: 'success', duration: 3000 });
        }
      });
  }

}
