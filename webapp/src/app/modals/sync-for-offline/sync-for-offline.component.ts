import { AfterViewInit, Component, HostListener, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { DbSyncService } from '@kossi-services/db-sync.service';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { SnackbarService } from '@kossi-services/snackbar.service';
import { AuthService } from '@kossi-src/app/services/auth.service';
import { currentYear, currentMonth, getMonthsList, getYearsList, notNull, toArray } from '@kossi-src/app/utils/functions';
import { CountryCoustomQuery, RegionCoustomQuery, PrefectureCoustomQuery, CommuneCoustomQuery, HospitalCoustomQuery, DistrictQuartierCoustomQuery, VillageSecteurCoustomQuery, ChwCoustomQuery, RecoCoustomQuery } from '@kossi-models/org-units';
import { LocalDbDataFetchService } from '@kossi-services/local-db-data-fetch.service';
import { UrlTrackerService } from '@kossi-services/url-tracker.service';
import { UserContextService } from '@kossi-services/user-context.service';

@Component({
  selector: 'sync-for-offline-confirm-modal',
  templateUrl: './sync-for-offline.component.html',
  styleUrl: './sync-for-offline.component.css'
})
export class SyncForOfflineConfirmComponent implements OnInit, AfterViewInit{
  _formGroup!: FormGroup;
  Months$: { labelEN: string; labelFR: string; id: string; uid: number }[] = [];
  Years$: number[] = [];
  month$!: { labelEN: string; labelFR: string; id: string; uid: number };
  year$!: number;
  data_syncing: boolean = false;
  errorMessage:string|null = null;

  screenWidth: number;
  COLUMN_WIDTH: number;

  Countries$: CountryCoustomQuery[] = [];
  Regions$: RegionCoustomQuery[] = [];
  Prefectures$: PrefectureCoustomQuery[] = [];
  Communes$: CommuneCoustomQuery[] = [];
  Hospitals$: HospitalCoustomQuery[] = [];
  DistrictQuartiers$: DistrictQuartierCoustomQuery[] = [];
  VillageSecteurs$: VillageSecteurCoustomQuery[] = [];
  Chws$: ChwCoustomQuery[] = [];
  Recos$: RecoCoustomQuery[] = [];


  countries: CountryCoustomQuery[] = [];
  regions: RegionCoustomQuery[] = [];
  prefectures: PrefectureCoustomQuery[] = [];
  communes: CommuneCoustomQuery[] = [];
  hospitals: HospitalCoustomQuery[] = [];
  districtQuartiers: DistrictQuartierCoustomQuery[] = [];
  villageSecteurs: VillageSecteurCoustomQuery[] = [];
  chws: ChwCoustomQuery[] = [];
  recos: RecoCoustomQuery[] = [];

  // private auth: AuthService,   private snackbar: SnackbarService

  constructor(public bsModalRef: BsModalRef, private db: DbSyncService, private urlT: UrlTrackerService, private ldbfetch: LocalDbDataFetchService, private userCtx: UserContextService, private auth: AuthService, private snackbar: SnackbarService) {
    this.screenWidth = window.innerWidth;
    this.COLUMN_WIDTH = (window.innerWidth - 600) / 4;
    this.getCurrentUserCtx();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.countriesGenerate();
      this.regionsGenerate();
      this.prefecturesGenerate();
      this.communesGenerate();
      this.hospitalsGenerate();
      this.districtsGenerate();
      //  this.villagesGenerate();
      //  this.chwsGenerate();
      this.recosGenerate();
    });
  }


  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.screenWidth = window.innerWidth;
  }

  ngOnInit(): void {
    this.year$ = currentYear();
    this.month$ = currentMonth();
    this.Months$ = getMonthsList().filter(m => this.month$ && m.uid <= this.month$.uid);
    this.Years$ = getYearsList().filter(y => this.year$ && y <= this.year$);
    this._formGroup = this.CreateFormGroup();
  }

  getCurrentUserCtx() {
    const user = this.userCtx.currentUserCtx;
    if (!(this.Countries$.length > 0)) this.Countries$ = user?.countries ?? [];
    if (!(this.Regions$.length > 0)) this.Regions$ = user?.regions ?? [];
    if (!(this.Prefectures$.length > 0)) this.Prefectures$ = user?.prefectures ?? [];
    if (!(this.Communes$.length > 0)) this.Communes$ = user?.communes ?? [];
    if (!(this.Hospitals$.length > 0)) this.Hospitals$ = user?.hospitals ?? [];
    if (!(this.DistrictQuartiers$.length > 0)) this.DistrictQuartiers$ = user?.districtQuartiers ?? [];
    if (!(this.VillageSecteurs$.length > 0)) this.VillageSecteurs$ = user?.villageSecteurs ?? [];
    if (!(this.Chws$.length > 0)) this.Chws$ = user?.chws ?? [];
    if (!(this.Recos$.length > 0)) this.Recos$ = user?.recos ?? [];
  }

  CreateFormGroup(): FormGroup {
    const form: any = {
      year: new FormControl(this.year$, [Validators.required]),
      months: new FormControl(this.month$.id, [Validators.required]),
      // recos: new FormControl(["e5a66e69-b316-4a46-8539-226ee3f4d289"], [Validators.required]),
    };

    if (this.Countries$.length > 1) form['country'] = new FormControl('', [Validators.required]);
    if (this.Regions$.length > 1) form['region'] = new FormControl('', [Validators.required]);
    if (this.Prefectures$.length > 1) form['prefecture'] = new FormControl('', [Validators.required]);
    if (this.Communes$.length > 1) form['commune'] = new FormControl('', [Validators.required]);
    if (this.Hospitals$.length > 1) form['hospital'] = new FormControl('', [Validators.required]);
    if (this.DistrictQuartiers$.length > 1) form['district_quartier'] = new FormControl('', [Validators.required]);
    if (this.Recos$.length > 1) form['recos'] = new FormControl('', [Validators.required]);
    return new FormGroup(form);
  }

  isSelected(data: string | number, type: 'year' | 'month' | 'country' | 'region' | 'prefecture' | 'commune' | 'hospital' | 'district_quartier' | 'recos'): boolean {
    if (type === 'year') return this._formGroup.value.year === data;
    if (type === 'month') return toArray(this._formGroup.value.months).includes(`${data}`);
    if (type === 'country') return this._formGroup.value.country === data;
    if (type === 'region') return this._formGroup.value.region === data;
    if (type === 'prefecture') return this._formGroup.value.prefecture === data;
    if (type === 'commune') return this._formGroup.value.commune === data;
    if (type === 'hospital') return this._formGroup.value.hospital === data;
    if (type === 'district_quartier') return this._formGroup.value.district_quartier === data;
    if (type === 'recos') return this._formGroup.value.recos.includes(`${data}`);
    return false;
  }

  // generate(cible:'region' | 'prefecture' | 'commune' | 'hospital' | 'district_quartier' | 'recos'): boolean {
  //   if (cible === 'region') return this._formGroup.value.region === data;
  //   if (cible === 'prefecture') return this._formGroup.value.prefecture === data;
  //   if (cible === 'commune') return this._formGroup.value.commune === data;
  //   if (cible === 'hospital') return this._formGroup.value.hospital === data;
  //   if (cible === 'district_quartier') return this._formGroup.value.district_quartier === data;
  //   if (cible === 'recos') return this._formGroup.value.recos.includes(`${data}`);
  //   return false;
  // }

  countriesGenerate() {
    this.countries = this.Countries$;
    if (this.Countries$.length === 1) {
      this._formGroup.value['country'] = this.Countries$[0].id;
    }
  }
  regionsGenerate() {
    if (this.Countries$.length > 0) {
      if (this.Regions$.length > 1 && notNull(this._formGroup.value.country)) {
        this.regions = this.Regions$.filter(d => d.country_id === this._formGroup.value.country);
      } else if (this.Regions$.length === 1) {
        this.regions = this.Regions$;
        this._formGroup.value['region'] = this.Regions$[0].id;
      } else {
        this.regions = [];
      }
    } else if (this.Regions$.length >= 1) {
      this.regions = this.Regions$;
      if (this.Regions$.length === 1) {
        this._formGroup.value['region'] = this.Regions$[0].id;
      }
    } else {
      this.regions = [];
    }

  }
  prefecturesGenerate() {
    if (this.Regions$.length > 0) {
      if (this.Prefectures$.length > 1 && notNull(this._formGroup.value.region)) {
        this.prefectures = this.Prefectures$.filter(d => d.region_id === this._formGroup.value.region);
      } else if (this.Prefectures$.length === 1) {
        this.prefectures = this.Prefectures$;
        this._formGroup.value['prefecture'] = this.Prefectures$[0].id;
      } else {
        this.prefectures = [];
      }
    } else if (this.Prefectures$.length >= 1) {
      this.prefectures = this.Prefectures$;
      if (this.Prefectures$.length === 1) {
        this._formGroup.value['prefecture'] = this.Prefectures$[0].id;
      }
    } else {
      this.prefectures = [];
    }
  }
  communesGenerate() {
    if (this.Prefectures$.length > 0) {
      if (this.Communes$.length > 1 && notNull(this._formGroup.value.prefecture)) {
        this.communes = this.Communes$.filter(d => d.prefecture_id === this._formGroup.value.prefecture);
      } else if (this.Communes$.length === 1) {
        this.communes = this.Communes$;
        this._formGroup.value['commune'] = this.Communes$[0].id;
      } else {
        this.communes = [];
      }
    } else if (this.Communes$.length >= 1) {
      this.communes = this.Communes$;
      if (this.Communes$.length === 1) {
        this._formGroup.value['commune'] = this.Communes$[0].id;
      }
    } else {
      this.communes = [];
    }
  }
  hospitalsGenerate() {
    if (this.Communes$.length > 0) {
      if (this.Hospitals$.length > 1 && notNull(this._formGroup.value.commune)) {
        this.hospitals = this.Hospitals$.filter(d => d.commune_id === this._formGroup.value.commune);
      } else if (this.Hospitals$.length === 1) {
        this.hospitals = this.Hospitals$;
        this._formGroup.value['hospital'] = this.Hospitals$[0].id;
      } else {
        this.hospitals = [];
      }
    } else if (this.Hospitals$.length >= 1) {
      this.hospitals = this.Hospitals$;
      if (this.Hospitals$.length === 1) {
        this._formGroup.value['hospital'] = this.Hospitals$[0].id;
      }
    } else {
      this.hospitals = [];
    }
  }
  districtsGenerate() {
    if (this.Hospitals$.length > 0) {
      if (this.DistrictQuartiers$.length > 1 && notNull(this._formGroup.value.hospital)) {
        this.districtQuartiers = this.DistrictQuartiers$.filter(d => d.hospital_id === this._formGroup.value.hospital);
      } else if (this.DistrictQuartiers$.length === 1) {
        this.districtQuartiers = this.DistrictQuartiers$;
        this._formGroup.value['district_quartier'] = this.DistrictQuartiers$[0].id;
      } else {
        this.districtQuartiers = [];
      }
    } else if (this.DistrictQuartiers$.length >= 1) {
      this.districtQuartiers = this.DistrictQuartiers$;
      if (this.DistrictQuartiers$.length === 1) {
        this._formGroup.value['district_quartier'] = this.DistrictQuartiers$[0].id;
      }
    } else {
      this.districtQuartiers = [];
    }
  }
  chwsGenerate() {
    if (this.DistrictQuartiers$.length > 0) {
      if (this.Chws$.length > 1 && notNull(this._formGroup.value.district_quartier)) {
        this.chws = this.Chws$.filter(d => d.district_quartier_id === this._formGroup.value.district_quartier);
      } else if (this.Chws$.length === 1) {
        this.chws = this.Chws$;
        this._formGroup.value['chw'] = this.Chws$[0].id;
      } else {
        this.chws = [];
      }
    } else if (this.Chws$.length >= 1) {
      this.chws = this.Chws$;
      if (this.Chws$.length === 1) {
        this._formGroup.value['chw'] = this.Chws$[0].id;
      }
    } else {
      this.chws = [];
    }
  }
  villagesGenerate() {
    if (this.DistrictQuartiers$.length > 0) {
      if (this.VillageSecteurs$.length > 1 && notNull(this._formGroup.value.district_quartier)) {
        this.villageSecteurs = this.VillageSecteurs$.filter(d => d.district_quartier_id === this._formGroup.value.district_quartier);
      } else if (this.VillageSecteurs$.length === 1) {
        this.villageSecteurs = this.VillageSecteurs$;
        this._formGroup.value['village_secteur'] = this.VillageSecteurs$[0].id;
      } else {
        this.villageSecteurs = [];
      }
      this.villageSecteurs = [];
    } else if (this.VillageSecteurs$.length >= 1) {
      this.villageSecteurs = this.VillageSecteurs$;
      if (this.VillageSecteurs$.length === 1) {
        this._formGroup.value['village_secteur'] = this.VillageSecteurs$[0].id;
      }
    } else {
      this.villageSecteurs = [];
    }
  }
  recosGenerate() {
    if (this.DistrictQuartiers$.length > 0) {
      if (this.Recos$.length > 1 && notNull(this._formGroup.value.district_quartier)) {
        this.recos = this.Recos$.filter(d => d.district_quartier_id === this._formGroup.value.district_quartier);
      } else if (this.Recos$.length === 1) {
        this.recos = this.Recos$;
        this._formGroup.value['recos'] = this.Recos$[0].id;
      } else {
        this.recos = [];
      }
    } else if (this.Recos$.length >= 1) {
      this.recos = this.Recos$;
      if (this.Recos$.length === 1) {
        this._formGroup.value['recos'] = this.Recos$[0].id;
      }
    } else {
      this.recos = [];
    }
  }

  close(){
    this.bsModalRef.hide();
  }

  async START_SYNC_FOR_OFFLINE(event: Event) {
    event.preventDefault();
    this.errorMessage = null;
    if (!(this._formGroup.value.recos.length > 0)) {
      this.errorMessage = 'You don\'t provide recos, please select reco!';
      return;
    }
    if (!(toArray(this._formGroup.value.months).length > 0)) {
      this.errorMessage = 'You don\'t provide month, please select month!';
      return;
    }
    if (!(this._formGroup.value.year > 0)) {
      this.errorMessage = 'You don\'t provide year, please select year!';
      return;
    }

    this.data_syncing = true;
    this._formGroup.value.months = toArray(this._formGroup.value.months);
    await this.db.all(this._formGroup.value).then(res =>{
      if (res === true) {
        this.close();
        this.data_syncing = false;
        this.snackbar.show('Tout a été synchronisé avec succès', { backgroundColor: 'success', duration: 5000 });
        return;
      }
      this.errorMessage = 'Erreur lors de la synchronisation';
      this.data_syncing = false;
      return;
    });
  }
}
