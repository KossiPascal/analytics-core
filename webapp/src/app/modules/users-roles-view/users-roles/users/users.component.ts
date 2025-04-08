import { Component, OnInit } from '@angular/core';
import { CountryMap, RegionsMap, PrefecturesMap, CommunesMap, HospitalsMap, DistrictQuartiersMap, VillageSecteursMap, ChwsMap, RecosMap } from '@kossi-models/org-unit-interface';
import { ApiService } from '@kossi-services/api.service';
import { ModalService } from '@kossi-services/modal.service';
import { SnackbarService } from '@kossi-services/snackbar.service';
import { UserContextService } from '@kossi-services/user-context.service';
import { User, Roles } from '@kossi-models/user-role';
import { ConstanteService } from '@kossi-src/app/services/constantes.service';
import { notNull, userRoles } from '@kossi-shared/functions';
import { NewUserUtils } from '@kossi-models/interfaces';
import { CreateUpdateDeleteShowUserComponent } from './create-update-delete-show/create-update-delete-show.component';

@Component({
  standalone: false,
  selector: 'app-users-view',
  templateUrl: `./users.component.html`,
  styleUrls: ['./users.component.css'],
})
export class UsersComponent implements OnInit {

  users$: User[] = [];
  roles$: Roles[] = [];
  APP_LOGO: string = '';

  countriesList: CountryMap[] = [];
  private regionsList: RegionsMap[] = [];
  private prefecturesList: PrefecturesMap[] = [];
  private communesList: CommunesMap[] = [];
  private hospitalsList: HospitalsMap[] = [];
  private districtQuartiersList: DistrictQuartiersMap[] = [];
  private villageSecteursList: VillageSecteursMap[] = [];
  private chwsList: ChwsMap[] = [];
  private recosList: RecosMap[] = [];


  USER!: User | null;


  constructor(private userCtx: UserContextService, private api: ApiService, private snackbar: SnackbarService, private mService: ModalService, private cst: ConstanteService) {
    this.initializeComponent();
  }

  private async initializeComponent() {
    this.APP_LOGO = this.cst.APP_LOGO;
    this.USER = await this.userCtx.currentUser();
  }

  ngOnInit(): void {
    this.GetUsers();
    this.GetRoles();
    this.GetCountries();
    this.GetRegions();
    this.GetPrefectures();
    this.GetCommunes();
    this.GetHospitals();
    this.GetDistrictQuartiers();
    this.GetVillageSecteurs();
    this.GetChws();
    this.GetRecos();
  }


  OrgUnitsIsEmpty(user: User): boolean {
    const data = [...(user.countries ?? []), ...(user.regions ?? []), ...(user.prefectures ?? []), ...(user.communes ?? []), ...(user.hospitals ?? []), ...(user.districtQuartiers ?? []), ...(user.villageSecteurs ?? [])];
    return data.length === 0;
  }

  isAdmin(user: User) {
    const role = userRoles(user.authorizations ?? [], user.routes ?? [])
    return role?.isAdmin === true;
  }

  GetRoles() {
    this.api.GetRoles().subscribe((_c$: { status: number, data: Roles[] | any }) => {
      if (_c$.status == 200) this.roles$ = _c$.data;
    }, (err: any) => { });
  }

  GetUsers() {
    this.api.getUsers().subscribe((res: { status: number, data: any }) => {
      if (res.status === 200) {
        this.users$ = res.data;
      }
    }, (err: any) => { console.log(err) });
  }

  GetCountries() {
    this.api.GetCountries().subscribe((res: { status: number, data: CountryMap[] }) => {
      if (res.status === 200) this.countriesList = res.data;
    }, (err: any) => { console.log(err) });
  }

  GetRegions() {
    this.api.GetRegions().subscribe((res: { status: number, data: RegionsMap[] }) => {
      if (res.status === 200) this.regionsList = res.data;
    }, (err: any) => { console.log(err) });
  }

  GetPrefectures() {
    this.api.GetPrefectures().subscribe((res: { status: number, data: PrefecturesMap[] }) => {
      if (res.status === 200) this.prefecturesList = res.data;
    }, (err: any) => { console.log(err) });
  }

  GetCommunes() {
    this.api.GetCommunes().subscribe((res: { status: number, data: CommunesMap[] }) => {
      if (res.status === 200) this.communesList = res.data;
    }, (err: any) => { console.log(err) });
  }

