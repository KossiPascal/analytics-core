import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { CountryMap, RegionsMap, PrefecturesMap, CommunesMap, HospitalsMap, DistrictQuartiersMap, VillageSecteursMap, ChwsMap, RecosMap } from '@kossi-models/org-unit-interface';
import { FamilyCustomQuery, FilterParams, PatientCustomQuery } from '@kossi-models/org-units';
import { ApiService } from '@kossi-services/api.service';
import { toArray } from '@kossi-shared/functions';


@Component({
  standalone: false,
  selector: 'app-admin-delete-couchdb',
  templateUrl: `./delete_couchdb_data.component.html`,

})
export class DeleteCouchdbDataComponent implements OnInit {
  responseMsg: string = '';
  _formGroup!: FormGroup;
  foundedDataToDelete: { id: string, rev: string, name?: string, form?: string, user: string, table: string }[] = []
  selectedListToBeDelete: { _deleted: boolean, _id: string, _rev: string, _table: string }[] = [];

  Countries$: CountryMap[] = [];
  Regions$: RegionsMap[] = [];
  Prefectures$: PrefecturesMap[] = [];
  Communes$: CommunesMap[] = [];
  Hospitals$: HospitalsMap[] = [];
  DistrictQuartiers$: DistrictQuartiersMap[] = [];
  VillageSecteurs$: VillageSecteursMap[] = [];
  Families$: FamilyCustomQuery[] = [];
  Chws$: ChwsMap[] = [];
  Recos$: RecosMap[] = [];
  Patients$: PatientCustomQuery[] = [];

  regions$: RegionsMap[] = [];
  prefectures$: PrefecturesMap[] = [];
  communes$: CommunesMap[] = [];
  hospitals$: HospitalsMap[] = [];
  districtQuartiers$: DistrictQuartiersMap[] = [];
  villageSecteurs$: VillageSecteursMap[] = [];
  families$: FamilyCustomQuery[] = [];
  chws$: ChwsMap[] = [];
  recos$: RecosMap[] = [];
  patients$: PatientCustomQuery[] = [];

  cibles$: { id:string, name:string, district_quartier_id:string, village_secteur_id:string }[] | { id:string, name:string, district_quartier_id:string }[] = [];

  types$: string[] = ['reco-data', 'patients', 'families', 'chws-data', 'mentors-data', 'dashboards', 'reports'];

  constMsg: string = "Loading...";
  initMsg: string = this.constMsg;

  isLoading!: boolean;

  constructor(private api: ApiService) { }

  dataListToDeleteFilterFormGroup(): FormGroup {
    return new FormGroup({
      start_date: new FormControl("", [Validators.required, Validators.minLength(7)]),
      end_date: new FormControl("", [Validators.required, Validators.minLength(7)]),
      countries: new FormControl([], [Validators.required]),
      regions: new FormControl([], [Validators.required]),
      prefectures: new FormControl([], [Validators.required]),
      communes: new FormControl([], [Validators.required]),
      hospitals: new FormControl([], [Validators.required]),
      district_quartiers: new FormControl([], [Validators.required]),
      // village_secteurs: new FormControl("", [Validators.required]),
      cible: new FormControl("", [Validators.required]),
      type: new FormControl("", [Validators.required]),
    });
  }

  ngOnInit(): void {
    this._formGroup = this.dataListToDeleteFilterFormGroup();
    this.initAllData();
  }

