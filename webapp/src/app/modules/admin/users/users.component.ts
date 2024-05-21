import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { CountryCoustomQuery, RegionCoustomQuery, PrefectureCoustomQuery, CommuneCoustomQuery, HospitalCoustomQuery, DistrictQuartierCoustomQuery, VillageSecteurCoustomQuery, ChwCoustomQuery, RecoCoustomQuery } from '@kossi-models/org-units';
import { ApiService } from '@kossi-services/api.service';
import { SnackbarService } from '@kossi-services/snackbar.service';
import { UserContextService } from '@kossi-services/user-context.service';
import { Roles } from '@kossi-src/app/models/roles';
import { AdminUser, User } from '@kossi-src/app/models/user';
import { ConstanteService } from '@kossi-src/app/services/constantes.service';
import { AppStorageService } from '@kossi-src/app/services/local-storage.service';
import { notNull } from '@kossi-src/app/utils/functions';

@Component({
  selector: 'app-admin-user',
  templateUrl: `./users.component.html`,
  styleUrls: ['./users.component.css'],
})
export class UsersComponent implements OnInit {

  users$: AdminUser[] = [];
  roles$: Roles[] = [];
  registerForm!: FormGroup;
  updateForm!: FormGroup;
  updatePasswordForm!: FormGroup;
  isEditMode: boolean = false;

  addOrUpdateModalVisible: boolean = false;

  selectedUser!: AdminUser | null;
  selectedRole: string[] = [];

  message: string = '';
  APP_LOGO: string = '';

  countriesList: CountryCoustomQuery[] = [];
  private regionsList: RegionCoustomQuery[] = [];
  private prefecturesList: PrefectureCoustomQuery[] = [];
  private communesList: CommuneCoustomQuery[] = [];
  private hospitalsList: HospitalCoustomQuery[] = [];
  private districtQuartiersList: DistrictQuartierCoustomQuery[] = [];
  private villageSecteursList: VillageSecteurCoustomQuery[] = [];
  private chwsList: ChwCoustomQuery[] = [];
  private recosList: RecoCoustomQuery[] = [];


  countries: CountryCoustomQuery[] = [];
  regions: RegionCoustomQuery[] = [];
  prefectures: PrefectureCoustomQuery[] = [];
  communes: CommuneCoustomQuery[] = [];
  hospitals: HospitalCoustomQuery[] = [];
  districtQuartiers: DistrictQuartierCoustomQuery[] = [];
  villageSecteurs: VillageSecteurCoustomQuery[] = [];
  // chws: ChwCoustomQuery[] = [];
  // recos: RecoCoustomQuery[] = [];

  USER:User|null;


  OrgUnitsIsEmpty(): boolean {
    const data = [...(this.countries ?? []), ...(this.regions ?? []), ...(this.prefectures ?? []), ...(this.communes ?? []), ...(this.hospitals ?? []), ...(this.districtQuartiers ?? []), ...(this.villageSecteurs ?? [])];
    return data.length === 0;
  }

  RolesIsEmpty(): boolean {
    return (this.selectedRole ?? []).length === 0;
  }

  // {id:'families', name:'families'},
  // {id:'chws', name:'chws'},
  // {id:'recos', name:'recos'},
  // {id:'patients', name:'patients'}

  private isToOpenList: { [key: string]: boolean } = {}

  isListOpenToShow(elmId: string): boolean {
    return this.isToOpenList[elmId] ?? false;
  }

  toggleList(elmId: string) {
    const cible = this.isToOpenList[elmId];
    this.isToOpenList[elmId] = !(cible === true);
  }

  constructor(private userCtx: UserContextService, private api: ApiService, private snackbar: SnackbarService, private store: AppStorageService, private cst: ConstanteService) {
    this.APP_LOGO = this.cst.APP_LOGO;
    this.USER = this.userCtx.currentUserCtx;
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
    this.registerForm = this.registerFormGroup();
    this.updateForm = this.updateFormGroup(this.selectedUser);
    this.updatePasswordForm = this.updatePasswordFormGroup(this.selectedUser);
  }

