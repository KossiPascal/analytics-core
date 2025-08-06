import { Component, Input, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { NewRoleUtils } from '@kossi-models/interfaces';
import { Roles, Routes} from '@kossi-models/user-role';
import { ApiService } from '@kossi-services/api.service';
import { ConstanteService } from '@kossi-services/constantes.service';
import { ModalService } from '@kossi-services/modal.service';
import { UserContextService } from '@kossi-services/user-context.service';

@Component({
  standalone: false,
  selector: 'app-create-update-delete-roles',
  templateUrl: `./create-update-delete.component.html`,
  styleUrls: ['./create-update-delete.component.css'],
})
export class CreateUpdateDeleteShowRoleComponent implements OnInit {


  // for delete role
  @Input() IS_DELETE_MODE!: boolean;
  @Input() SELECTED_ROLE!: Roles;
  
  // for create or update role
  @Input() IS_CREATE_OR_UPDATE!: boolean;
  @Input() DATAS: NewRoleUtils = {
    roles: [],
    routes: [],
    authorizations: [],
    role: null
  }

  roleForm!: FormGroup;

  isEditMode: boolean = false;
  isProcessing: boolean = false;

  selectedRoute: Routes[] = [];
  selectedAutorization: string[] = [];
  message: string = '';

  APP_LOGO: string = '';



  visibleSection: string = 'info';

 constructor(private api: ApiService, private userCtx: UserContextService, private mService: ModalService, private cst: ConstanteService) {
     this.APP_LOGO = this.cst.APP_LOGO;
 
   }

  ngOnInit(): void {
    if (this.IS_CREATE_OR_UPDATE == true) {
      if (!!this.DATAS.role) {
        this.selectedRoute = this.DATAS.routes.filter(r=>((this.DATAS.role!.routes ?? []) as Routes[]).map(rs=>rs.path).includes(r.path)) ;
        this.selectedAutorization = this.DATAS.authorizations.filter(r=>((this.DATAS.role!.authorizations ?? []) as string[]).includes(r)) ;
      }
      this.roleForm = this.createFormGroup(this.DATAS.role);
   }
  }

  toggleSection(section: string) {
    this.visibleSection = this.visibleSection === section ? '' : section;
  }

  isValidForm(): boolean {
    return (this.roleForm?.value.name??'')!='' 
          && this.selectedRoute.length > 0 
          && this.selectedAutorization.length > 0;
  }

  containsRoute(route: Routes): boolean {
    const dt = this.selectedRoute.find(p => p.path === route.path);
    return dt !== undefined && dt !== null;
  }

  containsAutorization(autorization: string): boolean {
    return this.selectedAutorization.includes(autorization);
  }

  addOrRemoveRoute(route: Routes) {
    const [found, index] = (() => {
      let foundIndex = -1;
      const foundObject = this.selectedRoute.find((dt, idx) => {
        if (dt.path === route.path) {
          foundIndex = idx;
          return true;
        }
        return false;
      });
      return [foundObject, foundIndex];
    })();


    if (index !== -1) {
      this.selectedRoute.splice(index, 1);
    } else {
      this.selectedRoute.push(route);
    }
  }

  selectAllRoutes() {
    if (this.selectedRoute.length == this.DATAS.routes.length) {
      this.selectedRoute = [];
    } else {
      this.selectedRoute = this.DATAS.routes;
    }
  }

  selectAllAuthorizations() {
    if (this.selectedAutorization.length == this.DATAS.authorizations.length) {
      this.selectedAutorization = [];
    } else {
      this.selectedAutorization = this.DATAS.authorizations;
    }
  }

  addOrRemoveAutorization(autorization: string) {
    const [found, index] = (() => {
      let foundIndex = -1;
      const foundObject = this.selectedAutorization.find((dt, idx) => {
        if (dt === autorization) {
          foundIndex = idx;
          return true;
        }
        return false;
      });
      return [foundObject, foundIndex];
    })();
    if (index !== -1) {
      this.selectedAutorization.splice(index, 1);
    } else {
      this.selectedAutorization.push(autorization);
    }
  }
  
  createFormGroup(role?: Roles | null): FormGroup {
    const isExistingRole = !!role;
    const name = role?.name ?? '';

    const formControls: { [key: string]: FormControl } = {
      name: new FormControl(
        { value: name, disabled: isExistingRole && name != '' },
        [Validators.required, Validators.minLength(4)]
      ),
    };
    return new FormGroup(formControls);
  }

  toStringNewLine(value: string[] | null, type: 'routes' | 'authorizations'): string {
    return value != null ? `${value}`.toString().replace(/,/g, '<br>') : '';
  }

  createOrUpdate(): any {
    this.message = '';
    this.isProcessing = true;

    const dataToSave:any = {
      id: this.DATAS?.role?.id,
      name: this.DATAS?.role?.name ?? this.roleForm.value.name,
      routes: this.selectedRoute as Routes[],
      authorizations: this.selectedAutorization as string[]
    }
    if ((dataToSave.name??'').length < 4) {
      this.message = 'Le nom ne doit pas être vide.';
      this.isProcessing = false;
      return;
    }

    if (dataToSave.routes.length <= 0) {
      this.message = 'Selectionner au moins une route pour ce roles';
      this.isProcessing = false;
      return;
    }

    if (dataToSave.authorizations.length <= 0) {
      this.message = 'Selectionner au moins une authorizations pour ce roles';
      this.isProcessing = false;
      return;
    }

    const apiActionToDo = this.DATAS?.role ? this.api.UpdateRole(dataToSave) : this.api.CreateRole(dataToSave);

    apiActionToDo.subscribe((res: { status: number, data: any }) => {
      if (res.status === 200) {
        const actionType = this.DATAS?.role ? { updated: true } : { created: true };
        this.mService.close(actionType);
      } else {
        this.message = res.data;
        this.isProcessing = false;
      }
    }, (err: any) => {
      this.message = 'Erreur inconnue!';
      this.isProcessing = false;
    });
  }
  
  delete() {
    this.message = '';
    this.isProcessing = true;
    // const user = this.userCtx.currentUser;
    if (this.SELECTED_ROLE && this.SELECTED_ROLE.id) {
      this.api.DeleteRole(this.SELECTED_ROLE).subscribe((res: { status: number, data: any }) => {
        if (res.status === 200) {
          this.mService.close({ deleted: true });
        } else {
          this.message = 'Erreur lors de la suppression, reessayez!';
          this.isProcessing = false;
        }
      }, (err: any) => {
        this.message = 'Erreur lors de la suppression, reessayez!';
        this.isProcessing = false;
      });
    } else {
      this.message = 'Vous ne pouvez supprimer ce rôle';
      this.isProcessing = false;
    }

  }


}