  async initAllData() {
    this.isLoading = true;
    this.initMsg = 'Chargement des Pays ...';
    this.api.GetCountries().subscribe(async (_ct$: { status: number, data: CountryMap[] }) => {
      if (_ct$.status == 200) this.Countries$ = _ct$.data;
      this.initMsg = 'Chargement des Regions ...';
      this.api.GetRegions().subscribe(async (_d$: { status: number, data: RegionsMap[] }) => {
        if (_d$.status == 200) this.Regions$ = _d$.data;
        this.initMsg = 'Chargement des Prefectures ...';
        this.api.GetPrefectures().subscribe(async (_p$: { status: number, data: PrefecturesMap[] }) => {
          if (_p$.status == 200) this.Prefectures$ = _p$.data;
          this.initMsg = 'Chargement des Communes ...';
          this.api.GetCommunes().subscribe(async (_c$: { status: number, data: CommunesMap[] }) => {
            if (_c$.status == 200) this.Communes$ = _c$.data;
            this.initMsg = 'Chargement des Hospitaux ...';
            this.api.GetHospitals().subscribe(async (_h$: { status: number, data: HospitalsMap[] }) => {
              if (_h$.status == 200) this.Hospitals$ = _h$.data;
              this.initMsg = 'Chargement des Districts/Quartiers ...';
              this.api.GetDistrictQuartiers().subscribe(async (_q$: { status: number, data: DistrictQuartiersMap[] }) => {
                if (_q$.status == 200) this.DistrictQuartiers$ = _q$.data;
                this.initMsg = 'Chargement des Villages/Secteurs ...';
                this.api.GetVillageSecteurs().subscribe(async (_v$: { status: number, data: VillageSecteursMap[] }) => {
                  if (_v$.status == 200) this.VillageSecteurs$ = _v$.data;
                  this.initMsg = 'Chargement des Familles ...';
                  this.api.GetFamilys().subscribe(async (_f$: { status: number, data: FamilyCustomQuery[] }) => {
                    if (_f$.status == 200) this.Families$ = _f$.data;
                    this.initMsg = 'Chargement des ASC ...';
                    this.api.GetChws().subscribe(async (_w$: { status: number, data: ChwsMap[] }) => {
                      if (_w$.status == 200) this.Chws$ = _w$.data;
                      this.initMsg = 'Chargement des Reco ...';
                      this.api.GetRecos().subscribe(async (_o$: { status: number, data: RecosMap[] }) => {
                        if (_o$.status == 200) this.Recos$ = _o$.data;
                        // this.initDataFilted();
                        this.isLoading = false;
                      }, (err: any) => {
                        this.isLoading = false;
                        console.log(err.error);
                      });
                    }, (err: any) => {
                      this.isLoading = false;
                      console.log(err.error);
                    });
                  }, (err: any) => {
                    this.isLoading = false;
                    console.log(err.error);
                  });
                }, (err: any) => {
                  this.isLoading = false;
                  console.log(err.error);
                });
              }, (err: any) => {
                this.isLoading = false;
                console.log(err.error);
              });
            }, (err: any) => {
              this.isLoading = false;
              console.log(err.error);
            });
          }, (err: any) => {
            this.isLoading = false;
            console.log(err.error);
          });
        }, (err: any) => {
          this.isLoading = false;
          console.log(err.error);
        });
      }, (err: any) => {
        this.isLoading = false;
        console.log(err.error);
      });
    }, (err: any) => {
      this.isLoading = false;
      console.log(err.error);
    });
  }

  SelectAllData() {
    if (this.selectedListToBeDelete.length == this.foundedDataToDelete.length) {
      this.selectedListToBeDelete = [];
    } else {
      this.selectedListToBeDelete = this.foundedDataToDelete.map(d => {
        return { _deleted: true, _id: d.id, _rev: d.rev, _table: d.table };
      });
    }
  }

  containsData(data: { id: string, rev: string, name?: string, form?: string, user: string, table: string }): boolean {
    const dt = this.selectedListToBeDelete.find(d => d._id === data.id);
    return dt !== undefined && dt !== null;
  }

