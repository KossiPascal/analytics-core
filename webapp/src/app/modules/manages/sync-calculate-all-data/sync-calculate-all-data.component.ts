import { Component, OnInit } from '@angular/core';
import { UserContextService } from '@kossi-services/user-context.service';
import { AuthService } from '@kossi-services/auth.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '@kossi-services/api.service';
import { TODAY_YEAR_MONTH_DAY, getYearsList, getMonthsList, currentMonth } from '@kossi-src/app/utils/functions';
import { ChwsRecoReport, FamilyPlanningReport, HouseholdRecapReport, MorbidityReport, PcimneNewbornReport, PromotionReport, RecoMegSituationReport } from '@kossi-models/reports';
import { AllFormsSyncResult, OrgUnitSyncResult, SyncOutputUtils } from '@kossi-models/org-units';
import { Observable, catchError, map, of } from 'rxjs';
import { SnackbarService } from '@kossi-services/snackbar.service';
import { RecoPerformanceDashboard, RecoVaccinationDashboard } from '@kossi-models/dashboards';


@Component({
  selector: 'app-sync-calculate-all-data',
  templateUrl: `./sync-calculate-all-data.component.html`,
  styleUrls: ['./sync-calculate-all-data.component.css'],
})
export class SyncCalculateAllDataComponent implements OnInit {

  OrgUnitSyncResult$!: OrgUnitSyncResult;
  AllFormsSyncResult$!: AllFormsSyncResult;
  FullSyncResult$!: {
    orgunit: OrgUnitSyncResult | null,
    data: AllFormsSyncResult | null,
    dhis2: OrgUnitSyncResult[],
    globalError: any,
    successDetails: any,
    reports:{cible:string, data: SyncOutputUtils}[],
    dashboards:{cible:string, data: SyncOutputUtils}[]
  };

  _formGroup!: FormGroup;
  _orgunitFormGroup!: FormGroup;
  _calculFormGroup!: FormGroup;
  _fullSyncFormGroup!: FormGroup;

  Months$: { labelEN: string; labelFR: string; id: string; uid: number }[] = [];
  Years$: number[] = [];

  month$!: { labelEN: string; labelFR: string; id: string; uid: number };
  year$!: number;

  TODAY!: { year: number, month: number, month_str: string, day: number, start_date: string, end_date: string }

  FormTypes$: string[] = ['SYNC_ALL_FORMS_DATA_FROM_COUCHDB', 'SYNC_APP_USERS_FROM_COUCHDB'];
  CalculationTypes$: string[] = [
    'START_ALL_CALCULATION',
    'CHW_RECO_REPORTS_CALCULATION',
    'FAMILY_PLANNNING_REPORTS_CALCULATION',
    'ADULT_MORBIDITY_REPORTS_CALCULATION',
    'HOUSEHOLD_RECAPS_REPORTS_CALCULATION',
    'PCIMNE_NEWBORN_REPORTS_CALCULATION',
    'PROMOTONAL_ACTIVITIES_REPORTS_CALCULATION',
    'RECO_MEG_SITUATION_REPORTS_CALCULATION',

    'RECO_MEG_STOCK_DASHBOARD_CALCULATION',
    'RECO_PERFORMANCE_DASHBOARD_CALCULATION',
    'RECO_VACCINATION_DASHBOARD_CALCULATION',
    'RECO_CHART_PERFORMANCE_DASHBOARD_CALCULATION'
  ];

  data_syncing: boolean = false;
  calculation_syncing: boolean = false;
  orgunit_syncing: boolean = false;
  full_syncing: boolean = false;
  useMonthYear: boolean = true;
  initDate!: { start_date: string, end_date: string };


  constructor(private userCtx: UserContextService, private auth: AuthService, private api: ApiService, private snackbar: SnackbarService) { }

  ngOnInit(): void {
    this.TODAY = TODAY_YEAR_MONTH_DAY();

    this.Months$ = getMonthsList();
    this.Years$ = getYearsList();

    this.year$ = this.TODAY.year;
    this.month$ = currentMonth();

    this.initDate = { start_date: this.TODAY.start_date, end_date: this.TODAY.end_date };

    this._formGroup = this.CreateFormGroup();
    this._calculFormGroup = this.CreateFormGroup();
    this._orgunitFormGroup = this.CreateOrgUnitAndPersonFormGroup();
    this._fullSyncFormGroup = this.CreateFullSyncFormGroup();
  }

  CreateFormGroup(): FormGroup {
    return new FormGroup({
      year: new FormControl(this.year$, [Validators.required]),
      month: new FormControl(this.month$.id, [Validators.required]),
      cible: new FormControl('', [Validators.required]),
    });
  }