  GetHospitals() {
    this.api.GetHospitals().subscribe((res: { status: number, data: HospitalsMap[] }) => {
      if (res.status === 200) this.hospitalsList = res.data;
    }, (err: any) => { console.log(err) });
  }

  GetDistrictQuartiers() {
    this.api.GetDistrictQuartiers().subscribe((res: { status: number, data: DistrictQuartiersMap[] }) => {
      if (res.status === 200) this.districtQuartiersList = res.data;
    }, (err: any) => { console.log(err) });
  }

  GetVillageSecteurs() {
    this.api.GetVillageSecteurs().subscribe((res: { status: number, data: VillageSecteursMap[] }) => {
      if (res.status === 200) this.villageSecteursList = res.data;
    }, (err: any) => { console.log(err) });
  }

  // GetFamilys() {
  //   this.api.GetFamilys().subscribe((res: { status: number, data: any }) => {
  //     if (res.status === 200) { }
  //   }, (err: any) => { console.log(err) });
  // }

  GetChws() {
    this.api.GetChws().subscribe((res: { status: number, data: ChwsMap[] }) => {
      if (res.status === 200) this.chwsList = res.data;
    }, (err: any) => { console.log(err) });
  }

  GetRecos() {
    this.api.GetRecos().subscribe((res: { status: number, data: RecosMap[] }) => {
      if (res.status === 200) this.recosList = res.data;
    }, (err: any) => { console.log(err) });
  }

  // GetPatients() {
  //   this.api.GetPatients().subscribe((res: { status: number, data: any }) => {
  //     if (res.status === 200) { }
  //   }, (err: any) => { console.log(err) });
  // }

  generateSelectedUser(user?: User | null): NewUserUtils {
    return {
      countries: this.countriesList,
      regions: this.regionsList,
      prefectures: this.prefecturesList,
      communes: this.communesList,
      hospitals: this.hospitalsList,
      districtQuartiers: this.districtQuartiersList,
      villageSecteurs: this.villageSecteursList,
      chws: this.chwsList,
      recos: this.recosList,
      user: user ?? null,
      roles: this.roles$
    }
  }

  openDeleteUserModal(user: User) {
    this.mService.open(CreateUpdateDeleteShowUserComponent, { data: { SELECTED_USER: user, IS_DELETE_MODE:true } }).subscribe((data?: { deleted: boolean }) => {
      if (data && data.deleted == true) {
        this.GetUsers();
        return this.snackbar.show({ msg: 'Supprimé avec succès!', color: 'success', duration: 3000 });
      }
    });
  }

  openCreateOrEditUserModal(user?: User) {
    this.mService.open(CreateUpdateDeleteShowUserComponent, { data: { ORGUNITS: this.generateSelectedUser(user), IS_CREATE_OR_UPDATE:true } }).subscribe((data?: { registered: boolean, updated: boolean }) => {
      if (data) {
        if (data.registered == true) {
          this.GetUsers();
          return this.snackbar.show({ msg: 'Sauvegardé avec succès', color: 'success', duration: 3000 });
        }
        if (data.updated == true) {
          this.GetUsers();
          return this.snackbar.show({ msg: 'Modifié avec succès', color: 'success', duration: 3000 });
        }  
        // const currentUser = this.userCtx.currentUser;
        // const token = res.data;
        // const user = jwtDecode(token) as User;
        // if (currentUser && user && currentUser.id == user.id) {
        //   this.store.set({ db: 'local', name: 'token', value: token });
        // }
      }
    });
  }

  openSelectedRolesModal(user: User) {
    const rolesIds = user.roles.filter(role => role && role.id).map(role => role.id);
    this.mService.open(CreateUpdateDeleteShowUserComponent, { data: { SELECTED_USER: user, ROLES: this.roles$, SELECTED_ROLE: rolesIds, IS_SHOW_ROLES: true } });
  }


  // updatePassword(user: User, form: FormGroup): any {
  //   const pass = form.value.password;
  //   const passCfm = form.value.passwordConfirm;
  //   if ((pass ?? '') != '' && (passCfm ?? '') != '' && pass == passCfm && user) {
  //     (user as any)['password'] = pass;
  //     this.api.updatePassword(user).subscribe((res: { status: number, data: any }) => {
  //       if (res.status === 200) {
  //         this.GetUsers();
  //         // this.selectedUser = null;
  //         // this.selectedRole = [];
  //       } else {
  //       }
  //     }, (err: any) => {
  //     });
  //   }
  // }

  

}
