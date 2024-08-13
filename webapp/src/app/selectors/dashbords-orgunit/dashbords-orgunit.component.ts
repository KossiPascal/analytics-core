import { Component, Input, Output, EventEmitter, Attribute, AfterViewInit, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { CountryCoustomQuery, RegionCoustomQuery, PrefectureCoustomQuery, CommuneCoustomQuery, HospitalCoustomQuery, DistrictQuartierCoustomQuery, VillageSecteurCoustomQuery, ChwCoustomQuery, RecoCoustomQuery } from '@kossi-models/org-units';
import { UserContextService } from '@kossi-services/user-context.service';
import { currentYear, currentMonth, getMonthsList, getYearsList, toArray, notNull } from '@kossi-src/app/utils/functions';

@Component({
  selector: 'dashbords-orgunit-selector',
  templateUrl: './dashbords-orgunit.component.html',
  styleUrls: ['./dashbords-orgunit.component.css'],
})
export class DashbordsOrgunitSelectorComponent implements OnInit, AfterViewInit {
  @Attribute('id') id: any;
  @Input() ON_FETCHING!: boolean;
  @Output() ON_SHOW_DATA = new EventEmitter<FormGroup>();


  _formGroup!: FormGroup;

  Months$: { labelEN: string; labelFR: string; id: string; uid: number }[] = [];
  Years$: number[] = [];
  month$!: { labelEN: string; labelFR: string; id: string; uid: number };
  year$!: number;

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

  constructor(private userCtx: UserContextService) {
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
      this.recosGenerate();
    });
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

  countriesGenerate() {
    this.setOrgUnitsValues({ country:true, region:true, prefecture:true, commune:true, hospital:true, district_quartier:true, recos:true})
    this.countries = this.Countries$;
    if (this.countries.length === 1) {
      this._formGroup.value['country'] = this.countries[0].id;
    }
    this.regionsGenerate();
  }

  regionsGenerate() {
    this.setOrgUnitsValues({ region:true, prefecture:true, commune:true, hospital:true, district_quartier:true, recos:true})
    if (this.Countries$.length > 0) {
      if (this.Regions$.length > 1 && notNull(this._formGroup.value.country)) {
        this.regions = this.Regions$.filter(d => d.country_id === this._formGroup.value.country);
      } else if (this.Regions$.length === 1) {
        this.regions = this.Regions$;
      }
    } else if (this.Regions$.length >= 1) {
      this.regions = this.Regions$;
    }
    if (this.regions.length === 1) {
      this._formGroup.value['region'] = this.regions[0].id;
    }
    this.prefecturesGenerate();
  }

  prefecturesGenerate() {
    this.setOrgUnitsValues({ prefecture:true, commune:true, hospital:true, district_quartier:true, recos:true})
    if (this.Regions$.length > 0) {
      if (this.Prefectures$.length > 1 && notNull(this._formGroup.value.region)) {
        this.prefectures = this.Prefectures$.filter(d => d.region_id === this._formGroup.value.region);
      } else if (this.Prefectures$.length === 1) {
        this.prefectures = this.Prefectures$;
      }
    } else if (this.Prefectures$.length >= 1) {
      this.prefectures = this.Prefectures$;
    }
    if (this.prefectures.length === 1) {
      this._formGroup.value['prefecture'] = this.prefectures[0].id;
    }
    this.communesGenerate();
  }

  communesGenerate() {
    this.setOrgUnitsValues({ commune:true, hospital:true, district_quartier:true, recos:true})
    if (this.Prefectures$.length > 0) {
      if (this.Communes$.length > 1 && notNull(this._formGroup.value.prefecture)) {
        this.communes = this.Communes$.filter(d => d.prefecture_id === this._formGroup.value.prefecture);
      } else if (this.Communes$.length === 1) {
        this.communes = this.Communes$;
      }
    } else if (this.Communes$.length >= 1) {
      this.communes = this.Communes$;
    }
    if (this.communes.length === 1) {
      this._formGroup.value['commune'] = this.communes[0].id;
    }
    this.hospitalsGenerate();
  }

  hospitalsGenerate() {
    this.setOrgUnitsValues({ hospital:true, district_quartier:true, recos:true})
    if (this.Communes$.length > 0) {
      if (this.Hospitals$.length > 1 && notNull(this._formGroup.value.commune)) {
        this.hospitals = this.Hospitals$.filter(d => d.commune_id === this._formGroup.value.commune);
      } else if (this.Hospitals$.length === 1) {
        this.hospitals = this.Hospitals$;
      }
    } else if (this.Hospitals$.length >= 1) {
      this.hospitals = this.Hospitals$;
    }
    if (this.hospitals.length === 1) {
      this._formGroup.value['hospital'] = this.hospitals[0].id;
    }
    this.districtsGenerate();
  }

  districtsGenerate() {
    this.setOrgUnitsValues({ district_quartier:true, recos:true})
    if (this.Hospitals$.length > 0) {
      if (this.DistrictQuartiers$.length > 1 && notNull(this._formGroup.value.hospital)) {
        this.districtQuartiers = this.DistrictQuartiers$.filter(d => d.hospital_id === this._formGroup.value.hospital);
      } else if (this.DistrictQuartiers$.length === 1) {
        this.districtQuartiers = this.DistrictQuartiers$;
      }
    } else if (this.DistrictQuartiers$.length >= 1) {
      this.districtQuartiers = this.DistrictQuartiers$;
    }
    if (this.districtQuartiers.length === 1) {
      this._formGroup.value['district_quartier'] = this.districtQuartiers[0].id;
    }
    this.recosGenerate();
  }

  // chwsGenerate() {
  //   this.villageSecteurs = [];
  //   this.recos = [];
  //   this._formGroup.value['village_secteur'] = [];
  //   this._formGroup.value['recos'] = [];
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
  //   this._formGroup.value['recos'] = [];
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
    this.setOrgUnitsValues({ recos:true})
    if (this.DistrictQuartiers$.length > 0) {
      if (this.Recos$.length > 1 && notNull(this._formGroup.value.district_quartier)) {
        this.recos = this.Recos$.filter(d => d.district_quartier_id === this._formGroup.value.district_quartier);
      } else if (this.Recos$.length === 1) {
        this.recos = this.Recos$;
      }
    } else if (this.Recos$.length >= 1) {
      this.recos = this.Recos$;
    }
    if (this.recos.length === 1) {
      this._formGroup.value['recos'] = [this.recos[0].id];
    }
  }

  // onCheckboxChange(id: string, event: Event) {
  //   // const checkbox = event.target as HTMLInputElement;
  //   const recos = toArray(this._formGroup.value['recos'] ?? []);

  //   const [found, index] = (() => {
  //     let foundIndex = -1;
  //     const foundObject = recos.find((dt, idx) => {
  //       if (dt === id) {
  //         foundIndex = idx;
  //         return true;
  //       }
  //       return false;
  //     });
  //     return [foundObject, foundIndex];
  //   })();
  //   if (index !== -1) {
  //     recos.splice(index, 1);
  //   } else {
  //     recos.push(id);
  //   }
  //   this._formGroup.value['recos'] = recos;
  // }

  // selectAllRecos() {
  //   if (this._formGroup.value.recos.length === this.recos.length) {
  //     this._formGroup.value['recos'] = [];
  //   } else {
  //     this._formGroup.value['recos'] = this.recos.map(r => r.id);
  //   }
  // }


  private setOrgUnitsValues(dt: { country?: boolean, region?: boolean, prefecture?: boolean, commune?: boolean, hospital?: boolean, district_quartier?: boolean, recos: boolean }) {
    if (dt.country===true) {
      this.countries = [];
      this._formGroup.value['country'] = '';
    }
    if (dt.region===true) {
      this.regions = [];
      this._formGroup.value['region'] = '';
    }
    if (dt.prefecture===true) {
      this.prefectures = [];
      this._formGroup.value['prefecture'] = '';
    }
    if (dt.commune===true) {
      this.communes = [];
      this._formGroup.value['commune'] = '';
    }
    if (dt.hospital===true) {
      this.hospitals = [];
      this._formGroup.value['hospital'] = '';
    }
    if (dt.district_quartier===true) {
      this.districtQuartiers = [];
      this._formGroup.value['district_quartier'] = '';
    }
    if (dt.recos===true) {
      this.recos = [];
      this._formGroup.value['recos'] = [];
    }
  }

  SHOW_DATA(event: Event) {
    event.preventDefault();
    if (this.ON_SHOW_DATA) {
      this.ON_SHOW_DATA.emit(this._formGroup);
    }
  }
}