  CreateFullSyncFormGroup(): FormGroup {
    const form: any = {
      use_year_month: new FormControl(this.useMonthYear, [Validators.required]),
    };
    if (this.useMonthYear) {
      form['year'] = new FormControl(this.year$, [Validators.required]);
      form['month'] = new FormControl(this.month$.id, [Validators.required]);
    } else {
      form['start_date'] = new FormControl(this.initDate.start_date, [Validators.required]);
      form['end_date'] = new FormControl(this.initDate.end_date, [Validators.required]);
    }
    return new FormGroup(form);
  }

  initFullFullSyncFormGroup() {
    this.useMonthYear = this._fullSyncFormGroup.value.use_year_month === true;
    this._fullSyncFormGroup = this.CreateFullSyncFormGroup();
  }

  toKeyValue(data: any): { key: string, value: any }[] {
    if (data) {
      return Object.entries(data).map((d: [string, any]) => {
        return { key: d[0], value: d[1] }
      });
    }
    return [];
  }

  CreateOrgUnitAndPersonFormGroup(): FormGroup {
    return new FormGroup({
      year: new FormControl(this.year$, [Validators.required]),
      month: new FormControl(this.month$.id, [Validators.required]),
      country: new FormControl(true, [Validators.required]),
      region: new FormControl(true, [Validators.required]),
      prefecture: new FormControl(true, [Validators.required]),
      commune: new FormControl(true, [Validators.required]),
      hospital: new FormControl(true, [Validators.required]),
      district_quartier: new FormControl(true, [Validators.required]),
      village_secteur: new FormControl(true, [Validators.required]),
      family: new FormControl(true, [Validators.required]),

      country_manager: new FormControl(true, [Validators.required]),
      region_manager: new FormControl(true, [Validators.required]),
      prefecture_manager: new FormControl(true, [Validators.required]),
      commune_manager: new FormControl(true, [Validators.required]),
      hospital_manager: new FormControl(true, [Validators.required]),

      chw: new FormControl(true, [Validators.required]),
      reco: new FormControl(true, [Validators.required]),
      patient: new FormControl(true, [Validators.required]),
    });
  }

  prevent(event: Event, id: string,) {
    event.preventDefault();
    const elm = document.getElementById(id);
    const aElms = document.getElementsByTagName('a');
    if (aElms) {
      Array.from(aElms).forEach(element => {
        element.classList.remove('active');
      });
    }
    if (elm) {
      elm.classList.add('active'); // Use classList to add 'active' class
    }
  }

  SYNC(event: Event) {
    event.preventDefault();
    this.data_syncing = true;
    const cible = this._formGroup.value.cible;
    if (cible === 'SYNC_ALL_FORMS_DATA_FROM_COUCHDB') {
      this.SYNC_ALL_FORMS();
    } else if (cible === 'SYNC_APP_USERS_FROM_COUCHDB') {
      this.SYNC_ALL_USERS();
    } else {
      this.data_syncing = false;
    }
  }