  isAdmin(userCtx: AdminUser) {
    return userCtx.isAdmin === true;
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
    this.api.GetCountries().subscribe((res: { status: number, data: CountryCoustomQuery[] }) => {
      if (res.status === 200) this.countriesList = res.data;
    }, (err: any) => { console.log(err) });
  }

  GetRegions() {
    this.api.GetRegions().subscribe((res: { status: number, data: RegionCoustomQuery[] }) => {
      if (res.status === 200) this.regionsList = res.data;
    }, (err: any) => { console.log(err) });
  }

  GetPrefectures() {
    this.api.GetPrefectures().subscribe((res: { status: number, data: PrefectureCoustomQuery[] }) => {
      if (res.status === 200) this.prefecturesList = res.data;
    }, (err: any) => { console.log(err) });
  }

  GetCommunes() {
    this.api.GetCommunes().subscribe((res: { status: number, data: CommuneCoustomQuery[] }) => {
      if (res.status === 200) this.communesList = res.data;
    }, (err: any) => { console.log(err) });
  }

  GetHospitals() {
    this.api.GetHospitals().subscribe((res: { status: number, data: HospitalCoustomQuery[] }) => {
      if (res.status === 200) this.hospitalsList = res.data;
    }, (err: any) => { console.log(err) });
  }

  GetDistrictQuartiers() {
    this.api.GetDistrictQuartiers().subscribe((res: { status: number, data: DistrictQuartierCoustomQuery[] }) => {
      if (res.status === 200) this.districtQuartiersList = res.data;
    }, (err: any) => { console.log(err) });
  }

  GetVillageSecteurs() {
    this.api.GetVillageSecteurs().subscribe((res: { status: number, data: VillageSecteurCoustomQuery[] }) => {
      if (res.status === 200) this.villageSecteursList = res.data;
    }, (err: any) => { console.log(err) });
  }

  GetFamilys() {
    this.api.GetFamilys().subscribe((res: { status: number, data: any }) => {
      if (res.status === 200) { }
    }, (err: any) => { console.log(err) });
  }

  GetChws() {
    this.api.GetChws().subscribe((res: { status: number, data: ChwCoustomQuery[] }) => {
      if (res.status === 200) this.chwsList = res.data;
    }, (err: any) => { console.log(err) });
  }

  GetRecos() {
    this.api.GetRecos().subscribe((res: { status: number, data: RecoCoustomQuery[] }) => {
      if (res.status === 200) this.recosList = res.data;
    }, (err: any) => { console.log(err) });
  }

  GetPatients() {
    this.api.GetPatients().subscribe((res: { status: number, data: any }) => {
      if (res.status === 200) { }
    }, (err: any) => { console.log(err) });
  }

  containsOrgUnits(cible: 'countries' | 'regions' | 'prefectures' | 'communes' | 'hospitals' | 'districtQuartiers' | 'villageSecteurs', elemId: string): boolean {
    if (cible === 'countries') {
      const ok0 = ((this.countries ?? []).map(c => c.id)).includes(elemId);
      const vL = (this.regions ?? []).map(r => r.country_id);
      const ok1 = vL.includes(elemId);
      const ok2 = this.generateRegions(elemId).length === vL.length;
      return ok0 || ok1 && ok2;
    }
    if (cible === 'regions') {
      const ok0 = ((this.regions ?? []).map(c => c.id)).includes(elemId);
      const vL = (this.prefectures ?? []).map(r => r.region_id);
      const ok1 = vL.includes(elemId);
      const ok2 = this.generatePrefectures(elemId).length === vL.length;
      return ok0 || ok1 && ok2;

    }
    if (cible === 'prefectures') {
      const ok0 = ((this.prefectures ?? []).map(c => c.id)).includes(elemId);
      const vL = (this.communes ?? []).map(r => r.prefecture_id);
      const ok1 = vL.includes(elemId);
      const ok2 = this.generateCommunes(elemId).length === vL.length;
      return ok0 || ok1 && ok2;
    }
    if (cible === 'communes') {
      const ok0 = ((this.communes ?? []).map(c => c.id)).includes(elemId);
      const vL = (this.hospitals ?? []).map(r => r.commune_id);
      const ok1 = vL.includes(elemId);
      const ok2 = this.generateHospitals(elemId).length === vL.length;
      return ok0 || ok1 && ok2;
    }
    if (cible === 'hospitals') {
      const ok0 = ((this.hospitals ?? []).map(c => c.id)).includes(elemId);
      const vL = (this.districtQuartiers ?? []).map(r => r.hospital_id);
      const ok1 = vL.includes(elemId);
      const ok2 = this.generateDistrictQuartiers(elemId).length === vL.length;
      return ok0 || ok1 && ok2;
    }
    if (cible === 'districtQuartiers') {
      const ok0 = ((this.districtQuartiers ?? []).map(c => c.id)).includes(elemId);
      const vL = (this.villageSecteurs ?? []).map(r => r.district_quartier_id);
      const ok1 = vL.includes(elemId);
      const ok2 = this.generateVillageSecteurs(elemId).length === vL.length;
      return ok0 || ok1 && ok2;
    }
    if (cible === 'villageSecteurs') {
      const ok0 = ((this.villageSecteurs ?? []).map(c => c.id)).includes(elemId);
      return ok0
    }
    return false;
  }