  AddOrRemoveData(data: { id: string, rev: string, name?: string, form?: string, user: string, table: string }) {
    const [found, index] = (() => {
      let foundIndex = -1;
      const foundObject = this.selectedListToBeDelete.find((dt, idx) => {
        if (dt._id === data.id) {
          foundIndex = idx;
          return true;
        }
        return false;
      });
      return [foundObject, foundIndex];
    })();
    if (index !== -1) {
      this.selectedListToBeDelete.splice(index, 1);
    } else {
      this.selectedListToBeDelete.push({ _deleted: true, _id: data.id, _rev: data.rev, _table: data.table });
    }
  }

  getListOfDataToDeleteFromCouchDb() {
    this.initMsg = this.constMsg;
    this.isLoading = true;
    this.foundedDataToDelete = [];
    this.selectedListToBeDelete = [];
    this.responseMsg = '';
    const cibles = toArray(this._formGroup.value.cible);
    var recoVillageSecteur: string[] = [];

    if (['reco-data', 'patients', 'families'].includes(this._formGroup.value.type)) {
      recoVillageSecteur = (this.VillageSecteurs$.filter(v => cibles.includes(v.district_quartier_id))).map(v => v.id);
    }

    const param = {
      cible: [...cibles, ...recoVillageSecteur],
      type: this._formGroup.value.type,
      start_date: this._formGroup.value.start_date,
      end_date: this._formGroup.value.end_date
    };

    this.api.GetDataToDeleteFromCouchDb(param).subscribe(async (res: { status: number, data: any }) => {
      console.log(res)
      if (res.status == 200) {
        this.foundedDataToDelete = (res.data.reduce((unique: any[], r: any) => {
          if (r && !(unique.find(i => i.id === r.id))) {
            unique.push(r);
          }
          return unique;
        }, []));
        // for (let d = 0; d < this.foundedDataToDelete.length; d++) {
        //   const data = this.foundedDataToDelete[d];
        //   this.selectedListToBeDelete.push({ _deleted: true, _id: data.id, _rev: data.rev })
        // }
      } else {
        this.responseMsg = res.data;
      }
      this.isLoading = false;
    }, (err: any) => {
      console.log(err.error);
      this.isLoading = false;
      this.responseMsg = err.toString();
    });
  }

  deleteSelectedDataFromCouchDb() {
    this.initMsg = this.constMsg;
    this.responseMsg = '';
    if (this.selectedListToBeDelete.length > 0) {
      this.api.deleteDataFromCouchDb(this.selectedListToBeDelete, this._formGroup.value.type).subscribe(async (res: { status: number, data: any }) => {
        if (res.status == 200) {
          this.responseMsg = 'Done successfuly !';
          this.foundedDataToDelete = [];
          this.selectedListToBeDelete = [];
        } else {
          this.responseMsg = 'Problem with query, retry!';
        }
        // this.responseMsg = res.data.toString();
        // if (res.status == 200) console.log(res.data);
      }, (err: any) => {
        console.log(err);
        this.responseMsg = 'Error found when deleting ...';
        // this.responseMsg = err.toString();
      });
    } else {
      this.responseMsg = 'Not data provied!';
    }
  }

  ParamsToFilter(): FilterParams {
    const values: any = this._formGroup.value;
    var params: FilterParams = {
      start_date: values.start_date,
      end_date: values.end_date,
      countries: toArray(values.countries) as string[],
      regions: toArray(values.regions) as string[],
      prefectures: toArray(values.prefectures) as string[],
      communes: toArray(values.communes) as string[],
      hospitals: toArray(values.hospitals) as string[],
      district_quartiers: toArray(values.district_quartiers) as string[],
      village_secteurs: toArray(values.village_secteurs) as string[],
      families: toArray(values.families) as string[],
      chws: toArray(values.chws) as string[],
      recos: toArray(values.recos) as string[],
      patients: toArray(values.patients) as string[],
      type: values.type
    }
    return params;
  }

