import { AfterViewInit, Component, HostListener, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ChwCoustomQuery, CommuneCoustomQuery, CountryCoustomQuery, DistrictQuartierCoustomQuery, HospitalCoustomQuery, PrefectureCoustomQuery, RecoCoustomQuery, RegionCoustomQuery, VillageSecteurCoustomQuery } from '@kossi-models/org-units';
import { ChwsRecoReport, IndicatorsDataOutput } from '@kossi-models/reports';
import { ApiService } from '@kossi-services/api.service';
import { AuthService } from '@kossi-services/auth.service';
import { LocalDbDataFetchService } from '@kossi-services/local-db-data-fetch.service';
import { SnackbarService } from '@kossi-services/snackbar.service';
import { UrlTrackerService } from '@kossi-services/url-tracker.service';
import { UserContextService } from '@kossi-services/user-context.service';
import { getYearsList, currentYear, currentMonth, getMonthsList, monthByArg, toArray, notNull } from '@kossi-src/app/utils/functions';

@Component({
  selector: 'chws-reco',
  templateUrl: './chw-reco-activity.component.html',
  styleUrl: './chw-reco-activity.component.css',
})
export class ChwRecoMonthlyActivityComponent implements OnInit, AfterViewInit {

  COMMUNE_NAME!: string;
  IRS_DSVCO_DE_NAME!: string;
  DPS_DCS_DE_NAME!: string;
  HEALTH_CENTER_NAME!: string;
  ASC_RECO_TYPE!: string;
  ASC_RECO_NAME!: string;
  ASC_RECO_PHONE!: string;
  MONTH!: string;
  YEAR!: number;

  IS_VALIDATE!:boolean

  MONTHLY_ACTIVITY$!: ChwsRecoReport | undefined;

  screenWidth: number;
  COLUMN_WIDTH: number;
  _formGroup!: FormGroup;
  Months$: { labelEN: string; labelFR: string; id: string; uid: number }[] = [];
  Years$: number[] = [];
  month$!: { labelEN: string; labelFR: string; id: string; uid: number };
  year$!: number;
  data_syncing: boolean = false;
  data_validation: boolean = false;


  // user!: User | null;

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

  constructor(private api: ApiService, private ldbfetch: LocalDbDataFetchService, private userCtx: UserContextService, private auth: AuthService, private snackbar: SnackbarService) {
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
    if (type === 'recos') return toArray(this._formGroup.value.recos).includes(`${data}`);
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
    if (this.Countries$.length === 1 || this.countries.length === 1) {
      this._formGroup.value['country'] = this.Countries$[0].id;
    }
    this.regionsGenerate();
  }
  regionsGenerate() {
    this.prefectures = [];
    this.communes = [];
    this.hospitals = [];
    this.districtQuartiers = [];
    this.chws = [];
    this.villageSecteurs = [];
    this.recos = [];
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

    if (this.regions.length === 1) {
      this._formGroup.value['region'] = this.regions[0].id;
    }
    this.prefecturesGenerate();
  }
  prefecturesGenerate() {
    this.communes = [];
    this.hospitals = [];
    this.districtQuartiers = [];
    this.chws = [];
    this.villageSecteurs = [];
    this.recos = [];
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
    if (this.prefectures.length === 1) {
      this._formGroup.value['prefecture'] = this.prefectures[0].id;
    }
    this.communesGenerate();
  }
  communesGenerate() {
    this.hospitals = [];
    this.districtQuartiers = [];
    this.chws = [];
    this.villageSecteurs = [];
    this.recos = [];
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
    if (this.communes.length === 1) {
      this._formGroup.value['commune'] = this.communes[0].id;
    }
    this.hospitalsGenerate();
  }
  hospitalsGenerate() {
    this.districtQuartiers = [];
    this.chws = [];
    this.villageSecteurs = [];
    this.recos = [];
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
    if (this.hospitals.length === 1) {
      this._formGroup.value['hospital'] = this.hospitals[0].id;
    }
    this.districtsGenerate();
  }
  districtsGenerate() {
    this.chws = [];
    this.villageSecteurs = [];
    this.recos = [];
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
    if (this.districtQuartiers.length === 1) {
      this._formGroup.value['district_quartier'] = this.districtQuartiers[0].id;
    }
    // this.chwsGenerate();
    // this.villagesGenerate();
    this.recosGenerate();
  }
  // chwsGenerate() {
  //   this.villageSecteurs = [];
  //   this.recos = [];
  //   if (this.DistrictQuartiers$.length > 0) {
  //     if (this.Chws$.length > 1 && notNull(this._formGroup.value.district_quartier)) {
  //       this.chws = this.Chws$.filter(d => d.district_quartier_id === this._formGroup.value.district_quartier);
  //     } else if (this.Chws$.length === 1) {
  //       this.chws = this.Chws$;
  //       this._formGroup.value['chw'] = this.Chws$[0].id;
  //     } else {
  //       this.chws = [];
  //     }
  //   } else if (this.Chws$.length >= 1) {
  //     this.chws = this.Chws$;
  //     if (this.Chws$.length === 1) {
  //       this._formGroup.value['chw'] = this.Chws$[0].id;
  //     }
  //   } else {
  //     this.chws = [];
  //   }
  //   if (this.chws.length === 1) {
  //     this._formGroup.value['chw'] = this.chws[0].id;
  //   }
  //   this.villagesGenerate();
  // }