  generateRegions(countryId: string) {
    return this.regionsList.filter(d => countryId === d.country_id);
  }
  generatePrefectures(regionId: string) {
    return this.prefecturesList.filter(d => regionId === d.region_id);
  }
  generateCommunes(prefectureId: string) {
    return this.communesList.filter(d => prefectureId === d.prefecture_id);
  }
  generateHospitals(communeId: string) {
    return this.hospitalsList.filter(d => communeId === d.commune_id);
  }
  generateDistrictQuartiers(hospitalId: string) {
    return this.districtQuartiersList.filter(d => hospitalId === d.hospital_id);
  }
  generateVillageSecteurs(districtQuartierId: string) {
    return this.villageSecteursList.filter(d => districtQuartierId === d.district_quartier_id);
  }


  closeAddOrUpdateModalVisible() {
    this.addOrUpdateModalVisible = false;
  }

  openAddOrUpdateModalVisible() {
    this.addOrUpdateModalVisible = true;
  }


  selectCountries(country: CountryCoustomQuery) {
    const index = this.findObj(this.countries, country).index;
    if (index !== -1) {
      this.countries.splice(index, 1);
      this.regions = this.regions.filter(r => r.country_id !== country.id);
      this.prefectures = this.prefectures.filter(r => r.country_id !== country.id),
        this.communes = this.communes.filter(r => r.country_id !== country.id);
      this.hospitals = this.hospitals.filter(r => r.country_id !== country.id);
      this.districtQuartiers = this.districtQuartiers.filter(r => r.country_id !== country.id);
      this.villageSecteurs = this.villageSecteurs.filter(r => r.country_id !== country.id);
    } else {
      this.countries.push(country);
      this.regions = [...this.regions.filter(r => r.country_id !== country.id), ...this.regionsList.filter(r => r.country_id === country.id)];
      this.prefectures = [...this.prefectures.filter(r => r.country_id !== country.id), ...this.prefecturesList.filter(r => r.country_id === country.id)];
      this.communes = [...this.communes.filter(r => r.country_id !== country.id), ...this.communesList.filter(r => r.country_id === country.id)];
      this.hospitals = [...this.hospitals.filter(r => r.country_id !== country.id), ...this.hospitalsList.filter(r => r.country_id === country.id)];
      this.districtQuartiers = [...this.districtQuartiers.filter(r => r.country_id !== country.id), ...this.districtQuartiersList.filter(r => r.country_id === country.id)];
      this.villageSecteurs = [...this.villageSecteurs.filter(r => r.country_id !== country.id), ...this.villageSecteursList.filter(r => r.country_id === country.id)];
    }
  }

