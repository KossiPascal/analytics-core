import { Component, Inject, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ConnectivityService } from '@kossi-services/connectivity.service';
import { DbSyncService } from '@kossi-services/db-sync.service';
import { SnackbarService } from '@kossi-services/snackbar.service';
import { UserContextService } from '@kossi-services/user-context.service';
import { Observable, Subject, takeUntil } from 'rxjs';
import { IndicatorsDataOutput } from '@kossi-models/interfaces';
import { ReportsData, ReportsFilterData, ReportsHealth } from '@kossi-models/reports-selectors';
import { FormGroupService } from '@kossi-services/form-group.service';
import { toArray } from '@kossi-shared/functions';
import { FETCH_REPORTS, VALIDATE_REPORT, CANCEL_VALIDATION_REPORT, SEND_REPORT_TO_DHIS2 } from './reports-injection-tokens';
import { RecosMap } from '@kossi-models/org-unit-interface';
import { Dhis2Service } from '@kossi-services/dhis2.service';
import { SnakBarOutPut } from '@kossi-models/interfaces';
import { User } from '@kossi-models/user-role';


@Component({
    selector: 'app-report', // Choose an appropriate selector for your component
    template: ``,
    styles: [``]
})
export abstract class BaseReportsComponent<T> implements OnInit, OnDestroy, OnChanges {

    private stateChange!: any;
    @Input() CHANGE_STATE: any;

    protected form!: FormGroup<any>;

    REPPORT_NAME = 'REPORT';
    Recos$!: RecosMap[];
    isOnline: boolean = false;
    destroy$ = new Subject<void>();
    isRecoConnected!: boolean;
    activeHideZero!: boolean;

