import { Component, Inject, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ConnectivityService } from '@kossi-services/connectivity.service';
import { SnackbarService } from '@kossi-services/snackbar.service';
import { Observable, Subject, takeUntil } from 'rxjs';
import { IndicatorsDataOutput } from '@kossi-models/interfaces';
import { FormGroupService } from '@kossi-services/form-group.service';
import { toArray } from '@kossi-shared/functions';
import { DashboardsHealth } from '@kossi-models/dashboards-selectors';
import { User } from '@kossi-models/user-role';
import { UserContextService } from '@kossi-services/user-context.service';
import { ExportDataComponent } from '@kossi-components/export-data/export-data.component';
import { RecoVaccinationDashboard } from '@kossi-models/dashboards';
import { formatGuineaPhone } from '@kossi-pipes/guinea-phone.pipe';
import { FETCH_DASHBOARDS } from './dashboards-injection-tokens';

@Component({
    selector: 'app-report',
    template: ``,
    styles: [``]
})
export abstract class BaseDashboardsComponent<T> extends ExportDataComponent<any> implements OnInit, OnDestroy, OnChanges {

    private stateChange!: any;
    @Input() CHANGE_STATE: any;

    protected form!: FormGroup<any>;

    DASHBOARD_NAME = 'DASHBOARD';
    MONTH!: string;
    YEAR!: number;
    isOnline: boolean = false;
    destroy$ = new Subject<void>();

    DASHBOARDS_DATA: any = {
        ACTIVE_RECOS: undefined,
        RECOS_PERFORMANCES: undefined,
        RECOS_VACCINES_NOT_DONE: undefined,
        RECOS_VACCINES_PARTIAL_DONE: undefined,
        RECOS_VACCINES_ALL_DONE: undefined,
        RECOS_TASKS_STATE: undefined,
    };

    DASHBOARDS_HEADER: DashboardsHealth = {
        ON_FETCHING: {},
    };

    USER!: User | null;

    showGeneralCallAndSmsButton:boolean = false;
    showOneByOneCallAndSmsButton:boolean = false;


    constructor(
        fGroup: FormGroupService,
        conn: ConnectivityService,
        snackbar: SnackbarService,
        userCtx: UserContextService,
        @Inject(FETCH_DASHBOARDS) protected fetchDashboards: (formData: any, isOnline: boolean) => Observable<IndicatorsDataOutput<T> | IndicatorsDataOutput<T[]> | undefined>,
    ) {

        super(
            fGroup,
            conn,
            snackbar,
            userCtx,
        );

        this.initializeComponent();
        this.isOnline = this.conn.isOnline;
    }

    private async initializeComponent() {
        this.USER = await this.userCtx.currentUser();
    }