  selectRegions(region: RegionCoustomQuery) {
    const index = this.findObj(this.regions, region).index;
    if (index !== -1) {
      this.regions.splice(index, 1);
      this.prefectures = this.prefectures.filter(r => r.region_id !== region.id),
        this.communes = this.communes.filter(r => r.region_id !== region.id);
      this.hospitals = this.hospitals.filter(r => r.region_id !== region.id);
      this.districtQuartiers = this.districtQuartiers.filter(r => r.region_id !== region.id);
      this.villageSecteurs = this.villageSecteurs.filter(r => r.region_id !== region.id);
    } else {
      this.regions.push(region);
      this.prefectures = [...this.prefectures.filter(r => r.region_id !== region.id), ...this.prefecturesList.filter(r => r.region_id === region.id)];
      this.communes = [...this.communes.filter(r => r.region_id !== region.id), ...this.communesList.filter(r => r.region_id === region.id)];
      this.hospitals = [...this.hospitals.filter(r => r.region_id !== region.id), ...this.hospitalsList.filter(r => r.region_id === region.id)];
      this.districtQuartiers = [...this.districtQuartiers.filter(r => r.region_id !== region.id), ...this.districtQuartiersList.filter(r => r.region_id === region.id)];
      this.villageSecteurs = [...this.villageSecteurs.filter(r => r.region_id !== region.id), ...this.villageSecteursList.filter(r => r.country_id === region.id)];
    }
  }

  selectPrefectures(prefecture: PrefectureCoustomQuery) {
    const index = this.findObj(this.prefectures, prefecture).index;
    if (index !== -1) {
      this.prefectures.splice(index, 1);
      this.communes = this.communes.filter(r => r.prefecture_id !== prefecture.id);
      this.hospitals = this.hospitals.filter(r => r.prefecture_id !== prefecture.id);
      this.districtQuartiers = this.districtQuartiers.filter(r => r.prefecture_id !== prefecture.id);
      this.villageSecteurs = this.villageSecteurs.filter(r => r.prefecture_id !== prefecture.id);
    } else {
      this.prefectures.push(prefecture);
      this.communes = [...this.communes.filter(r => r.prefecture_id !== prefecture.id), ...this.communesList.filter(r => r.prefecture_id === prefecture.id)];
      this.hospitals = [...this.hospitals.filter(r => r.prefecture_id !== prefecture.id), ...this.hospitalsList.filter(r => r.prefecture_id === prefecture.id)];
      this.districtQuartiers = [...this.districtQuartiers.filter(r => r.prefecture_id !== prefecture.id), ...this.districtQuartiersList.filter(r => r.prefecture_id === prefecture.id)];
      this.villageSecteurs = [...this.villageSecteurs.filter(r => r.prefecture_id !== prefecture.id), ...this.villageSecteursList.filter(r => r.prefecture_id === prefecture.id)];
    }
  }

  selectCommunes(commune: CommuneCoustomQuery) {
    const index = this.findObj(this.communes, commune).index;
    if (index !== -1) {
      this.communes.splice(index, 1);
      this.hospitals = this.hospitals.filter(r => r.commune_id !== commune.id);
      this.districtQuartiers = this.districtQuartiers.filter(r => r.commune_id !== commune.id);
      this.villageSecteurs = this.villageSecteurs.filter(r => r.commune_id !== commune.id);
    } else {
      this.communes.push(commune);
      this.hospitals = [...this.hospitals.filter(r => r.commune_id !== commune.id), ...this.hospitalsList.filter(r => r.commune_id === commune.id)];
      this.districtQuartiers = [...this.districtQuartiers.filter(r => r.commune_id !== commune.id), ...this.districtQuartiersList.filter(r => r.commune_id === commune.id)];
      this.villageSecteurs = [...this.villageSecteurs.filter(r => r.commune_id !== commune.id), ...this.villageSecteursList.filter(r => r.commune_id === commune.id)];
    }
  }

  selectHospitals(hospital: HospitalCoustomQuery) {
    const index = this.findObj(this.hospitals, hospital).index;
    if (index !== -1) {
      this.hospitals.splice(index, 1);
      this.districtQuartiers = this.districtQuartiers.filter(r => r.hospital_id !== hospital.id);
      this.villageSecteurs = this.villageSecteurs.filter(r => r.hospital_id !== hospital.id);
    } else {
      this.hospitals.push(hospital);
      this.districtQuartiers = [...this.districtQuartiers.filter(r => r.hospital_id !== hospital.id), ...this.districtQuartiersList.filter(r => r.hospital_id === hospital.id)];
      this.villageSecteurs = [...this.villageSecteurs.filter(r => r.hospital_id !== hospital.id), ...this.villageSecteursList.filter(r => r.hospital_id === hospital.id)];
    }
  }