  genarateRegions() {
    this.regions$ = [];
    this.prefectures$ = [];
    this.communes$ = [];
    this.hospitals$ = [];
    this.districtQuartiers$ = [];
    this.villageSecteurs$ = [];
    this.families$ = [];
    this.chws$ = [];
    this.recos$ = [];
    this.patients$ = [];
    this._formGroup.value.regions = [];
    this._formGroup.value.prefectures = [];
    this._formGroup.value.communes = [];
    this._formGroup.value.hospitals = [];
    this._formGroup.value.district_quartiers = [];
    this._formGroup.value.village_secteurs = [];
    this._formGroup.value.families = [];
    this._formGroup.value.chws = [];
    this._formGroup.value.recos = [];
    this._formGroup.value.patients = [];
    const countries: string[] = this.Countries$.map(ct => ct.id);
    this.regions$ = this.Regions$.filter(r => countries.includes(r.country_id));
  }

  genaratePrefectures() {
    this.prefectures$ = [];
    this.communes$ = [];
    this.hospitals$ = [];
    this.districtQuartiers$ = [];
    this.villageSecteurs$ = [];
    this.families$ = [];
    this.chws$ = [];
    this.recos$ = [];
    this.patients$ = [];
    this._formGroup.value.prefectures = [];
    this._formGroup.value.communes = [];
    this._formGroup.value.hospitals = [];
    this._formGroup.value.district_quartiers = [];
    this._formGroup.value.village_secteurs = [];
    this._formGroup.value.families = [];
    this._formGroup.value.chws = [];
    this._formGroup.value.recos = [];
    this._formGroup.value.patients = [];
    const regions: string[] = toArray(this._formGroup.value.regions);
    this.prefectures$ = this.Prefectures$.filter(prefecture => regions.includes(prefecture.region_id));
  }

  genarateCommunes() {
    this.communes$ = [];
    this.hospitals$ = [];
    this.districtQuartiers$ = [];
    this.villageSecteurs$ = [];
    this.families$ = [];
    this.chws$ = [];
    this.recos$ = [];
    this.patients$ = [];
    this._formGroup.value.communes = [];
    this._formGroup.value.hospitals = [];
    this._formGroup.value.district_quartiers = [];
    this._formGroup.value.village_secteurs = [];
    this._formGroup.value.families = [];
    this._formGroup.value.chws = [];
    this._formGroup.value.recos = [];
    this._formGroup.value.patients = [];

    const prefectures: string[] = toArray(this._formGroup.value.prefectures);
    this.communes$ = this.Communes$.filter(commune => prefectures.includes(commune.prefecture_id));
  }

  genarateHospitals() {
    this.hospitals$ = [];
    this.districtQuartiers$ = [];
    this.villageSecteurs$ = [];
    this.families$ = [];
    this.chws$ = [];
    this.recos$ = [];
    this.patients$ = [];
    this._formGroup.value.hospitals = [];
    this._formGroup.value.district_quartiers = [];
    this._formGroup.value.village_secteurs = [];
    this._formGroup.value.families = [];
    this._formGroup.value.chws = [];
    this._formGroup.value.recos = [];
    this._formGroup.value.patients = [];

    const communes: string[] = toArray(this._formGroup.value.communes);
    this.hospitals$ = this.Hospitals$.filter(hospital => communes.includes(hospital.commune_id));
  }

  genarateDistrictQuartiers() {
    this.districtQuartiers$ = [];
    this.villageSecteurs$ = [];
    this.families$ = [];
    this.chws$ = [];
    this.recos$ = [];
    this.patients$ = [];
    this._formGroup.value.district_quartiers = [];
    this._formGroup.value.village_secteurs = [];
    this._formGroup.value.families = [];
    this._formGroup.value.chws = [];
    this._formGroup.value.recos = [];
    this._formGroup.value.patients = [];

    const hospitals: string[] = toArray(this._formGroup.value.hospitals);
    this.districtQuartiers$ = this.DistrictQuartiers$.filter(districtQuartier => hospitals.includes(districtQuartier.hospital_id));
  }