  // villagesGenerate() {
  //   this.recos = [];
  //   if (this.DistrictQuartiers$.length > 0) {
  //     if (this.VillageSecteurs$.length > 1 && notNull(this._formGroup.value.district_quartier)) {
  //       this.villageSecteurs = this.VillageSecteurs$.filter(d => d.district_quartier_id === this._formGroup.value.district_quartier);
  //     } else if (this.VillageSecteurs$.length === 1) {
  //       this.villageSecteurs = this.VillageSecteurs$;
  //       this._formGroup.value['village_secteur'] = this.VillageSecteurs$[0].id;
  //     } else {
  //       this.villageSecteurs = [];
  //     }
  //     this.villageSecteurs = [];
  //   } else if (this.VillageSecteurs$.length >= 1) {
  //     this.villageSecteurs = this.VillageSecteurs$;
  //     if (this.VillageSecteurs$.length === 1) {
  //       this._formGroup.value['village_secteur'] = this.VillageSecteurs$[0].id;
  //     }
  //   } else {
  //     this.villageSecteurs = [];
  //   }
  //   if (this.villageSecteurs.length === 1) {
  //     this._formGroup.value['village_secteur'] = this.villageSecteurs[0].id;
  //   }
  //   this.recosGenerate();
  // }

  recosGenerate() {
    if (this.DistrictQuartiers$.length > 0) {
      if (this.Recos$.length > 1 && notNull(this._formGroup.value.district_quartier)) {
        this.recos = this.Recos$.filter(d => d.district_quartier_id === this._formGroup.value.district_quartier);
      } else if (this.Recos$.length === 1) {
        this.recos = this.Recos$;
      } else {
        this.recos = [];
      }
    } else if (this.Recos$.length >= 1) {
      this.recos = this.Recos$;
    } else {
      this.recos = [];
    }
    if (this.recos.length > 0) {
      this._formGroup.value['recos'] = this.recos.map(r => r.id);
    }
  }

  onCheckboxChange(id: string, event: Event) {
    // const checkbox = event.target as HTMLInputElement;
    const recos = toArray(this._formGroup.value['recos'] ?? []);

    const [found, index] = (() => {
      let foundIndex = -1;
      const foundObject = recos.find((dt, idx) => {
        if (dt === id) {
          foundIndex = idx;
          return true;
        }
        return false;
      });
      return [foundObject, foundIndex];
    })();
    if (index !== -1) {
      recos.splice(index, 1);
    } else {
      recos.push(id);
    }
    this._formGroup.value['recos'] = recos;
  }

  selectAllRecos() {
    if (this._formGroup.value.recos.length === this.recos.length) {
      this._formGroup.value['recos'] = [];
    } else {
      this._formGroup.value['recos'] = this.recos.map(r => r.id);
    }
  }

  validateData(event: Event) {
    event.preventDefault();
    this.data_validation = true;
    this.api.ValidateChwsRecoReports(this._formGroup.value).subscribe(async (_c$: { status: number, data: string }) => {
      if (_c$.status == 200) {
        this.snackbar.show('Validate successfuly', { backgroundColor: 'success', position: 'TOP' });
      }
      this.data_validation = false;
    }, (err: any) => {
      this.data_validation = false;
    });
  }



  SHOW_DATA(event: Event) {
    event.preventDefault();
    if (!(this._formGroup.value.recos.length > 0)) {
      this.snackbar.show('You don\'t provide recos, please select reco!', { backgroundColor: 'warning', position: 'TOP' });
      return;
    }
    if (!(toArray(this._formGroup.value.months).length > 0)) {
      this.snackbar.show('You don\'t provide month, please select month!', { backgroundColor: 'warning', position: 'TOP' });
      return;
    }

    if (!(this._formGroup.value.year > 0)) {
      this.snackbar.show('You don\'t provide year, please select year!', { backgroundColor: 'warning', position: 'TOP' });
      return;
    }

    this.data_syncing = true;
    this._formGroup.value.months = toArray(this._formGroup.value.months);
    this.ldbfetch.GetChwsRecoReports(this._formGroup.value).then((_res$: IndicatorsDataOutput<ChwsRecoReport> | undefined) => {
      this.IRS_DSVCO_DE_NAME = _res$?.region.name ?? '';
      this.ASC_RECO_TYPE = _res$?.reco_asc_type ?? '';
      this.ASC_RECO_NAME = (_res$?.reco_asc_type === 'RECO' ? (_res$?.reco?.name ?? '') : _res$?.chw.name) ?? '';
      this.ASC_RECO_PHONE = (_res$?.reco_asc_type === 'RECO' ? (_res$?.reco?.phone ?? '') : _res$?.chw.phone) ?? '';
      this.DPS_DCS_DE_NAME = _res$?.prefecture.name ?? '';
      this.COMMUNE_NAME = _res$?.commune.name ?? '';
      this.HEALTH_CENTER_NAME = _res$?.hospital.name ?? '';
      this.MONTH = toArray(this._formGroup.value.months).map((m: string) => monthByArg(m).labelFR).join(', ');
      this.YEAR = this._formGroup.value.year;
      this.IS_VALIDATE = _res$?.is_validate === true,
      this.MONTHLY_ACTIVITY$ = _res$?.data;
      if (!_res$) {
        this.snackbar.show('No data found for this RECO with informations you provide!\nYou can sync data from cloud and retry!', { backgroundColor: 'info', position: 'TOP', duration: 5000 });
      }
      this.data_syncing = false;

    }, (err: any) => {
      this.data_syncing = false;
    });
  }

}