  selectDistrictQuartiers(districtQuartier: DistrictQuartierCoustomQuery) {
    const index = this.findObj(this.districtQuartiers, districtQuartier).index;
    if (index !== -1) {
      this.districtQuartiers.splice(index, 1);
      this.villageSecteurs = this.villageSecteurs.filter(r => r.district_quartier_id !== districtQuartier.id);
    } else {
      this.districtQuartiers.push(districtQuartier);
      this.villageSecteurs = [...this.villageSecteurs.filter(r => r.district_quartier_id !== districtQuartier.id), ...this.villageSecteursList.filter(r => r.district_quartier_id === districtQuartier.id)];
    }
  }

  selectVillageSecteurs(villageSecteur: VillageSecteurCoustomQuery) {
    const index = this.findObj(this.villageSecteurs, villageSecteur).index;
    if (index !== -1) {
      this.villageSecteurs.splice(index, 1);
    } else {
      this.villageSecteurs.push(villageSecteur);
    }
  }


  findObj<T>(objs: T[], obj: T): { found: T | undefined, index: number } {
    const [found, index] = (() => {
      let foundIndex = -1;
      const foundObject = objs.find((dt, idx) => {
        if ((dt as any).id === (obj as any).id) {
          foundIndex = idx;
          return true;
        }
        return false;
      });
      return [foundObject, foundIndex];
    })();
    return { found: found, index: index }
  }

  EditUser(user: AdminUser) {
    this.updateForm = this.updateFormGroup(user);
    this.selectedRole = user.roleIds;//this.rolesIds(user);
    this.selectedUser = user;
    this.countries = user.countries;
    this.regions = user.regions;
    this.prefectures = user.prefectures;
    this.communes = user.communes;
    this.hospitals = user.hospitals;
    this.districtQuartiers = user.districtQuartiers;
    this.villageSecteurs = user.villageSecteurs;
    this.isEditMode = true;
    this.openAddOrUpdateModalVisible();
  }

  EditPassword(user: AdminUser) {
    this.updateForm = this.updatePasswordFormGroup(user);
    this.selectedUser = user;
  }

  SelectUser(user: AdminUser) {
    this.selectedUser = user;
  }

  CreateUser() {
    this.registerForm = this.registerFormGroup();
    this.selectedRole = [];
    this.selectedUser = null;
    this.countries = [];
    this.regions = [];
    this.prefectures = [];
    this.communes = [];
    this.hospitals = [];
    this.districtQuartiers = [];
    this.villageSecteurs = [];
    this.isEditMode = false;
    this.openAddOrUpdateModalVisible();
  }

  registerFormGroup(): FormGroup {
    const formControls = {
      username: new FormControl('', [Validators.required, Validators.minLength(4)]),
      fullname: new FormControl(''),
      email: new FormControl(''),
      password: new FormControl('', [Validators.required, Validators.minLength(8)]),
      passwordConfirm: new FormControl('', [Validators.required, Validators.minLength(8)]),
      isActive: new FormControl(false),
    };
    const validators = [this.MatchValidator('password', 'passwordConfirm', false)];
    return new FormGroup(formControls, validators);
  }

  updateFormGroup(user: AdminUser | null): FormGroup {
    const formControls = {
      username: new FormControl(user?.username ?? '', [Validators.required, Validators.minLength(4)]),
      fullname: new FormControl(user?.fullname ?? ''),
      email: new FormControl(user?.email ?? ''),
      password: new FormControl('', [Validators.minLength(8)]),
      passwordConfirm: new FormControl('', [Validators.minLength(8)]),
      isActive: new FormControl(user?.isActive == true),
    };
    if(this.USER?.isAdmin !== true) {
      formControls.username.disable();
    }
    return new FormGroup(formControls);
  }
  updatePasswordFormGroup(user: AdminUser | null): FormGroup {
    const formControls = {
      username: new FormControl(user?.username ?? '', [Validators.required, Validators.minLength(4)]),
      password: new FormControl('', [Validators.required, Validators.minLength(8)]),
      passwordConfirm: new FormControl('', [Validators.required, Validators.minLength(8)]),
    };
    const validators = [this.MatchValidator('password', 'passwordConfirm', true)];
    if(this.USER?.isAdmin !== true) {
      formControls.username.disable();
    }
    return new FormGroup(formControls, validators);
  }

