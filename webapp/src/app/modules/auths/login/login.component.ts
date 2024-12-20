import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { CountryMap, RegionsMap, PrefecturesMap, CommunesMap, HospitalsMap, DistrictQuartiersMap, VillageSecteursMap, ChwsMap, RecosMap } from '@kossi-models/org-unit-interface';
import { ApiService } from '@kossi-services/api.service';
import { UserContextService } from '@kossi-services/user-context.service';
import { AuthService } from '@kossi-src/app/services/auth.service';
import { AppStorageService } from '@kossi-src/app/services/local-storage.service';
import { DEFAULT_LOCAL_DB } from '@kossi-src/app/utils/const';

@Component({
  selector: 'app-login',
  templateUrl: `./login.component.html`,
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  message!: string;

  isLoading:boolean = false;


  constructor(private userCtx: UserContextService, private auth: AuthService, private api: ApiService, private store: AppStorageService) { }

  ngOnInit(): void {
    // this.auth.isAlreadyLogin;
    this.loginForm = this.createFormGroup();
  }

  createFormGroup(): FormGroup {
    return new FormGroup({
      credential: new FormControl("", [
        Validators.required,
        Validators.minLength(3),
      ]),
      password: new FormControl("", [
        Validators.required,
        Validators.minLength(4),
      ]),

      // rememberMe: new FormControl(false, []),
    });
  }

  login(): any {
    this.isLoading = true;
    return this.api.login(this.loginForm.value)
      .subscribe((res: {
        status: number, data: any,
        countries: CountryMap[],
        regions: RegionsMap[],
        prefectures: PrefecturesMap[],
        communes: CommunesMap[],
        hospitals: HospitalsMap[],
        districtQuartiers: DistrictQuartiersMap[],
        villageSecteurs: VillageSecteursMap[],
        chws: ChwsMap[],
        recos: RecosMap[]
      }) => {
        if (res.status === 200) {
          const token = res.data;
          this.store.set({ db: DEFAULT_LOCAL_DB, name: 'token', value: token });
          this.store.set({ db: DEFAULT_LOCAL_DB, name: 'countries', value: JSON.stringify(res.countries) });
          this.store.set({ db: DEFAULT_LOCAL_DB, name: 'regions', value: JSON.stringify(res.regions) });
          this.store.set({ db: DEFAULT_LOCAL_DB, name: 'prefectures', value: JSON.stringify(res.prefectures) });
          this.store.set({ db: DEFAULT_LOCAL_DB, name: 'communes', value: JSON.stringify(res.communes) });
          this.store.set({ db: DEFAULT_LOCAL_DB, name: 'hospitals', value: JSON.stringify(res.hospitals) });
          this.store.set({ db: DEFAULT_LOCAL_DB, name: 'districtQuartiers', value: JSON.stringify(res.districtQuartiers) });
          this.store.set({ db: DEFAULT_LOCAL_DB, name: 'villageSecteurs', value: JSON.stringify(res.villageSecteurs) });
          this.store.set({ db: DEFAULT_LOCAL_DB, name: 'chws', value: JSON.stringify(res.chws) });
          this.store.set({ db: DEFAULT_LOCAL_DB, name: 'recos', value: JSON.stringify(res.recos) });
          // const user = jwtDecode(token) as User;
          // this.router.navigate([user.defaultPageHref]);
          location.href = this.userCtx.defaultPage;
        } else {
          this.message = res.data;
        }
        this.isLoading = false;
        return;
      }, (err: any) => {
        this.message = err?.message;
        console.log(err);
        this.isLoading = false;
        return;
      });
  }
}
