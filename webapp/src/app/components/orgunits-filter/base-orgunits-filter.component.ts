import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { SendDhis2ModalComponent } from '@kossi-modals/send-dhis2-modal/send-dhis2-modal.component';
import { CountryMap, RegionsMap, PrefecturesMap, CommunesMap, HospitalsMap, DistrictQuartiersMap, VillageSecteursMap, ChwsMap, RecosMap } from '@kossi-models/org-unit-interface';
import { ReportsData, ReportsFilterData, ReportsHealth } from '@kossi-models/reports-selectors';
import { FormGroupService } from '@kossi-services/form-group.service';
import { ModalService } from '@kossi-services/modal.service';
import { SnackbarService } from '@kossi-services/snackbar.service';
import { UserContextService } from '@kossi-services/user-context.service';
import { currentYear, currentMonth, getMonthsList, getYearsList, notNull } from '@kossi-shared/functions';
import { Subject, takeUntil, from } from "rxjs";

@Component({
  standalone: false,
  selector: 'orgunits-filter-modal',
  template: ``,
  styles: [``],
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export abstract class BaseOrgunitsFilterComponent<T> implements OnInit, OnChanges, OnDestroy {

  private stateChange!: any;
  @Input() CHANGE_STATE: any;
  @Output() onValidateAllReports: EventEmitter<any> = new EventEmitter();
  @Output() onCancelAllValidation: EventEmitter<any> = new EventEmitter();
  @Output() onSendAllReportsToDhis2 = new EventEmitter<FormGroup>();

  private destroy$ = new Subject<void>();

  protected form!: FormGroup;

  protected showMultipleSelectionMonth:boolean = true;
  protected showMonthsSelection:boolean = true;
  protected showYearsSelection:boolean = true;
  protected showReportsButton:boolean = true;

  custumMonths = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']
  

  REPORTS_DATA: ReportsData = {
    MONTHLY_ACTIVITY: undefined,
    FAMILY_PLANNING: undefined,
    HOUSE_HOLD_RECAP: undefined,
    MORBIDITY: undefined,
    PCIMNE_NEWBORN: undefined,
    PROMOTION: undefined,
    RECO_MEG_QUANTITIES: undefined,
  };

  REPORTS_HEADER: ReportsHealth = {
    ON_FETCHING: {},
    IS_VALIDATED: {},
    IS_ON_DHIS2: {},
    ON_VALIDATION: {},
    ON_CANCEL_VALIDATION: {},
    ON_DHIS2_SENDING: {},
    ON_DHIS2_SENDING_ERROR: {},
  };

  REPORTS_FILTER: ReportsFilterData = {
    RECOS_NEEDED: [],
    RECOS_SELECTED: [],
    SEND_DHIS2_ORGUNITS: [],
  }

  Months$: { labelEN: string; labelFR: string; id: string; uid: number }[] = [];
  Years$: number[] = [];
  month$!: { labelEN: string; labelFR: string; id: string; uid: number };
  year$!: number;

  Countries$: CountryMap[] = [];
  Regions$: RegionsMap[] = [];
  Prefectures$: PrefecturesMap[] = [];
  Communes$: CommunesMap[] = [];
  Hospitals$: HospitalsMap[] = [];
  DistrictQuartiers$: DistrictQuartiersMap[] = [];
  VillageSecteurs$: VillageSecteursMap[] = [];
  Chws$: ChwsMap[] = [];
  Recos$: RecosMap[] = [];

  countries: CountryMap[] = [];
  regions: RegionsMap[] = [];
  prefectures: PrefecturesMap[] = [];
  communes: CommunesMap[] = [];
  hospitals: HospitalsMap[] = [];
  districtQuartiers: DistrictQuartiersMap[] = [];
  villageSecteurs: VillageSecteursMap[] = [];
  chws: ChwsMap[] = [];
  recos: RecosMap[] = [];

  HAS_VALIDATE_REPORTS_PERMISSION!: boolean;

  constructor(protected userCtx: UserContextService, protected fGroup: FormGroupService, protected mService: ModalService, protected snackbar: SnackbarService) {
    this.initializeComponent();
    this.initViewJs();

    this.fGroup.REPORTS_HEADER$.pipe(takeUntil(this.destroy$)).subscribe(dataSaved => {
      if (dataSaved) {
        Object.entries(this.REPORTS_HEADER).forEach(([key, value]) => {
          (this.REPORTS_HEADER as any)[key] = dataSaved[key] ?? (Array.isArray(value) ? [] : {});
        });
      }
    });

    this.fGroup.REPORTS_FILTER$.pipe(takeUntil(this.destroy$)).subscribe(dataSaved => {
      if (dataSaved) {
        Object.keys(this.REPORTS_FILTER).forEach(key => {
          (this.REPORTS_FILTER as any)[key] = dataSaved[key] ?? [];
        });
      }
    });

    this.fGroup.REPORTS_DATA$.pipe(takeUntil(this.destroy$)).subscribe(dataSaved => {
      if (dataSaved) {
        Object.keys(this.REPORTS_DATA).forEach(key => {
          (this.REPORTS_DATA as any)[key] = (dataSaved as any)[key];
        });
      }
    });

  }

  private initializeComponent() {
    from(this.userCtx.currentUser()).pipe(takeUntil(this.destroy$)).subscribe(user => {
      if (!(this.Countries$.length > 0)) this.Countries$ = user?.countries ?? [];
      if (!(this.Regions$.length > 0)) this.Regions$ = user?.regions ?? [];
      if (!(this.Prefectures$.length > 0)) this.Prefectures$ = user?.prefectures ?? [];
      if (!(this.Communes$.length > 0)) this.Communes$ = user?.communes ?? [];
      if (!(this.Hospitals$.length > 0)) this.Hospitals$ = user?.hospitals ?? [];
      if (!(this.DistrictQuartiers$.length > 0)) this.DistrictQuartiers$ = user?.districtQuartiers ?? [];
      if (!(this.VillageSecteurs$.length > 0)) this.VillageSecteurs$ = user?.villageSecteurs ?? [];
      if (!(this.Chws$.length > 0)) this.Chws$ = user?.chws ?? [];
      if (!(this.Recos$.length > 0)) this.Recos$ = user?.recos ?? [];
        this.countriesGenerate();
        this.regionsGenerate();
        this.prefecturesGenerate();
        this.communesGenerate();
        this.hospitalsGenerate();
        this.districtsGenerate();
        this.recosGenerate();

        this.HAS_VALIDATE_REPORTS_PERMISSION = user?.role.canValidateData ?? false;
    });
  }

  ngOnInit(): void {
    this.year$ = currentYear();
    this.month$ = currentMonth();
    this.Months$ = getMonthsList().filter(m => this.month$ && m.uid <= this.month$.uid);
    this.Years$ = getYearsList().filter(y => this.year$ && y <= this.year$);
    this.form = this.CreateFormGroup();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['CHANGE_STATE']) {
      this.stateChange = changes['CHANGE_STATE'].currentValue;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  START_ORGUNIT_FILTER(event: Event) {
    event.preventDefault();
    this.form.value['org_units'] = this.ORG_UNITS;
    this.fGroup.setFormGroup(this.form);
  }


  async ValidateAllReports(event: Event) {
    event.preventDefault();
    if (this.onValidateAllReports) {
      this.onValidateAllReports.emit();
    }
  }

  async CancelAllValidation(event: Event) {
    event.preventDefault();
    if (this.onCancelAllValidation) {
      this.onCancelAllValidation.emit();
    }
  }

  async SendAllReportsToDhis2(dhis2Form?: FormGroup) {
    if (this.onSendAllReportsToDhis2 && dhis2Form) {
      this.onSendAllReportsToDhis2.emit(dhis2Form);
    }
  }

  openAllSendReportsToDhis2Modal(event: Event) {
    event.preventDefault();
    const RECOS_NEEDED = this.REPORTS_FILTER.RECOS_NEEDED ?? 0;
    const RECOS_SELECTED = this.REPORTS_FILTER.RECOS_SELECTED ?? 0;
    if (RECOS_SELECTED.length > 0 && RECOS_NEEDED.length != RECOS_SELECTED.length) {
      this.snackbar.show({ msg: 'Pour envoyer les données au DHIS2, il faut selectionner tous RECO', color: 'warning', position: 'TOP' });
    } else {
      if (this.ORG_UNIT) {
        this.mService.open(SendDhis2ModalComponent, { data: { REPPORT_NAME: 'ALL' } }).subscribe((result?: { dhis2Form?: FormGroup, submited?: boolean }) => {
          if (result && result.submited) {
            // console.log("Données reçues depuis la modal :", result);
            if (result.dhis2Form) {
              this.SendAllReportsToDhis2(result.dhis2Form);
            } else {
              this.snackbar.show({ msg: 'DHIS2_ORGUNIT est vide, impossible d\'envoyer les données', color: 'warning', position: 'TOP' });
            }
          }
        });
      }
    }
  }

  initMonths(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    if (Number(selectElement.value) < this.year$) {
      this.Months$ = getMonthsList();
    } else {
      this.Months$ = getMonthsList().filter(m => this.month$ && m.uid <= this.month$.uid);
    }
    // this.Months$ = getMonthsList().filter(m => this.month$ && m.uid <= this.month$.uid);
  }

  countriesGenerate() {
    this.setOrgUnitsValues({ country: true, region: true, prefecture: true, commune: true, hospital: true, district_quartier: true, recos: true });
    this.countries = this.Countries$;
    this.setMultipleValues('country', this.countries.map(c => c.id));
    this.regionsGenerate();
  }

  regionsGenerate() {
    this.setOrgUnitsValues({ region: true, prefecture: true, commune: true, hospital: true, district_quartier: true, recos: true });
    const value = this.getVal('country');
    if (notNull(value) && this.Regions$.length > 0) {
      if (this.Countries$.length > 0) {
        this.regions = this.Regions$.filter(d => value.includes(d.country_id));
      } else {
        this.regions = this.Regions$;
      }
      this.setMultipleValues('region', this.regions.map(r => r.id));
    } else {
      this.regions = [];
      this.setMultipleValues('region', []);
    }
    this.prefecturesGenerate();
  }

  prefecturesGenerate() {
    this.setOrgUnitsValues({ prefecture: true, commune: true, hospital: true, district_quartier: true, recos: true });
    const value = this.getVal('region');
    if (notNull(value) && this.Prefectures$.length > 0) {
      if (this.Regions$.length > 0) {
        this.prefectures = this.Prefectures$.filter(d => value.includes(d.region_id));
      } else {
        this.prefectures = this.Prefectures$;
      }
      this.setMultipleValues('prefecture', this.prefectures.map(r => r.id));
    } else {
      this.prefectures = [];
      this.setMultipleValues('prefecture', []);
    }
    this.communesGenerate();
  }

  communesGenerate() {
    this.setOrgUnitsValues({ commune: true, hospital: true, district_quartier: true, recos: true });
    const value = this.getVal('prefecture');


    if (notNull(value) && this.Communes$.length > 0) {
      if (this.Prefectures$.length > 0) {
        this.communes = this.Communes$.filter(d => value.includes(d.prefecture_id));
      } else {
        this.communes = this.Communes$;
      }
      this.setMultipleValues('commune', this.communes.map(r => r.id));
    } else {
      this.communes = [];
      this.setMultipleValues('commune', []);
    }
    this.hospitalsGenerate();
  }

  hospitalsGenerate() {
    this.setOrgUnitsValues({ hospital: true, district_quartier: true, recos: true });
    const value = this.getVal('commune');
    if (notNull(value) && this.Hospitals$.length > 0) {
      if (this.Communes$.length > 0) {
        this.hospitals = this.Hospitals$.filter(d => value.includes(d.commune_id));
      } else {
        this.hospitals = this.Hospitals$;
      }
      this.setMultipleValues('hospital', this.hospitals.map(r => r.id));
    } else {
      this.hospitals = [];
      this.setMultipleValues('hospital', []);
    }
    this.districtsGenerate();
  }

  districtsGenerate() {
    this.setOrgUnitsValues({ district_quartier: true, recos: true });
    const value = this.getVal('hospital');
    if (notNull(value) && this.DistrictQuartiers$.length > 0) {
      if (this.Hospitals$.length > 0) {
        this.districtQuartiers = this.DistrictQuartiers$.filter(d => value.includes(d.hospital_id));
      } else {
        this.districtQuartiers = this.DistrictQuartiers$;
      }
      this.setMultipleValues('district_quartier', this.districtQuartiers.map(r => r.id));
    } else {
      this.districtQuartiers = [];
      this.setMultipleValues('district_quartier', []);
    }
    this.recosGenerate();
  }

  recosGenerate() {
    this.setOrgUnitsValues({ recos: true });
    const value = this.getVal('district_quartier');
    if (notNull(value) && this.Recos$.length > 0) {
      if (this.DistrictQuartiers$.length > 0) {
        this.recos = this.Recos$.filter(d => value.includes(d.district_quartier_id));
      } else {
        this.recos = this.Recos$;
      }
      this.setMultipleValues('recos', this.recos.map(r => r.id));
    } else {
      this.recos = this.Recos$;
      this.setMultipleValues('recos', this.Recos$.map(r => r.id));
    }
  }

  selectAll(cible: 'country' | 'region' | 'prefecture' | 'commune' | 'hospital' | 'district_quartier' | 'recos' | 'year' | 'months', event: Event) {
    const checkbox = document.getElementById(`all-${cible}`) as HTMLInputElement;
    if (checkbox) {
      if (cible === 'country') {
        this.setMultipleValues(cible, checkbox.checked ? this.countries.map(r => r.id) : []);
        this.regionsGenerate();
      }
      if (cible === 'region') {
        this.setMultipleValues(cible, checkbox.checked ? this.regions.map(r => r.id) : []);
        this.prefecturesGenerate();
      }
      if (cible === 'prefecture') {
        this.setMultipleValues(cible, checkbox.checked ? this.prefectures.map(r => r.id) : []);
        this.communesGenerate();
      }
      if (cible === 'commune') {
        this.setMultipleValues(cible, checkbox.checked ? this.communes.map(r => r.id) : []);
        this.hospitalsGenerate();
      }
      if (cible === 'hospital') {
        this.setMultipleValues(cible, checkbox.checked ? this.hospitals.map(r => r.id) : []);
        this.districtsGenerate();
      }
      if (cible === 'district_quartier') {
        this.setMultipleValues(cible, checkbox.checked ? this.districtQuartiers.map(r => r.id) : []);
        this.recosGenerate();
      }
      if (cible === 'recos') {
        this.setMultipleValues(cible, checkbox.checked ? this.recos.map(r => r.id) : []);
      }
      if (cible === 'year') {
        this.setMultipleValues(cible, checkbox.checked ? this.Years$ : []);
      }
      if (cible === 'months') {
        this.setMultipleValues(cible, checkbox.checked ? this.Months$.map(r => r.id) : []);
      }
    }
  }

  isChecked(cible: 'country' | 'region' | 'prefecture' | 'commune' | 'hospital' | 'district_quartier' | 'recos' | 'year' | 'months') {
    const value = this.getVal(cible);
    if (cible === 'country') {
      return notNull(value) && value.length === this.countries.map(r => r.id).length;
    }
    if (cible === 'region') {
      return notNull(value) && value.length === this.regions.map(r => r.id).length;
    }
    if (cible === 'prefecture') {
      return notNull(value) && value.length === this.prefectures.map(r => r.id).length;
    }
    if (cible === 'commune') {
      return notNull(value) && value.length === this.communes.map(r => r.id).length;
    }
    if (cible === 'hospital') {
      return notNull(value) && value.length === this.hospitals.map(r => r.id).length;
    }
    if (cible === 'district_quartier') {
      return notNull(value) && value.length === this.districtQuartiers.map(r => r.id).length;
    }
    if (cible === 'recos') {
      return notNull(value) && value.length === this.recos.map(r => r.id).length;
    }
    if (cible === 'year') {
      return notNull(value) && value.length === this.Years$.length;
    }
    if (cible === 'months') {
      return notNull(value) && value.length === this.Months$.map(r => r.id).length;
    }
    return false;
  }

  selectedLength(cible: 'country' | 'region' | 'prefecture' | 'commune' | 'hospital' | 'district_quartier' | 'recos' | 'year' | 'months') {
    const val = this.getVal(cible);
    return notNull(val) ? val.length : 0;
  }


  private initViewJs() {

    $(document).ready(function () {
      const $overlay = $("#overlay");
      const $orgunitFilterModal = $("#modal-container");

      // Fonction pour ouvrir le modal
      function openModal() {
        $orgunitFilterModal.addClass("open");
        $overlay.addClass("open");
        $("body").addClass("modal-open");
      }

      // Fonction pour fermer le modal
      function closeModal() {
        $orgunitFilterModal.removeClass("open");
        $overlay.removeClass("open");
        $("body").removeClass("modal-open");
      }

      // Ouvrir le modal en cliquant sur le bouton "Filtrer"
      $(".open-modal-button").on("click", openModal);

      // Fermer le modal sur le bouton "X" ou le bouton "Appliquer le filtre"
      $(".close").on("click", function (event) {
        event.preventDefault(); // Empêche le rechargement de la page au clic sur "Appliquer le filtre"
        closeModal();
      });
      // Fermer le modal sur le bouton "X" ou le bouton "Appliquer le filtre"
      $(".modal-validate").on("click", function (event) {
        closeModal();
      });

      // Fermer en cliquant sur l'overlay
      $overlay.on("click", closeModal);

      // Fermer avec la touche "Échap"
      $(document).on("keydown", function (event) {
        if (event.key === "Escape") closeModal();
      });
    });
  }

  private CreateFormGroup(): FormGroup {
    const form: any = {
      year: new FormControl(this.year$, [Validators.required]),
      months: new FormControl(this.showMonthsSelection ? [this.month$.id] : this.custumMonths, [Validators.required]),
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

  private setOrgUnitsValues(dt: { country?: boolean, region?: boolean, prefecture?: boolean, commune?: boolean, hospital?: boolean, district_quartier?: boolean, recos: boolean }) {
    if (dt.country === true) {
      this.countries = [];
      this.setMultipleValues('country', []);
    }
    if (dt.region === true) {
      this.regions = [];
      this.setMultipleValues('region', []);
    }
    if (dt.prefecture === true) {
      this.prefectures = [];
      this.setMultipleValues('prefecture', []);
    }
    if (dt.commune === true) {
      this.communes = [];
      this.setMultipleValues('commune', []);
    }
    if (dt.hospital === true) {
      this.hospitals = [];
      this.setMultipleValues('hospital', []);
    }
    if (dt.district_quartier === true) {
      this.districtQuartiers = [];
      this.setMultipleValues('district_quartier', []);
    }
    if (dt.recos === true) {
      this.recos = [];
      this.setMultipleValues('recos', []);
    }
  }

  private getVal(field: 'country' | 'region' | 'prefecture' | 'commune' | 'hospital' | 'district_quartier' | 'recos' | 'year' | 'months') {
    return this.form.value[field];
  }

  private getMultipleValues(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    const selectedOptions = Array.from(selectElement.selectedOptions);
    const selectedCountryIds = selectedOptions.map(option => option.value);
    return selectedCountryIds;
  }

  private setMultipleValues(field: 'country' | 'region' | 'prefecture' | 'commune' | 'hospital' | 'district_quartier' | 'recos' | 'year' | 'months', values: any): void {
    if (!this.form.controls[field]) {
      this.form.addControl(field, new FormControl([]));
    }
    this.form.controls[field].setValue(Array.isArray(values) ? values : [values]);
  }

  get ORG_UNIT() {
    return this.REPORTS_FILTER.SEND_DHIS2_ORGUNITS;
  }

  get ORG_UNITS() {
    const recos = this.recos.filter(r => (this.form.value.recos ?? []).includes(r.id));
    return {
      country: this.countries.filter(r => (this.form.value.country ?? []).includes(r.id)),
      region: this.regions.filter(r => (this.form.value.region ?? []).includes(r.id)),
      prefecture: this.prefectures.filter(r => (this.form.value.prefecture ?? []).includes(r.id)),
      commune: this.communes.filter(r => (this.form.value.commune ?? []).includes(r.id)),
      hospital: this.hospitals.filter(r => (this.form.value.hospital ?? []).includes(r.id)),
      district_quartier: this.districtQuartiers.filter(r => (this.form.value.district_quartier ?? []).includes(r.id)),
      chws: this.chws.filter(r => (this.form.value.chw ?? []).includes(r.id)),
      village_secteur: this.villageSecteurs.filter(r => (this.form.value.village_secteur ?? []).includes(r.id)),
      recos: recos,
      all_recos_ids: this.Recos$.map(r => r.id),
      selected_recos_ids: recos.map(r => r.id),
    }
  }

  get ON_ALL_FETCHING() {
    const r1 = this.REPORTS_HEADER?.ON_FETCHING?.MONTHLY_ACTIVITY == true;
    const r2 = this.REPORTS_HEADER?.ON_FETCHING?.FAMILY_PLANNING == true;
    const r3 = this.REPORTS_HEADER?.ON_FETCHING?.HOUSE_HOLD_RECAP == true;
    const r4 = this.REPORTS_HEADER?.ON_FETCHING?.MORBIDITY == true;
    const r5 = this.REPORTS_HEADER?.ON_FETCHING?.PCIMNE_NEWBORN == true;
    const r6 = this.REPORTS_HEADER?.ON_FETCHING?.PROMOTION == true;
    const r7 = this.REPORTS_HEADER?.ON_FETCHING?.RECO_MEG_QUANTITIES == true;
    return r1 || r2 || r3 || r4 || r5 || r6 || r7;
  }

  get IS_ALL_REPPORTS_VALIDATED() {
    const r1 = this.REPORTS_HEADER?.IS_VALIDATED?.MONTHLY_ACTIVITY == true;
    const r2 = this.REPORTS_HEADER?.IS_VALIDATED?.FAMILY_PLANNING == true;
    const r3 = this.REPORTS_HEADER?.IS_VALIDATED?.HOUSE_HOLD_RECAP == true;
    const r4 = this.REPORTS_HEADER?.IS_VALIDATED?.MORBIDITY == true;
    const r5 = this.REPORTS_HEADER?.IS_VALIDATED?.PCIMNE_NEWBORN == true;
    const r6 = this.REPORTS_HEADER?.IS_VALIDATED?.PROMOTION == true;
    const r7 = this.REPORTS_HEADER?.IS_VALIDATED?.RECO_MEG_QUANTITIES == true;
    return r1 && r2 && r3 && r4 && r5 && r6 && r7;
  }

  get ON_ALL_DHIS2_SENDING() {
    const r1 = this.REPORTS_HEADER?.ON_DHIS2_SENDING?.MONTHLY_ACTIVITY == true;
    const r2 = this.REPORTS_HEADER?.ON_DHIS2_SENDING?.FAMILY_PLANNING == true;
    const r3 = this.REPORTS_HEADER?.ON_DHIS2_SENDING?.HOUSE_HOLD_RECAP == true;
    const r4 = this.REPORTS_HEADER?.ON_DHIS2_SENDING?.MORBIDITY == true;
    const r5 = this.REPORTS_HEADER?.ON_DHIS2_SENDING?.PCIMNE_NEWBORN == true;
    const r6 = this.REPORTS_HEADER?.ON_DHIS2_SENDING?.PROMOTION == true;
    const r7 = this.REPORTS_HEADER?.ON_DHIS2_SENDING?.RECO_MEG_QUANTITIES == true;
    return r1 && r2 && r3 && r4 && r5 && r6 && r7;
  }

  get IS_ALL_ON_DHIS2() {
    const r1 = this.REPORTS_HEADER?.IS_ON_DHIS2?.MONTHLY_ACTIVITY == true;
    const r2 = this.REPORTS_HEADER?.IS_ON_DHIS2?.FAMILY_PLANNING == true;
    const r3 = this.REPORTS_HEADER?.IS_ON_DHIS2?.HOUSE_HOLD_RECAP == true;
    const r4 = this.REPORTS_HEADER?.IS_ON_DHIS2?.MORBIDITY == true;
    const r5 = this.REPORTS_HEADER?.IS_ON_DHIS2?.PCIMNE_NEWBORN == true;
    const r6 = this.REPORTS_HEADER?.IS_ON_DHIS2?.PROMOTION == true;
    const r7 = this.REPORTS_HEADER?.IS_ON_DHIS2?.RECO_MEG_QUANTITIES == true;
    return r1 && r2 && r3 && r4 && r5 && r6 && r7;
  }

  get IS_ALL_REPORTS_LOADED() {
    const r1 = this.REPORTS_DATA?.MONTHLY_ACTIVITY?.data != undefined;
    const r2 = this.REPORTS_DATA?.FAMILY_PLANNING?.data != undefined;
    const r3 = this.REPORTS_DATA?.HOUSE_HOLD_RECAP?.data != undefined;
    const r4 = this.REPORTS_DATA?.MORBIDITY?.data != undefined;
    const r5 = this.REPORTS_DATA?.PCIMNE_NEWBORN != undefined;
    const r6 = this.REPORTS_DATA?.PROMOTION?.data != undefined;
    const r7 = this.REPORTS_DATA?.RECO_MEG_QUANTITIES?.data != undefined;
    return r1 && r2 && r3 && r4 && r5 && r6 && r7;
  }

  get ON_ALL_VALIDATION() {
    const r1 = this.REPORTS_HEADER?.ON_VALIDATION?.MONTHLY_ACTIVITY == true;
    const r2 = this.REPORTS_HEADER?.ON_VALIDATION?.FAMILY_PLANNING == true;
    const r3 = this.REPORTS_HEADER?.ON_VALIDATION?.HOUSE_HOLD_RECAP == true;
    const r4 = this.REPORTS_HEADER?.ON_VALIDATION?.MORBIDITY == true;
    const r5 = this.REPORTS_HEADER?.ON_VALIDATION?.PCIMNE_NEWBORN == true;
    const r6 = this.REPORTS_HEADER?.ON_VALIDATION?.PROMOTION == true;
    const r7 = this.REPORTS_HEADER?.ON_VALIDATION?.RECO_MEG_QUANTITIES == true;
    return r1 || r2 || r3 || r4 || r5 || r6 || r7;
  }

  get ON_ALL_CANCEL_VALIDATION() {
    const r1 = this.REPORTS_HEADER?.ON_CANCEL_VALIDATION?.MONTHLY_ACTIVITY == true;
    const r2 = this.REPORTS_HEADER?.ON_CANCEL_VALIDATION?.FAMILY_PLANNING == true;
    const r3 = this.REPORTS_HEADER?.ON_CANCEL_VALIDATION?.HOUSE_HOLD_RECAP == true;
    const r4 = this.REPORTS_HEADER?.ON_CANCEL_VALIDATION?.MORBIDITY == true;
    const r5 = this.REPORTS_HEADER?.ON_CANCEL_VALIDATION?.PCIMNE_NEWBORN == true;
    const r6 = this.REPORTS_HEADER?.ON_CANCEL_VALIDATION?.PROMOTION == true;
    const r7 = this.REPORTS_HEADER?.ON_CANCEL_VALIDATION?.RECO_MEG_QUANTITIES == true;
    return r1 || r2 || r3 || r4 || r5 || r6 || r7;
  }

  get CAN_ALL_VALIDATE_REPORTS(): boolean {
    return this.IS_ALL_REPORTS_LOADED && this.HAS_VALIDATE_REPORTS_PERMISSION;
  }

  get CAN_SEND_TO_DHIS2() {
    return this.CAN_ALL_VALIDATE_REPORTS && notNull(this.form.value['org_units']) && this.IS_ALL_REPPORTS_VALIDATED == true;
  }

}