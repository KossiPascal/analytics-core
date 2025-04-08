import { Component, Inject, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ConnectivityService } from '@kossi-services/connectivity.service';
import { SnackbarService } from '@kossi-services/snackbar.service';
import { Observable, Subject, takeUntil } from 'rxjs';
import { IndicatorsDataOutput } from '@kossi-models/interfaces';
import { FormGroupService } from '@kossi-services/form-group.service';
import { toArray } from '@kossi-shared/functions';
import { FETCH_DASHBOARDS } from './dashboards-injection-tokens';
import { DashboardsData, DashboardsHealth } from '@kossi-models/dashboards-selectors';
import { User } from '@kossi-models/user-role';
import { UserContextService } from '@kossi-services/user-context.service';
import { ExportDataComponent } from '@kossi-components/export-data/export-data.component';


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

    DASHBOARDS_DATA: DashboardsData = {
        RECOS_PERFORMANCES: undefined,
        RECOS_VACCINES: undefined,
    };

    DASHBOARDS_HEADER: DashboardsHealth = {
        ON_FETCHING: {},
    };

    USER!:User|null;


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
        this.isOnline = this.conn.isOnline();
    }

    private async initializeComponent(){
        this.USER = await this.userCtx.currentUser();
    }

    ngOnInit(): void {
        this.conn.getOnlineStatus().pipe(takeUntil(this.destroy$)).subscribe(isOnline => {
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


}