    USER!:User|null;

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
        ON_DHIS2_SENDING_ERROR: {}
    };

    REPORTS_FILTER: ReportsFilterData = {
        RECOS_NEEDED: [],
        RECOS_SELECTED: [],
        SEND_DHIS2_ORGUNITS: [],
    }

    constructor(
        protected fGroup: FormGroupService,
        protected db: DbSyncService,
        protected userCtx: UserContextService,
        protected conn: ConnectivityService,
        protected snackbar: SnackbarService,
        protected dhis2Service: Dhis2Service,
        @Inject(FETCH_REPORTS) protected fetchReports: (formData: any, isOnline: boolean) => Observable<IndicatorsDataOutput<T> | IndicatorsDataOutput<T[]> | undefined>,
        @Inject(VALIDATE_REPORT) protected validateReport: (formData: any) => Observable<any>,
        @Inject(CANCEL_VALIDATION_REPORT) protected cancelValidationReport: (formData: any) => Observable<any>,
        @Inject(SEND_REPORT_TO_DHIS2) protected sendReportToDhis2: (dhis2Params: any) => Observable<any>
    ) {
        this.initializeComponent();
        this.isOnline = this.conn.isOnline;
    }

    private async initializeComponent(){
        if (!this.USER) {
            this.USER = await this.userCtx.currentUser();
            if (!this.Recos$ || this.Recos$.length == 0) this.Recos$ = this.USER?.recos ?? [];
        }
    }
    
    get canValidateReportsData() {
        return this.USER?.role.canValidateData ?? false;
    }

    get canSendValidatedReportToDhis2() {
        return this.canValidateReportsData && (this.USER?.role.canValidateData ?? false);
    }

    ngOnInit(): void {
        this.conn.onlineStatus$.pipe(takeUntil(this.destroy$)).subscribe(isOnline => {
            this.isOnline = isOnline;
        });

        this.fGroup.formGroup$.pipe(takeUntil(this.destroy$)).subscribe(formGroup => {
            if (formGroup) {
                this.form = formGroup;
                this.SHOW_DATA(true);
            }
        });

        // this.fGroup.dhis2FormGroup$.pipe(takeUntil(this.destroy$)).subscribe(dhis2FormGroup => {
        //     if (dhis2FormGroup) {
        //         this.dhis2Form = dhis2FormGroup;
        //     }
        // });

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

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['CHANGE_STATE']) {
            this.stateChange = changes['CHANGE_STATE'].currentValue;
        }
    }

    private SET_REPORTS_HEADER() {
        this.fGroup.SET_REPORTS_HEADER(this.REPORTS_HEADER);
        this.stateChange = new Date();
    }

    private SET_REPORTS_FILTER_DATA() {
        this.fGroup.SET_REPORTS_FILTER(this.REPORTS_FILTER);
        this.stateChange = new Date();
    }

    private UPDATE_REPORT_FIELD(field: string, value: boolean | string) {
        const old = (this.REPORTS_HEADER as any)[field];
        if (old) {
            (this.REPORTS_HEADER as any)[field][this.REPPORT_NAME] = value;
            this.SET_REPORTS_HEADER();
        }
    }

    hideZero(fieldId: string) {
        const checkbox = document.getElementById(fieldId) as HTMLInputElement;
        this.activeHideZero = checkbox && checkbox.checked;
    }

    shawValue(value: any) {
        return this.activeHideZero ? (value == 0 || value == '0' ? '' : value) : value;
    }

    get IS_FILTER_LOADING():boolean {
        return (this.REPORTS_HEADER.ON_FETCHING as any)[this.REPPORT_NAME] == true;
    }
    
    SHOW_DATA(showProcess: boolean): void {
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

            this.REPORTS_FILTER.SEND_DHIS2_ORGUNITS = this.form.value.org_units.hospital
            this.REPORTS_FILTER.RECOS_NEEDED = this.form.value.all_recos_ids;
            this.REPORTS_FILTER.RECOS_SELECTED = this.form.value.selected_recos_ids;
            this.SET_REPORTS_FILTER_DATA();

            (this.REPORTS_HEADER.ON_FETCHING as any)[this.REPPORT_NAME] = true;
            this.SET_REPORTS_HEADER();
        }

        this.fetchReports(this.form.value, this.isOnline).subscribe({
            next: (res) => {

                this.isRecoConnected = res?.reco_asc_type === 'RECO';
                // this.CAN_VISIBLE = (response && this.form.value.recos.length > 0) === true;
                (this.REPORTS_HEADER.IS_VALIDATED as any)[this.REPPORT_NAME] = res?.is_validate === true;
                (this.REPORTS_HEADER.IS_ON_DHIS2 as any)[this.REPPORT_NAME] = res?.already_on_dhis2 === true;

                (this.REPORTS_DATA as any)[this.REPPORT_NAME] = res;
                this.fGroup.SET_REPORTS_DATA(this.REPORTS_DATA);

                if (showProcess) {
                    const msgA = `Aucune données trouvées pour ${this.REPPORT_NAME}!`;
                    const msgB = `${this.REPPORT_NAME} récupéré avec succès.`;
                    this.snackbar.show({ msg: res?.data ? msgB : msgA, color: res?.data ? 'success' : 'info' });

                    (this.REPORTS_HEADER.ON_FETCHING as any)[this.REPPORT_NAME] = false;
                    this.SET_REPORTS_HEADER();
                }

            },
            error: (err) => {
                if (showProcess) {
                    this.snackbar.show({ msg: `Erreur lors du chargement du ${this.REPPORT_NAME}.`, color: 'danger', position: 'TOP', duration: 5000 });
                    
                    (this.REPORTS_DATA as any)[this.REPPORT_NAME] = undefined;
                    this.fGroup.SET_REPORTS_DATA(this.REPORTS_DATA);

                    (this.REPORTS_HEADER.ON_FETCHING as any)[this.REPPORT_NAME] = false;
                    this.SET_REPORTS_HEADER();
                }
            },
            complete: () => {
                // console.log('Finished!');
            }
        });
    }
    
    validateData(): void {
        if (!this.form) return;
        this.UPDATE_REPORT_FIELD('ON_VALIDATION', true);
        let paramsToSend = this.form.value;
        if (this.REPPORT_NAME == 'HOUSE_HOLD_RECAP') {
            const dataIds = (((this.REPORTS_DATA as any)[this.REPPORT_NAME])?.data as T[])?.map(h => (h as any).id) ?? [];
            paramsToSend = { ...this.form.value, dataIds };
        }
        this.validateReport(paramsToSend).subscribe({
            next: async (_c$: { status: number, data: string }) => {
                if (_c$.status == 200) {
                    this.SHOW_DATA(false);
                    this.UPDATE_REPORT_FIELD('ON_VALIDATION', false);
                    this.UPDATE_REPORT_FIELD('IS_VALIDATED', true);
                    this.snackbar.show({ msg: `${this.REPPORT_NAME} validé avec succès.`, color: 'success', position: 'TOP' });
                    if (this.USER?.role.canUseOfflineMode === true && this.isOnline) {
                        await this.db.all(this.form.value).then(res => { });
                    }
                } else {
                    this.UPDATE_REPORT_FIELD('ON_VALIDATION', false);
                    this.snackbar.show({ msg: `Impossible de valider ${this.REPPORT_NAME}.`, color: 'warning', position: 'TOP' });
                }
            },
            error: (err) => {
                this.UPDATE_REPORT_FIELD('ON_VALIDATION', false);
                this.snackbar.show({ msg: `Erreur lors de la validation du ${this.REPPORT_NAME}.`, color: 'danger', position: 'TOP' });
            }
        });
    }
    
    cancelValidation(): void {
        if (!this.form) return;
        this.UPDATE_REPORT_FIELD('ON_CANCEL_VALIDATION', true);
        let paramsToSend = this.form.value;
        if (this.REPPORT_NAME == 'HOUSE_HOLD_RECAP') {
            const dataIds = (((this.REPORTS_DATA as any)[this.REPPORT_NAME])?.data as T[])?.map(h => (h as any).id) ?? [];
            paramsToSend = { ...this.form.value, dataIds };
        }
        this.cancelValidationReport(paramsToSend).subscribe({
            next: async (_c$: { status: number, data: string }) => {
                if (_c$.status == 200) {
                    this.SHOW_DATA(false);
                    this.snackbar.show({ msg: `Validation du ${this.REPPORT_NAME} annulée.`, color: 'success', position: 'TOP' });
                    this.UPDATE_REPORT_FIELD('ON_CANCEL_VALIDATION', false);
                    this.UPDATE_REPORT_FIELD('IS_VALIDATED', false);
                    if (this.USER?.role.canUseOfflineMode === true && this.isOnline) {
                        await this.db.all(this.form.value).then(res => { });
                    }
                } else {
                    this.UPDATE_REPORT_FIELD('ON_CANCEL_VALIDATION', false);
                }
            },
            error: (err) => {
                this.snackbar.showError(`Erreur lors de l'annulation de la validation.`);
                this.UPDATE_REPORT_FIELD('ON_CANCEL_VALIDATION', false);
            }
        });
    }
    
    sendDataToDhis2(dhis2FormGroup?: FormGroup) {
        this.dhis2Service.sendReportsToDhis2({
            form: this.form, dhis2Form: dhis2FormGroup, reportNames: [this.REPPORT_NAME],
            onStart: (data: SnakBarOutPut | undefined) => {
                this.showProcessMessage(data);
            },
            onProcess: (data: SnakBarOutPut | undefined) => {
                this.showProcessMessage(data);
            },
            onSuccess: (data: SnakBarOutPut | undefined) => {
                this.showProcessMessage(data);
            },
            onError: (data: SnakBarOutPut | undefined) => {
                this.showProcessMessage(data);
            },
            onWarning: (data: SnakBarOutPut | undefined) => {
                this.showProcessMessage(data);
            }
        })
    }

    showProcessMessage(data: SnakBarOutPut | undefined) {
        if (data) {
            this.snackbar.show({ msg: data.msg, color: data.color, position: data.position ?? 'TOP', duration: 10000 });
            this.CHANGE_STATE = new Date();
        }
    }
}
