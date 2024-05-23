import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Route, Router } from '@angular/router';
import { AuthService } from '@kossi-app/services/auth.service';
import { Roles } from '@kossi-models/roles';
import { Routes} from '@kossi-models/user';
import { ApiService } from '@kossi-services/api.service';
import { FixeModalService } from '@kossi-services/fix-modal.service';


@Component({
  selector: 'app-admin-roles',
  templateUrl: `./roles.component.html`,
  styleUrls: ['./roles.component.css'],
})
export class RolesComponent implements OnInit {
  activeSave() {
    throw new Error('Method not implemented.');
  }
  roles$: Roles[] = [];
  routes$: Routes[] = [];
  autorizations$: string[] = [];

  roleForm!: FormGroup;
  isLoading: boolean = false;
  LoadingMsg: string = "Loading...";
  isEditMode: boolean = false;
  selectedRole!: Roles | null;
  message: string = '';

  selectedRoute: Routes[] = [];
  selectedAutorization: string[] = [];

  addOrUpdateModalVisible: boolean = false;

  removeRoleModalVisible: boolean = false;

  constructor(private auth: AuthService, private api: ApiService, private fix: FixeModalService, private router: Router) {
  }

  ngOnInit(): void {
    this.GetRoles();
    this.GetUserAutorizations();
    this.GetUserRoutes();
    this.roleForm = this.createFormGroup();
  }


  GetRoles() {
    this.api.GetRoles().subscribe(async (_c$: { status: number, data: Roles[] }) => {
      if (_c$.status == 200) this.roles$ = _c$.data;
    }, (err: any) => { });
  }

  GetUserAutorizations() {
    this.api.UserAutorizations().subscribe(async (_c$: { status: number, data: string[] }) => {
      if (_c$.status == 200) this.autorizations$ = _c$.data;
    }, (err: any) => { });
  }

  GetUserRoutes() {
    this.api.UserRoutes().subscribe(async (_c$: { status: number, data: Routes[] }) => {
      if (_c$.status == 200) this.routes$ = _c$.data;
    }, (err: any) => { });
  }

  closeAddOrUpdateModalVisible() {
    this.addOrUpdateModalVisible = false;
  }

  openAddOrUpdateModalVisible() {
    this.addOrUpdateModalVisible = true;
  }

  closeRemoveRoleModalVisible() {
    this.removeRoleModalVisible = false;
  }

  openRemoveRoleModalVisible() {
    this.removeRoleModalVisible = true;
  }

  EditRole(role: Roles) {
    this.isEditMode = true;
    this.selectedRoute = this.routes$.filter(r=>((role.routes ?? []) as Routes[]).map(rs=>rs.path).includes(r.path)) ;
    this.selectedAutorization = this.autorizations$.filter(r=>((role.autorizations ?? []) as string[]).includes(r)) ;
    this.roleForm = this.createFormGroup(role);
    this.selectedRole = role;
    this.message = '';
    this.openAddOrUpdateModalVisible();
  }

  RoleSelectedToDelete(role: Roles) {
    this.selectedRole = role;
    this.message = '';
    this.openRemoveRoleModalVisible();
  }

  DeleteRole() {
    this.isEditMode = false;
    if (this.selectedRole) this.api.DeleteRole(this.selectedRole).subscribe((res: { status: number, data: any }) => {
      if (res.status === 200) {
        this.showModalToast('success', 'Supprimé avec success')
        console.log(`successfully deleted!`);
        this.GetRoles();
        this.selectedRole = null;
        this.selectedRoute = [];
        this.selectedAutorization = [];
        this.isLoading = false;
        this.message = '';
        this.closeRemoveRoleModalVisible();
      } else {
        this.message = res.data;
      }
    }, (err: any) => {
      this.message = err;
      this.isLoading = false;
      console.log(this.message);
    });
  }

  CreateRole() {
    this.isEditMode = false;
    this.roleForm = this.createFormGroup();
    this.selectedRole = null;
    this.selectedRoute = [];
    this.selectedAutorization = [];
    this.message = '';
    this.openAddOrUpdateModalVisible();
  }

  containsRoute(route: Routes): boolean {
    const dt = this.selectedRoute.find(p => p.path === route.path);
    return dt !== undefined && dt !== null;
  }

  containsAutorization(autorization: string): boolean {
    return this.selectedAutorization.includes(autorization);
  }

  AddOrRemoveRoute(route: Routes) {
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

  SelectAllRoutes() {
    if (this.selectedRoute.length == this.routes$.length) {
      this.selectedRoute = [];
    } else {
      this.selectedRoute = this.routes$;
    }
  }

  SelectAllAutorizations() {
    if (this.selectedAutorization.length == this.autorizations$.length) {
      this.selectedAutorization = [];
    } else {
      this.selectedAutorization = this.autorizations$;
    }
  }

  AddOrRemoveAutorization(autorization: string) {
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
  
  createFormGroup(role?: Roles): FormGroup {
    const formControls = {
      name: new FormControl(role?.name ?? '', [Validators.required, Validators.minLength(4)]),
      default_route: new FormControl((role?.default_route as Routes)?.path ?? ''),
    };
    if (this.isEditMode) formControls.name.disable();
    return new FormGroup(formControls);
  }

  showModalToast(icon: string, title: string) {
    // showToast(icon, title);
    this.closeModal('close-delete-modal');
  }

  closeModal(btnId: string = 'close-modal') {
    // $('#' + btnId).trigger('click');
  }

  ToStringNewLine(value: string[] | null, type: 'routes' | 'autorizations'): string {
    return value != null ? `${value}`.toString().replace(/,/g, '<br>') : '';
  }





  // autorizations
  // default_route
  // deletedAt
  // id
  // isDeleted
  // name
  // routes
  CreateOrUpdateRole(): any {
    var request: any;
    if (this.isEditMode) {
      if (this.selectedRole) {
        this.selectedRole.name = this.roleForm.value.name;
        this.selectedRole.default_route = this.selectedRoute.find(r => r.path === this.roleForm.value.default_route) as Routes;
        this.selectedRole.routes = this.selectedRoute as Routes[];
        this.selectedRole.autorizations = this.selectedAutorization as string[];
        request = this.api.UpdateRole(this.selectedRole);
      }
    } else {
      this.roleForm.value.default_route = this.selectedRoute.find(r => r.path === this.roleForm.value.default_route) as Route;
      this.roleForm.value.routes = this.selectedRoute as Routes[];
      this.roleForm.value.autorizations = this.selectedAutorization as string[];
      request = this.api.CreateRole(this.roleForm.value);
    }

    if (request) {
      return request.subscribe((res: { status: number, data: any }) => {
        if (res.status === 200) {
          this.message = 'Registed successfully !'
          this.closeModal();
          this.GetRoles();
          this.selectedRole = null;
          this.selectedRoute = [];
          this.selectedAutorization = [];
          this.message = '';
          this.closeAddOrUpdateModalVisible();
          // const currentUser = this.api.currentUser();
          // const user: User = res.data as User;
          // if (currentUser && user && currentUser.id == user.id) {
          //  this.api.setUser(res.data as User);
          // }
        } else {
          this.message = res.data;
        }
        console.log(this.message);
        this.isLoading = false;
      }, (err: any) => {
        this.isLoading = false;
      });
    }


  }

}