  genarateChws() {
    this.villageSecteurs$ = [];
    this.families$ = [];
    this.chws$ = [];
    this.recos$ = [];
    this.patients$ = [];
    this._formGroup.value.village_secteurs = [];
    this._formGroup.value.families = [];
    this._formGroup.value.chws = [];
    this._formGroup.value.recos = [];
    this._formGroup.value.patients = [];

    const district_quartiers: string[] = toArray(this._formGroup.value.district_quartiers);
    this.chws$ = this.Chws$.filter(chw => district_quartiers.includes(chw.district_quartier_id));
  }

  genarateVillageSecteurs() {
    this.villageSecteurs$ = [];
    this.families$ = [];
    this.chws$ = [];
    this.recos$ = [];
    this.patients$ = [];
    this._formGroup.value.village_secteurs = [];
    this._formGroup.value.families = [];
    this._formGroup.value.chws = [];
    this._formGroup.value.recos = [];
    this._formGroup.value.patients = [];

    const district_quartiers: string[] = toArray(this._formGroup.value.district_quartiers);
    this.villageSecteurs$ = this.VillageSecteurs$.filter(villageSecteurs => district_quartiers.includes(villageSecteurs.district_quartier_id));
  }

  genarateRecos() {
    this.families$ = [];
    this.chws$ = [];
    this.recos$ = [];
    this.patients$ = [];
    this._formGroup.value.families = [];
    this._formGroup.value.chws = [];
    this._formGroup.value.recos = [];
    this._formGroup.value.patients = [];

    const village_secteurs: string[] = toArray(this._formGroup.value.village_secteurs);
    this.recos$ = this.Recos$.filter(reco => village_secteurs.includes(reco.village_secteur_id));
  }

  genarateFamilies() {
    this.families$ = [];
    this.chws$ = [];
    this.recos$ = [];
    this.patients$ = [];
    this._formGroup.value.families = [];
    this._formGroup.value.chws = [];
    this._formGroup.value.recos = [];
    this._formGroup.value.patients = [];

    const village_secteurs: string[] = toArray(this._formGroup.value.village_secteurs);
    this.families$ = this.Families$.filter(family => village_secteurs.includes(family.village_secteur.id));
  }

  genaratePatients({ recos, chws }: { recos: string[], chws: string[] }) {
    this.chws$ = [];
    this.recos$ = [];
    this.patients$ = [];
    this._formGroup.value.families = [];
    this._formGroup.value.chws = [];
    this._formGroup.value.recos = [];
    this._formGroup.value.patients = [];

    const families: string[] = toArray(this._formGroup.value.families);
    this.patients$ = this.Patients$.filter(patient => families.includes(patient.family.id));
  }

  generateCible() {
    this.families$ = [];
    this.chws$ = [];
    this.recos$ = [];
    this.patients$ = [];
    this.villageSecteurs$ = [];
    this._formGroup.value.village_secteurs = "";
    this._formGroup.value.families = "";
    this._formGroup.value.chws = "";
    this._formGroup.value.recos = "";
    this._formGroup.value.patients = "";
    if (['reco-data', 'patients', 'families'].includes(this._formGroup.value.type)) {
      const district_quartiers: string[] = toArray(this._formGroup.value.district_quartiers);
      this.cibles$ = this.Recos$.filter(reco => district_quartiers.includes(reco.district_quartier_id));
    } else if (this._formGroup.value.type === 'chws-data') {
      const district_quartiers: string[] = toArray(this._formGroup.value.district_quartiers);
      this.cibles$ = this.Chws$.filter(chw => district_quartiers.includes(chw.district_quartier_id));
    } else if (this._formGroup.value.type === 'mentors-data') {
      // this.genarateMentor();
    } else if (['dashboards', 'reports'].includes(this._formGroup.value.type)) {
      const district_quartiers: string[] = toArray(this._formGroup.value.district_quartiers);
      this.cibles$ = this.Recos$.filter(reco => district_quartiers.includes(reco.district_quartier_id));
    }
  }
}