    ngOnInit(): void {
        // (this.DASHBOARDS_DATA as any)[this.DASHBOARD_NAME] = undefined;
        // this.SET_DASHBOARDS_DATA();
        
        this.conn.onlineStatus$.pipe(takeUntil(this.destroy$)).subscribe(isOnline => {
            this.isOnline = isOnline;
        });

        this.fGroup.formGroup$.pipe(takeUntil(this.destroy$)).subscribe(formGroup => {
            if (formGroup) {
                this.form = formGroup;
                this.SHOW_DATA(true);
            }
        });

        this.fGroup.DASHBOARDS_HEADER$.pipe(takeUntil(this.destroy$)).subscribe(dataSaved => {
            if (dataSaved) {
                Object.entries(this.DASHBOARDS_HEADER).forEach(([key, value]) => {
                    (this.DASHBOARDS_HEADER as any)[key] = dataSaved[key] ?? (Array.isArray(value) ? [] : {});
                });
            }
        });

        this.fGroup.DASHBOARDS_DATA$.pipe(takeUntil(this.destroy$)).subscribe(dataSaved => {
            if (dataSaved) {
                Object.keys(this.DASHBOARDS_DATA).forEach(key => {
                    (this.DASHBOARDS_DATA as any)[key] = (dataSaved as any)[key];
                });
            }
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['CHANGE_STATE']) {
            this.stateChange = changes['CHANGE_STATE'].currentValue;
        }
    }


    private SET_DASHBOARDS_HEADER() {
        this.fGroup.SET_DASHBOARDS_HEADER(this.DASHBOARDS_HEADER);
        this.stateChange = new Date();
    }

    private SET_DASHBOARDS_DATA() {
        this.fGroup.SET_DASHBOARDS_DATA(this.DASHBOARDS_DATA);
        this.stateChange = new Date();
    }

    get IS_FILTER_LOADING(): boolean {
        return (this.DASHBOARDS_HEADER.ON_FETCHING as any)[this.DASHBOARD_NAME] == true;
    }

    /**
     * Récupère et affiche les données du rapport.
     */
    SHOW_DATA(showProcess: boolean) {
        if (showProcess) {
            if (!this.form || !this.form.value || this.form.invalid) {
                this.snackbar.showError('Veuillez remplir tous les champs requis.');
                return;
            }
            if (!this.form.value.recos || toArray(this.form.value.recos).length == 0) {
                this.snackbar.show({ msg: 'Veuillez sélectionner au moins un RECO', color: 'warning', position: 'TOP' });
                return;
            }
            if (!this.form.value.months || toArray(this.form.value.months).length == 0) {
                this.snackbar.show({ msg: 'Veuillez sélectionner au moins un mois', color: 'warning', position: 'TOP' });
                return;
            }
            if (!this.form.value.year || !(parseInt(this.form.value.year) > 0)) {
                this.snackbar.show({ msg: 'Veuillez sélectionner au moins une année', color: 'warning', position: 'TOP' });
                return;
            }

            (this.DASHBOARDS_HEADER.ON_FETCHING as any)[this.DASHBOARD_NAME] = true;
            this.SET_DASHBOARDS_HEADER();
        }

        this.fetchDashboards(this.form.value, this.isOnline).subscribe({
            next: (res) => {

                (this.DASHBOARDS_DATA as any)[this.DASHBOARD_NAME] = res;
                this.SET_DASHBOARDS_DATA();

                //     this.MONTH = monthByArg(this.form.value.month).labelFR;
                //     this.YEAR = this.form.value.year;

                if (showProcess) {
                    const msgA = `Aucune données trouvées pour ${this.DASHBOARD_NAME}!`;
                    const msgB = `${this.DASHBOARD_NAME} récupéré avec succès.`;
                    this.snackbar.show({ msg: res?.data ? msgB : msgA, color: res?.data ? 'success' : 'info' });

                    (this.DASHBOARDS_HEADER.ON_FETCHING as any)[this.DASHBOARD_NAME] = false;
                    this.SET_DASHBOARDS_HEADER();
                }

            },
            error: (err) => {
                if (showProcess) {
                    this.snackbar.show({ msg: `Erreur lors du chargement du ${this.DASHBOARD_NAME}.`, color: 'danger', position: 'TOP', duration: 5000 });

                    (this.DASHBOARDS_DATA as any)[this.DASHBOARD_NAME] = undefined;
                    this.SET_DASHBOARDS_DATA();

                    (this.DASHBOARDS_HEADER.ON_FETCHING as any)[this.DASHBOARD_NAME] = false;
                    this.SET_DASHBOARDS_HEADER();
                }
            },
            complete: () => {
                // console.log('Finished!');
            }
        });
    }








    // ###################### FOR VACCINATIONS ######################

    getVaccineInfos(vaccines: RecoVaccinationDashboard[][]): { phone: string, message: string }[] {
        const msg = (vaccineInfo: string[]) => {
            return `Retard de vaccin::\nVous devez anemer votre enfant pour: ${vaccineInfo.join(', ')}`.trim();
        }
        const outPutData: { phone: string, message: string }[] = [];

        const vaccineInfos: { [key: string]: string[] } = {};
        for (const vaccins of vaccines) {
            for (const v of vaccins) {
                if (![undefined, null, 'null', 'undefined', '', ' '].includes(v.parent_phone)) {
                    if (!(v.parent_phone in vaccineInfos)) vaccineInfos[v.parent_phone] = []
                    if (this.vaccinationUtils(v.vaccine_BCG, v.child_age_in_days, 0) == 'off') vaccineInfos[v.parent_phone].push('BCG');
                    if (this.vaccinationUtils(v.vaccine_VPO_0, v.child_age_in_days, 0) == 'off') vaccineInfos[v.parent_phone].push('VPO0');
                    if (this.vaccinationUtils(v.vaccine_PENTA_1, v.child_age_in_days, 42) == 'off') vaccineInfos[v.parent_phone].push('PENTA1');
                    if (this.vaccinationUtils(v.vaccine_VPO_1, v.child_age_in_days, 42) == 'off') vaccineInfos[v.parent_phone].push('VPO1');
                    if (this.vaccinationUtils(v.vaccine_PENTA_2, v.child_age_in_days, 70) == 'off') vaccineInfos[v.parent_phone].push('PENTA2');
                    if (this.vaccinationUtils(v.vaccine_VPO_2, v.child_age_in_days, 70) == 'off') vaccineInfos[v.parent_phone].push('VPO2');
                    if (this.vaccinationUtils(v.vaccine_PENTA_3, v.child_age_in_days, 98) == 'off') vaccineInfos[v.parent_phone].push('PENTA3');
                    if (this.vaccinationUtils(v.vaccine_VPO_3, v.child_age_in_days, 98) == 'off') vaccineInfos[v.parent_phone].push('VPO3');
                    if (this.vaccinationUtils(v.vaccine_VPI_1, v.child_age_in_days, 98) == 'off') vaccineInfos[v.parent_phone].push('VPI1');
                    if (this.vaccinationUtils(v.vaccine_VAR_1, v.child_age_in_months, 9) == 'off') vaccineInfos[v.parent_phone].push('VAR1');
                    if (this.vaccinationUtils(v.vaccine_VAA, v.child_age_in_months, 9) == 'off') vaccineInfos[v.parent_phone].push('VAA');
                    if (this.vaccinationUtils(v.vaccine_VPI_2, v.child_age_in_months, 9) == 'off') vaccineInfos[v.parent_phone].push('VPI2');
                    if (this.vaccinationUtils(v.vaccine_MEN_A, v.child_age_in_months, 15) == 'off') vaccineInfos[v.parent_phone].push('MENA');
                    if (this.vaccinationUtils(v.vaccine_VAR_2, v.child_age_in_months, 15) == 'off') vaccineInfos[v.parent_phone].push('VAR2');
                }
            }
        }

        for (const key of Object.keys(vaccineInfos)) {
            if (vaccineInfos[key].length > 0) {
                outPutData.push({ phone: formatGuineaPhone(key), message: msg(vaccineInfos[key]) })
            }
        }

        return outPutData;

    }

    vaccineUtils(arg0: boolean, arg1: number, arg2: number): { class: 'vaccine-on' | 'vaccine-off' | 'vaccine-NA', action: '&#10003;' | '&times;' | 'NA' } {
        const dt = this.vaccinationUtils(arg0, arg1, arg2);
        return {
            class: dt == 'on' ? 'vaccine-on' : dt == 'off' ? 'vaccine-off' : 'vaccine-NA',
            action: dt == 'on' ? '&#10003;' : dt == 'off' ? '&times;' : 'NA'
        };
    }

    vaccinationUtils(arg0: boolean, arg1: number, arg2: number): 'on' | 'off' | 'na' {
        if (arg1 >= arg2) return arg0 === true ? 'on' : 'off';
        return 'na';
    }

    quantityStyle(data: number) {
        if (data < 0) return 'quantity-error'
        return data > 0 ? 'quantity-up' : 'quantity-down';
    }



    async sendSms(event: Event, data?: { phone: string }) { }
    async sendCustomSms(event: Event, data?: { vaccine: RecoVaccinationDashboard }) { }

}
