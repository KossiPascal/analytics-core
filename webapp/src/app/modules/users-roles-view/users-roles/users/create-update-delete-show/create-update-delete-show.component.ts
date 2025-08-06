import { Component, Input, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { NewUserUtils } from '@kossi-models/interfaces';
import { CountryMap, RegionsMap, PrefecturesMap, CommunesMap, HospitalsMap, DistrictQuartiersMap, VillageSecteursMap } from '@kossi-models/org-unit-interface';
import { ApiService } from '@kossi-services/api.service';
import { ModalService } from '@kossi-services/modal.service';
import { UserContextService } from '@kossi-services/user-context.service';
import { User, Roles } from '@kossi-models/user-role';
import { ConstanteService } from '@kossi-src/app/services/constantes.service';
import { toTitleCase } from '@kossi-shared/functions';

@Component({
  standalone: false,
  selector: 'app-create-update-delete-users',
  templateUrl: `./create-update-delete-show.component.html`,
  styleUrls: ['./create-update-delete-show.component.css'],
})
export class CreateUpdateDeleteShowUserComponent implements OnInit {

  @Input() SELECTED_ROLE!: number[];
  @Input() SELECTED_USER!: User;

  // for show user roles
  @Input() IS_SHOW_ROLES!:boolean
  @Input() ROLES!: Roles[];


  // for delete user
  @Input() IS_DELETE_MODE!: boolean;
  

  // for create or update user
  @Input() IS_CREATE_OR_UPDATE!: boolean;
  @Input() ORGUNITS: NewUserUtils = {
    countries: [],
    regions: [],
    prefectures: [],
    communes: [],
    hospitals: [],
    districtQuartiers: [],
    villageSecteurs: [],
    chws: [],
    recos: [],
    user: null,
    roles: []
  }

  userForm!: FormGroup;

  isEditMode: boolean = false;
  isProcessing: boolean = false;

  APP_LOGO: string = '';

  countries: CountryMap[] = [];
  regions: RegionsMap[] = [];
  prefectures: PrefecturesMap[] = [];
  communes: CommunesMap[] = [];
  hospitals: HospitalsMap[] = [];
  districtQuartiers: DistrictQuartiersMap[] = [];
  villageSecteurs: VillageSecteursMap[] = [];

  showPassword: boolean = false;

  message!: string;

  visibleSection: string = 'info';

  private isToOpenList: { [key: string]: boolean } = {};

  constructor(private api: ApiService, private userCtx: UserContextService, private mService: ModalService, private cst: ConstanteService) {
    this.APP_LOGO = this.cst.APP_LOGO;

  }

  toggleSection(section: string) {
    this.visibleSection = this.visibleSection === section ? '' : section;
  }
  

  ngOnInit(): void {
    if (this.IS_CREATE_OR_UPDATE == true) {
      this.isEditMode = this.ORGUNITS.user != null;

      this.userForm = this.userFormGroup(this.ORGUNITS.user);

      this.SELECTED_ROLE = this.ORGUNITS.user?.rolesIds ?? [];
      // this.ROLES = this.ORGUNITS.roles ?? [];

      this.countries = this.ORGUNITS.user?.countries ?? [];
      this.regions = this.ORGUNITS.user?.regions ?? [];
      this.prefectures = this.ORGUNITS.user?.prefectures ?? [];
      this.communes = this.ORGUNITS.user?.communes ?? [];
      this.hospitals = this.ORGUNITS.user?.hospitals ?? [];
      this.districtQuartiers = this.ORGUNITS.user?.districtQuartiers ?? [];
      this.villageSecteurs = this.ORGUNITS.user?.villageSecteurs ?? [];
    }
  }


  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  isListOpenToShow(elmId: string): boolean {
    return this.isToOpenList[elmId] ?? false;
  }

  toggleList(elmId: string) {
    const cible = this.isToOpenList[elmId];
    this.isToOpenList[elmId] = !(cible === true);
  }

  orgUnitsIsEmpty(): boolean {
    const data = [
      ...(this.countries ?? []),
      ...(this.regions ?? []),
      ...(this.prefectures ?? []),
      ...(this.communes ?? []),
      ...(this.hospitals ?? []),
      ...(this.districtQuartiers ?? []),
      ...(this.villageSecteurs ?? [])
    ];
    return data.length === 0;
  }

  rolesIsEmpty(): boolean {
    return (this.SELECTED_ROLE ?? []).length === 0;
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
    return this.ORGUNITS.regions.filter((d: RegionsMap) => countryId === d.country_id);
  }
  generatePrefectures(regionId: string) {
    return this.ORGUNITS.prefectures.filter((d: PrefecturesMap) => regionId === d.region_id);
  }
  generateCommunes(prefectureId: string) {
    return this.ORGUNITS.communes.filter((d: CommunesMap) => prefectureId === d.prefecture_id);
  }
  generateHospitals(communeId: string) {
    return this.ORGUNITS.hospitals.filter((d: HospitalsMap) => communeId === d.commune_id);
  }
  generateDistrictQuartiers(hospitalId: string) {
    return this.ORGUNITS.districtQuartiers.filter((d: DistrictQuartiersMap) => hospitalId === d.hospital_id);
  }
  generateVillageSecteurs(districtQuartierId: string) {
    return this.ORGUNITS.villageSecteurs.filter((d: VillageSecteursMap) => districtQuartierId === d.district_quartier_id);
  }

  selectCountries(country: CountryMap) {
    const index = this.findObj(this.countries, country).index;
    if (index !== -1) {
      this.countries.splice(index, 1);
      this.regions = this.regions.filter(r => r.country_id !== country.id);
      this.prefectures = this.prefectures.filter(r => r.country_id !== country.id);
      this.communes = this.communes.filter(r => r.country_id !== country.id);
      this.hospitals = this.hospitals.filter(r => r.country_id !== country.id);
      this.districtQuartiers = this.districtQuartiers.filter(r => r.country_id !== country.id);
      this.villageSecteurs = this.villageSecteurs.filter(r => r.country_id !== country.id);
    } else {
      this.countries.push(country);
      this.regions = [...this.regions.filter(r => r.country_id !== country.id), ...this.ORGUNITS.regions.filter((r: RegionsMap) => r.country_id === country.id)];
      this.prefectures = [...this.prefectures.filter(r => r.country_id !== country.id), ...this.ORGUNITS.prefectures.filter((r: PrefecturesMap) => r.country_id === country.id)];
      this.communes = [...this.communes.filter(r => r.country_id !== country.id), ...this.ORGUNITS.communes.filter((r: CommunesMap) => r.country_id === country.id)];
      this.hospitals = [...this.hospitals.filter(r => r.country_id !== country.id), ...this.ORGUNITS.hospitals.filter((r: HospitalsMap) => r.country_id === country.id)];
      this.districtQuartiers = [...this.districtQuartiers.filter(r => r.country_id !== country.id), ...this.ORGUNITS.districtQuartiers.filter((r: DistrictQuartiersMap) => r.country_id === country.id)];
      this.villageSecteurs = [...this.villageSecteurs.filter(r => r.country_id !== country.id), ...this.ORGUNITS.villageSecteurs.filter((r: VillageSecteursMap) => r.country_id === country.id)];
    }
  }
  selectRegions(region: RegionsMap) {
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
      this.prefectures = [...this.prefectures.filter(r => r.region_id !== region.id), ...this.ORGUNITS.prefectures.filter((r: PrefecturesMap) => r.region_id === region.id)];
      this.communes = [...this.communes.filter(r => r.region_id !== region.id), ...this.ORGUNITS.communes.filter((r: CommunesMap) => r.region_id === region.id)];
      this.hospitals = [...this.hospitals.filter(r => r.region_id !== region.id), ...this.ORGUNITS.hospitals.filter((r: HospitalsMap) => r.region_id === region.id)];
      this.districtQuartiers = [...this.districtQuartiers.filter(r => r.region_id !== region.id), ...this.ORGUNITS.districtQuartiers.filter((r: DistrictQuartiersMap) => r.region_id === region.id)];
      this.villageSecteurs = [...this.villageSecteurs.filter(r => r.region_id !== region.id), ...this.ORGUNITS.villageSecteurs.filter((r: VillageSecteursMap) => r.country_id === region.id)];
    }
  }
  selectPrefectures(prefecture: PrefecturesMap) {
    const index = this.findObj(this.prefectures, prefecture).index;
    if (index !== -1) {
      this.prefectures.splice(index, 1);
      this.communes = this.communes.filter(r => r.prefecture_id !== prefecture.id);
      this.hospitals = this.hospitals.filter(r => r.prefecture_id !== prefecture.id);
      this.districtQuartiers = this.districtQuartiers.filter(r => r.prefecture_id !== prefecture.id);
      this.villageSecteurs = this.villageSecteurs.filter(r => r.prefecture_id !== prefecture.id);
    } else {
      this.prefectures.push(prefecture);
      this.communes = [...this.communes.filter(r => r.prefecture_id !== prefecture.id), ...this.ORGUNITS.communes.filter((r: CommunesMap) => r.prefecture_id === prefecture.id)];
      this.hospitals = [...this.hospitals.filter(r => r.prefecture_id !== prefecture.id), ...this.ORGUNITS.hospitals.filter((r: HospitalsMap) => r.prefecture_id === prefecture.id)];
      this.districtQuartiers = [...this.districtQuartiers.filter(r => r.prefecture_id !== prefecture.id), ...this.ORGUNITS.districtQuartiers.filter((r: DistrictQuartiersMap) => r.prefecture_id === prefecture.id)];
      this.villageSecteurs = [...this.villageSecteurs.filter(r => r.prefecture_id !== prefecture.id), ...this.ORGUNITS.villageSecteurs.filter((r: VillageSecteursMap) => r.prefecture_id === prefecture.id)];
    }
  }
  selectCommunes(commune: CommunesMap) {
    const index = this.findObj(this.communes, commune).index;
    if (index !== -1) {
      this.communes.splice(index, 1);
      this.hospitals = this.hospitals.filter(r => r.commune_id !== commune.id);
      this.districtQuartiers = this.districtQuartiers.filter(r => r.commune_id !== commune.id);
      this.villageSecteurs = this.villageSecteurs.filter(r => r.commune_id !== commune.id);
    } else {
      this.communes.push(commune);
      this.hospitals = [...this.hospitals.filter(r => r.commune_id !== commune.id), ...this.ORGUNITS.hospitals.filter((r: HospitalsMap) => r.commune_id === commune.id)];
      this.districtQuartiers = [...this.districtQuartiers.filter(r => r.commune_id !== commune.id), ...this.ORGUNITS.districtQuartiers.filter((r: DistrictQuartiersMap) => r.commune_id === commune.id)];
      this.villageSecteurs = [...this.villageSecteurs.filter(r => r.commune_id !== commune.id), ...this.ORGUNITS.villageSecteurs.filter((r: VillageSecteursMap) => r.commune_id === commune.id)];
    }
  }
  selectHospitals(hospital: HospitalsMap) {
    const index = this.findObj(this.hospitals, hospital).index;
    if (index !== -1) {
      this.hospitals.splice(index, 1);
      this.districtQuartiers = this.districtQuartiers.filter(r => r.hospital_id !== hospital.id);
      this.villageSecteurs = this.villageSecteurs.filter(r => r.hospital_id !== hospital.id);
    } else {
      this.hospitals.push(hospital);
      this.districtQuartiers = [...this.districtQuartiers.filter(r => r.hospital_id !== hospital.id), ...this.ORGUNITS.districtQuartiers.filter((r: DistrictQuartiersMap) => r.hospital_id === hospital.id)];
      this.villageSecteurs = [...this.villageSecteurs.filter(r => r.hospital_id !== hospital.id), ...this.ORGUNITS.villageSecteurs.filter((r: VillageSecteursMap) => r.hospital_id === hospital.id)];
    }
  }
  selectDistrictQuartiers(districtQuartier: DistrictQuartiersMap) {
    const index = this.findObj(this.districtQuartiers, districtQuartier).index;
    if (index !== -1) {
      this.districtQuartiers.splice(index, 1);
      this.villageSecteurs = this.villageSecteurs.filter(r => r.district_quartier_id !== districtQuartier.id);
    } else {
      this.districtQuartiers.push(districtQuartier);
      this.villageSecteurs = [...this.villageSecteurs.filter(r => r.district_quartier_id !== districtQuartier.id), ...this.ORGUNITS.villageSecteurs.filter((r: VillageSecteursMap) => r.district_quartier_id === districtQuartier.id)];
    }
  }
  selectVillageSecteurs(villageSecteur: VillageSecteursMap) {
    const index = this.findObj(this.villageSecteurs, villageSecteur).index;
    if (index !== -1) {
      this.villageSecteurs.splice(index, 1);
    } else {
      this.villageSecteurs.push(villageSecteur);
    }
  }

  userFormGroup(user?: User | null): FormGroup {
    const isExistingUser = !!user;
    // const isSuperUser = this.userCtx.currentUser?.isSuperUser === true;
    const username = user?.username ?? '';

    const formControls: { [key: string]: FormControl } = {
      username: new FormControl(
        { value: username, disabled: isExistingUser && username != '' },
        [Validators.required, Validators.minLength(4)]
      ),
      fullname: new FormControl(user?.fullname ?? ''),
      email: new FormControl(user?.email ?? ''),
      isActive: new FormControl(user?.isActive === true),
      password: new FormControl('', isExistingUser ? [Validators.minLength(8)] : [Validators.required, Validators.minLength(8)]),
      passwordConfirm: new FormControl('', isExistingUser ? [Validators.minLength(8)] : [Validators.required, Validators.minLength(8)]),
    };

    const validators = isExistingUser ? null : [this.matchValidator('password', 'passwordConfirm', 8)];

    return new FormGroup(formControls, validators);
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
  matchValidator(source: string, target: string, passwordMinLength: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const sourceCtrl = control.get(source);
      const targetCtrl = control.get(target);
      if (sourceCtrl && targetCtrl && sourceCtrl.value !== targetCtrl.value) {
        const isValidSource = sourceCtrl.value?.length >= passwordMinLength;
        const isValidTarget = targetCtrl.value?.length >= passwordMinLength;
        if (isValidSource && isValidTarget) {
          this.message = 'Les mots de passe ne sont pas identiques!'
        }
        return { mismatch: true };
      }
      return null;
    };
  }

  passwordMatchError(form: FormGroup): boolean {
    if (form) {
      return form.getError('password') && form.get('passwordConfirm')?.touched;
    }
    return true;
  }

  addOrRemoveRole(roleId: number) {
    const index = this.SELECTED_ROLE.indexOf(roleId);
    if (index !== -1) {
      this.SELECTED_ROLE.splice(index, 1);
    } else {
      this.SELECTED_ROLE.push(roleId);
    }
  }

  registerOrUpdate(): void {
    this.message = '';
    this.isProcessing = true;

    const password = this.userForm.value.password;
    const passwordConfirm = this.userForm.value.passwordConfirm;
    const isPasswordEmpty = !password?.trim();
    const isPasswordConfirmEmpty = !passwordConfirm?.trim();
    const isPasswordMismatch = !isPasswordEmpty && password !== passwordConfirm;

    if (this.isEditMode) {
      if ((password || passwordConfirm) && isPasswordMismatch) {
        this.message = 'Les mots de passe ne concordent pas. Effacez-les si vous ne souhaitez pas les modifier.';
        this.isProcessing = false;
        return;
      }
    } else {
      if (isPasswordEmpty) {
        this.message = 'Le mot de passe est obligatoire.';
        this.isProcessing = false;
        return;
      }
      if (isPasswordConfirmEmpty) {
        this.message = 'Veuillez confirmer le mot de passe.';
        this.isProcessing = false;
        return;
      }
      if (isPasswordMismatch) {
        this.message = 'Les mots de passe ne concordent pas.';
        this.isProcessing = false;
        return;
      }
    }

    if (this.orgUnitsIsEmpty() || this.rolesIsEmpty()) {
      this.message = 'Les unités organisationnelles ou les rôles sont vides. Ils sont requis.';
      this.isProcessing = false;
      return;
    }

    const dataToSave: any = {
      id: this.ORGUNITS?.user?.id,
      username: this.ORGUNITS?.user?.username ?? this.userForm.value.username,
      fullname: this.userForm.value.fullname,
      email: this.userForm.value.email,
      password: isPasswordEmpty ? undefined : password,
      isActive: this.userForm.value.isActive === true,
      roles: this.SELECTED_ROLE,
      countries: this.countries,
      regions: this.regions,
      prefectures: this.prefectures,
      communes: this.communes,
      hospitals: this.hospitals,
      districtQuartiers: this.districtQuartiers,
      villageSecteurs: this.villageSecteurs,
      chws: this.ORGUNITS.chws.filter(c => this.districtQuartiers.some(d => d.id === c.district_quartier_id)),
      recos: this.ORGUNITS.recos.filter(r => this.villageSecteurs.some(v => v.id === r.village_secteur_id))
    };

    const apiActionToDo = this.ORGUNITS?.user ? this.api.updateUser(dataToSave) : this.api.register(dataToSave);

    apiActionToDo.subscribe((res: { status: number, data: any }) => {
      if (res.status === 200) {
        const actionType = this.ORGUNITS?.user ? { updated: true } : { registered: true };
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



  async delete() {
    this.message = '';
    this.isProcessing = true;
    const user = await this.userCtx.currentUser();
    if (this.SELECTED_USER && user && this.SELECTED_USER.id != user.id) {
      this.api.deleteUser(this.SELECTED_USER).subscribe((res: { status: number, data: any }) => {
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
      this.message = 'Vous ne pouvez supprimer cet utilisateur';
      this.isProcessing = false;
    }

  }




  containsRole(roleId: number): boolean {
    return this.SELECTED_ROLE.includes(roleId);
  }

  titleCase(input: string){
    return toTitleCase(input);
  }


}