  async START_CALCULATION(event: Event) {
    event.preventDefault();
    this.calculation_syncing = true;
    let calcul: boolean | undefined = false;
    const cible = this._calculFormGroup.value.cible;
    if (cible === 'START_ALL_CALCULATION') {
      // REPORTS
      const c1 = await this.CHW_RECO_REPORTS_CALCULATION().toPromise();
      const c2 = await this.FAMILY_PLANNNING_REPORTS_CALCULATION().toPromise();
      const c3 = await this.ADULT_MORBIDITY_REPORTS_CALCULATION().toPromise();
      const c4 = await this.HOUSEHOLD_RECAPS_REPORTS_CALCULATION().toPromise();
      const c5 = await this.PCIMNE_NEWBORN_REPORTS_CALCULATION().toPromise();
      const c6 = await this.PROMOTONAL_ACTIVITIES_REPORTS_CALCULATION().toPromise();
      const c7 = await this.RECO_MEG_SITUATION_REPORTS_CALCULATION().toPromise();

      // DASHBOARDS
      const c8 = await this.RECO_PERFORMANCE_DASHBOARD_CALCULATION().toPromise();
      const c9 = await this.RECO_VACCINATION_DASHBOARD_CALCULATION().toPromise();
      const c10 = await this.RECO_CHART_PERFORMANCE_DASHBOARD_CALCULATION().toPromise();

      calcul = (c1 === true && c2 === true && c3 === true && c4 === true && c5 === true && c6 === true && c7 === true && c8 === true && c9 === true && c10 === true);
    } else if (cible === 'CHW_RECO_REPORTS_CALCULATION') {
      calcul = await this.CHW_RECO_REPORTS_CALCULATION().toPromise();
    } else if (cible === 'FAMILY_PLANNNING_REPORTS_CALCULATION') {
      calcul = await this.FAMILY_PLANNNING_REPORTS_CALCULATION().toPromise();
    } else if (cible === 'ADULT_MORBIDITY_REPORTS_CALCULATION') {
      calcul = await this.ADULT_MORBIDITY_REPORTS_CALCULATION().toPromise();
    } else if (cible === 'HOUSEHOLD_RECAPS_REPORTS_CALCULATION') {
      calcul = await this.HOUSEHOLD_RECAPS_REPORTS_CALCULATION().toPromise();
    } else if (cible === 'PCIMNE_NEWBORN_REPORTS_CALCULATION') {
      calcul = await this.PCIMNE_NEWBORN_REPORTS_CALCULATION().toPromise();
    } else if (cible === 'PROMOTONAL_ACTIVITIES_REPORTS_CALCULATION') {
      calcul = await this.PROMOTONAL_ACTIVITIES_REPORTS_CALCULATION().toPromise();
    }  else if (cible === 'RECO_VACCINATION_DASHBOARD_CALCULATION') {
      calcul = await this.RECO_VACCINATION_DASHBOARD_CALCULATION().toPromise();
    } else if (cible === 'RECO_PERFORMANCE_DASHBOARD_CALCULATION') {
      calcul = await this.RECO_PERFORMANCE_DASHBOARD_CALCULATION().toPromise();
    } else if (cible === 'RECO_CHART_PERFORMANCE_DASHBOARD_CALCULATION') {
      calcul = await this.RECO_CHART_PERFORMANCE_DASHBOARD_CALCULATION().toPromise();
    } else if (cible === 'RECO_MEG_SITUATION_REPORTS_CALCULATION') {
      calcul = await this.RECO_MEG_SITUATION_REPORTS_CALCULATION().toPromise();
    }

    this.calculation_syncing = false;
    if (calcul === true) {
      return this.snackbar.show('Calcul effectué avec succès', { backgroundColor: 'success', duration: 5000 });
    }
    return this.snackbar.show('Erreur lors du calcul des indicateurs, ', { backgroundColor: 'danger', duration: 5000 });
  }


  SYNC_ALL_FORMS() {
    this.data_syncing = true;
    this.api.SYNC_ALL_FORMS_DATA_FROM_COUCHDB(this._formGroup.value).subscribe((_res$: AllFormsSyncResult) => {
      this.AllFormsSyncResult$ = _res$;
      this.data_syncing = false;
    }, (err: any) => {
      this.data_syncing = false;
    });
  }

  SYNC_ALL_USERS() {
    this.data_syncing = true;
    this.api.SYNC_APP_USERS_FROM_COUCHDB().subscribe((_res$: { status: number, data: any }) => {
      if (_res$.status == 200) {
      }
      this.data_syncing = false;
    }, (err: any) => {
      this.data_syncing = false;
    });
  }

  SYNC_ALL_ORGUNITS_AND_CONTACTS(event: Event) {
    event.preventDefault();
    this.orgunit_syncing = true;
    this.api.SYNC_ALL_ORGUNITS_AND_CONTACTS_FROM_COUCHDB(this._orgunitFormGroup.value).subscribe((_res$: OrgUnitSyncResult) => {
      this.OrgUnitSyncResult$ = _res$;
      this.orgunit_syncing = false;
    }, (err: any) => {
      this.orgunit_syncing = false;
    });
  }

  FULL_SYNC_COUCHDB_DATA_AND_CALCULATION(event: Event) {
    event.preventDefault();
    this.full_syncing = true;
    const params = {
      year: this.useMonthYear === true ? this._fullSyncFormGroup.value.year : undefined,
      month: this.useMonthYear === true ? this._fullSyncFormGroup.value.month : undefined,
      start_date: this.useMonthYear !== true ? this._fullSyncFormGroup.value.start_date : undefined,
      end_date: this.useMonthYear !== true ? this._fullSyncFormGroup.value.end_date : undefined
    };

    this.api.FULL_SYNC_AND_CALCULATE_COUCHDB_DATA(params).subscribe((_res$: { status: number, data: { orgunit: OrgUnitSyncResult | null, data: AllFormsSyncResult | null, dhis2: OrgUnitSyncResult[], globalError: any, successDetails: any, reports:{cible:string, data: SyncOutputUtils}[], dashboards:{cible:string, data: SyncOutputUtils}[] } }) => {
      if (_res$.status === 200) {
        this.FullSyncResult$ = _res$.data;
      }
      this.full_syncing = false;
    }, (err: any) => {
      this.full_syncing = false;
    });
  }

  // START CALCULLATIONS

  CHW_RECO_REPORTS_CALCULATION(): Observable<boolean> {
    return this.api.CHW_RECO_REPORTS_CALCULATION(this._calculFormGroup.value).pipe(
      map((_res$: { status: number, ErrorsCount: number, SuccessCount: number, data: ChwsRecoReport }) => {
        if (_res$.status !== 200) {
          return false;
        }
        return true;
      }),
      catchError((err: any) => {
        return of(false);
      })
    );
  }