  passwordMatchError(form: FormGroup): boolean {
    if (form) {
      return form.getError('password') && form.get('passwordConfirm')?.touched;
    }
    return true;
  }

  MatchValidator(source: string, target: string, isEditMode: boolean): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const sourceCtrl = control.get(source);
      const targetCtrl = control.get(target);
      if (sourceCtrl && targetCtrl) {
        if (sourceCtrl.value !== targetCtrl.value) {
          return { mismatch: true };
        }
        if (isEditMode) {
          if (notNull(sourceCtrl.value) && sourceCtrl.value.length < 8 || notNull(targetCtrl.value) && targetCtrl.value.length < 8) {
            return { mismatch: true };
          }
        }
      }
      return null;
    };
  }

  ToStringNewLine(value: string[]): string {
    return `${value}`.toString().replace(/,/g, '<br>');
  }

  ShowRoles(user: AdminUser) {
    this.selectedRole = this.rolesIds(user);
  }

  rolesIds(user: AdminUser): string[] {
    return (user.roles as Roles[]).filter(role => notNull(role?.id)).map(role => `${role.id}`);
  }

  register(): any {
    let msg = '';
    const pass = this.registerForm.value.password;
    const passCfm = this.registerForm.value.passwordConfirm;
    if (!((pass ?? '') != '' && (passCfm ?? '') != '' && pass == passCfm)) {
      msg = 'Password Error, is required';
      this.snackbar.show(msg, { backgroundColor: 'danger', duration: 5000 });
      this.message = msg;
      return
    }
    if (this.OrgUnitsIsEmpty() || this.RolesIsEmpty()) {
      msg = 'OrgUnits or Roles are Empty, they are required';
      this.snackbar.show(msg, { backgroundColor: 'danger', duration: 5000 });
      this.message = msg;
      return;
    }
    const dataToRegister: any = {
      username: this.registerForm.value.username,
      fullname: this.registerForm.value.fullname,
      email: this.registerForm.value.email,
      password: pass,
      isActive: this.registerForm.value.isActive === true,
      roles: this.selectedRole,
      countries: this.countries,
      regions: this.regions,
      prefectures: this.prefectures,
      communes: this.communes,
      hospitals: this.hospitals,
      districtQuartiers: this.districtQuartiers,
      villageSecteurs: this.villageSecteurs,
      chws: this.chwsList.filter(c => (this.districtQuartiers.map(d => d.id)).includes(c.district_quartier_id)),
      recos: this.recosList.filter(r => (this.villageSecteurs.map(v => v.id)).includes(r.village_secteur_id))
    }

    this.api.register(dataToRegister).subscribe((res: { status: number, data: any }) => {
      if (res.status === 200) {
        this.GetUsers();
        // const currentUser = this.userCtx.currentUserCtx;
        // const token = res.data;
        // const user = jwtDecode(token) as User;
        // if (currentUser && user && currentUser.id == user.id) {
        //   this.store.set({ db: DEFAULT_LOCAL_DB, name: 'token', value: token });
        // }
        this.selectedUser = null;
        this.selectedRole = [];
        this.closeAddOrUpdateModalVisible();
        return this.snackbar.show('Sauvegardé avec succès', { backgroundColor: 'success', duration: 3000 });
      } else {
        msg = res.data;
        this.snackbar.show(msg, { backgroundColor: 'danger', duration: 5000 });
        this.message = msg;
      }
    }, (err: any) => {
    });
  }

  update(): any {
    let msg: string = '';
    if (!this.selectedUser) {
      msg = 'User wasn\'t selected, please select one user';
      this.snackbar.show(msg, { backgroundColor: 'danger', duration: 5000 });
      this.message = msg;
      return;
    }
    const pass = this.updateForm.value.password;
    const passCfm = this.updateForm.value.passwordConfirm;
    const passIsNotEmpty = ((pass ?? '') != '' && (passCfm ?? '') != '') === true;
    if (passIsNotEmpty && pass !== passCfm) {
      msg = 'Password Error, must be the same';
      this.snackbar.show(msg, { backgroundColor: 'danger', duration: 5000 });
      this.message = msg;
      return
    }
    if (this.OrgUnitsIsEmpty() || this.RolesIsEmpty()) {
      msg = 'OrgUnits or Roles are Empty, they are required';
      this.snackbar.show(msg, { backgroundColor: 'danger', duration: 5000 });
      this.message = msg;
      return;
    }

    const dataToUpdate: any = {
      id: this.selectedUser.id,
      username: this.selectedUser.username,
      fullname: this.updateForm.value.fullname,
      email: this.updateForm.value.email,
      isActive: this.updateForm.value.isActive === true,
      roles: this.selectedRole,
      countries: this.countries,
      regions: this.regions,
      prefectures: this.prefectures,
      communes: this.communes,
      hospitals: this.hospitals,
      districtQuartiers: this.districtQuartiers,
      villageSecteurs: this.villageSecteurs,
      chws: this.chwsList.filter(c => (this.districtQuartiers.map(d => d.id)).includes(c.district_quartier_id)),
      recos: this.recosList.filter(r => (this.villageSecteurs.map(v => v.id)).includes(r.village_secteur_id))
    };
    if (passIsNotEmpty) {
      dataToUpdate['password'] = pass;
    }

    this.api.updateUser(dataToUpdate).subscribe((res: { status: number, data: any }) => {
      if (res.status === 200) {
        this.GetUsers();
        // const currentUser = this.userCtx.currentUserCtx;
        // const token = res.data;
        // const user = jwtDecode(token) as User;
        // if (currentUser && user && currentUser.id == user.id) {
        //   this.store.set({ db: DEFAULT_LOCAL_DB, name: 'token', value: token });
        // }
        this.selectedUser = null;
        this.selectedRole = [];
        this.closeAddOrUpdateModalVisible();
        return this.snackbar.show('Modifié avec succès', { backgroundColor: 'success', duration: 3000 });
      } else {
        msg = res.data;
        this.snackbar.show(msg, { backgroundColor: 'danger', duration: 5000 });
        this.message = msg;
      }
    }, (err: any) => {
    });
  }

  updatePassword(): any {
    const pass = this.updatePasswordForm.value.password;
    const passCfm = this.updatePasswordForm.value.passwordConfirm;
    if ((pass ?? '') != '' && (passCfm ?? '') != '' && pass == passCfm && this.selectedUser) {
      const fuser: any = this.selectedUser;
      fuser['password'] = pass;
      this.api.updatePassword(fuser).subscribe((res: { status: number, data: any }) => {
        if (res.status === 200) {
          this.GetUsers();
          this.selectedUser = null;
          this.selectedRole = [];
        } else {
        }
      }, (err: any) => {
      });
    }
  }

  delete() {
    const user = this.userCtx.currentUserCtx;
    if (this.selectedUser && user && this.selectedUser.id != user.id) {
      this.api.deleteUser(this.selectedUser).subscribe((res: { status: number, data: any }) => {
        if (res.status === 200) {
          this.GetUsers();
          this.selectedUser = null;
          this.selectedRole = [];
        } else {
        }
      }, (err: any) => {
      });
    }
  }

  containsRole(role: number): boolean {
    return this.selectedRole.includes(`${role}`);
  }

  AddOrRemoveRole(role: number) {
    const index = this.selectedRole.indexOf(`${role}`);
    if (index !== -1) {
      this.selectedRole.splice(index, 1);
    } else {
      this.selectedRole.push(`${role}`);
    }
  }

  SelectRoles() {
    if (this.selectedRole.length == this.roles$.length) {
      this.selectedRole = [];
    } else {
      this.selectedRole = this.roles$
        .filter(role => notNull(role?.id))
        .map(role => role?.id ? `${role?.id}` : '');
    }
  }
}