  FAMILY_PLANNNING_REPORTS_CALCULATION(): Observable<boolean> {
    return this.api.FAMILY_PLANNNING_REPORTS_CALCULATION(this._calculFormGroup.value).pipe(
      map((_res$: { status: number, ErrorsCount: number, SuccessCount: number, data: FamilyPlanningReport }) => {
        if (_res$.status !== 200) {
          return false;
        }
        return true;
      }),
      catchError((err: any) => {
        return of(false);
      })
    );
  }

  ADULT_MORBIDITY_REPORTS_CALCULATION(): Observable<boolean> {
    return this.api.ADULT_MORBIDITY_REPORTS_CALCULATION(this._calculFormGroup.value).pipe(
      map((_res$: { status: number, ErrorsCount: number, SuccessCount: number, data: MorbidityReport }) => {
        if (_res$.status !== 200) {
          return false;
        }
        return true;
      }),
      catchError((err: any) => {
        return of(false);
      })
    );
  }

  HOUSEHOLD_RECAPS_REPORTS_CALCULATION(): Observable<boolean> {
    return this.api.HOUSEHOLD_RECAPS_REPORTS_CALCULATION(this._calculFormGroup.value).pipe(
      map((_res$: { status: number, ErrorsCount: number, SuccessCount: number, data: HouseholdRecapReport }) => {
        if (_res$.status !== 200) {
          return false;
        }
        return true;
      }),
      catchError((err: any) => {
        return of(false);
      })
    );
  }

  PCIMNE_NEWBORN_REPORTS_CALCULATION(): Observable<boolean> {
    return this.api.PCIMNE_NEWBORN_REPORTS_CALCULATION(this._calculFormGroup.value).pipe(
      map((_res$: { status: number, ErrorsCount: number, SuccessCount: number, data: PcimneNewbornReport }) => {
        if (_res$.status !== 200) {
          return false;
        }
        return true;
      }),
      catchError((err: any) => {
        return of(false);
      })
    );
  }

  PROMOTONAL_ACTIVITIES_REPORTS_CALCULATION(): Observable<boolean> {
    return this.api.PROMOTONAL_ACTIVITIES_REPORTS_CALCULATION(this._calculFormGroup.value).pipe(
      map((_res$: { status: number, ErrorsCount: number, SuccessCount: number, data: PromotionReport }) => {
        if (_res$.status !== 200) {
          return false;
        }
        return true;
      }),
      catchError((err: any) => {
        return of(false);
      })
    );
  }

  RECO_MEG_SITUATION_REPORTS_CALCULATION(): Observable<boolean> {
    return this.api.RECO_MEG_SITUATION_REPORTS_CALCULATION(this._calculFormGroup.value).pipe(
      map((_res$: { status: number, ErrorsCount: number, SuccessCount: number, data: RecoMegSituationReport }) => {
        if (_res$.status !== 200) {
          return false;
        }
        return true;
      }),
      catchError((err: any) => {
        return of(false);
      })
    );
  }

  // DASHBOARD CALCULATION

  RECO_VACCINATION_DASHBOARD_CALCULATION(): Observable<boolean> {
    return this.api.RECO_VACCINATION_DASHBOARD_CALCULATION(this._calculFormGroup.value).pipe(
      map((_res$: { status: number, ErrorsCount: number, SuccessCount: number, data: RecoVaccinationDashboard }) => {
        if (_res$.status !== 200) {
          return false;
        }
        return true;
      }),
      catchError((err: any) => {
        return of(false);
      })
    );
  }

  RECO_PERFORMANCE_DASHBOARD_CALCULATION(): Observable<boolean> {
    return this.api.RECO_PERFORMANCE_DASHBOARD_CALCULATION(this._calculFormGroup.value).pipe(
      map((_res$: { status: number, ErrorsCount: number, SuccessCount: number, data: RecoPerformanceDashboard }) => {
        if (_res$.status !== 200) {
          return false;
        }
        return true;
      }),
      catchError((err: any) => {
        return of(false);
      })
    );
  }

  RECO_CHART_PERFORMANCE_DASHBOARD_CALCULATION(): Observable<boolean> {
    const year = this._calculFormGroup.value.year ?? parseInt(this._calculFormGroup.value.end_date.split('-')[0])
    return this.api.RECO_CHART_PERFORMANCE_DASHBOARD_CALCULATION(year).pipe(
      map((_res$: { status: number, ErrorsCount: number, SuccessCount: number, data: RecoPerformanceDashboard }) => {
        if (_res$.status !== 200) {
          return false;
        }
        return true;
      }),
      catchError((err: any) => {
        return of(false);
      })
    );
  }




}
