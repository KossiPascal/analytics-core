import { Component, Inject, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ConnectivityService } from '@kossi-services/connectivity.service';
import { SnackbarService } from '@kossi-services/snackbar.service';
import { Observable, Subject, takeUntil } from 'rxjs';
import { IndicatorsDataOutput } from '@kossi-models/interfaces';
import { FormGroupService } from '@kossi-services/form-group.service';
import { toArray } from '@kossi-shared/functions';
import { AFTER_FETCHED_MAPS, FETCH_MAPS, MAPS_UTILS, ON_MAPS_INIT } from './maps-injection-tokens';
import { MapsData, MapsHealth } from '@kossi-models/maps-selectors';
import { User } from '@kossi-models/user-role';
import { UserContextService } from '@kossi-services/user-context.service';
import { ExportDataComponent } from '@kossi-components/export-data/export-data.component';


@Component({
    selector: 'app-reco-data-maps',
    template: ``,
    styles: [``]
})
export abstract class BaseMapsComponent<T> extends ExportDataComponent<any> implements OnInit, OnDestroy, OnChanges {

    private stateChange!: any;
    @Input() CHANGE_STATE: any;

    protected form!: FormGroup<any>;

    MAP_NAME = 'MAP';
    MONTH!: string;
    YEAR!: number;
    isOnline: boolean = false;
    destroy$ = new Subject<void>();

    MAPS_DATA: MapsData = {
        RECOS_MAPS: undefined,
        FS_MAPS: undefined,
    };

    MAPS_HEADER: MapsHealth = {
        ON_FETCHING: {},
    };

    USER!: User | null;


    constructor(
        fGroup: FormGroupService,
        conn: ConnectivityService,
        snackbar: SnackbarService,
        userCtx: UserContextService,
        @Inject(MAPS_UTILS) protected MAP_UTILS: {
            fetchMaps: (formData: any, isOnline: boolean) => Observable<IndicatorsDataOutput<T> | IndicatorsDataOutput<T[]> | undefined>,
            afterFetchedMaps: (data: IndicatorsDataOutput<T> | IndicatorsDataOutput<T[]> | undefined) => Promise<void>,
            onMapsInit: () => Promise<void>,
        }




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
        this.conn.onlineStatus$.pipe(takeUntil(this.destroy$)).subscribe(isOnline => {
            this.isOnline = isOnline;
        });

        this.fGroup.formGroup$.pipe(takeUntil(this.destroy$)).subscribe(formGroup => {
            if (formGroup) {
                this.form = formGroup;
                this.SHOW_DATA(true);
            }
        });

        this.fGroup.MAPS_HEADER$.pipe(takeUntil(this.destroy$)).subscribe(dataSaved => {
            if (dataSaved) {
                Object.entries(this.MAPS_HEADER).forEach(([key, value]) => {
                    (this.MAPS_HEADER as any)[key] = dataSaved[key] ?? (Array.isArray(value) ? [] : {});
                });
            }
        });

        this.fGroup.MAPS_DATA$.pipe(takeUntil(this.destroy$)).subscribe(dataSaved => {
            if (dataSaved) {
                Object.keys(this.MAPS_DATA).forEach(key => {
                    (this.MAPS_DATA as any)[key] = (dataSaved as any)[key];
                });
            }
        });

        this.MAP_UTILS.onMapsInit()
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


    private SET_MAPS_HEADER() {
        this.fGroup.SET_MAPS_HEADER(this.MAPS_HEADER);
        this.stateChange = new Date();
    }

    private SET_MAPS_DATA() {
        this.fGroup.SET_MAPS_DATA(this.MAPS_DATA);
        this.stateChange = new Date();
    }

    get IS_FILTER_LOADING(): boolean {
        return (this.MAPS_HEADER.ON_FETCHING as any)[this.MAP_NAME] == true;
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

            (this.MAPS_HEADER.ON_FETCHING as any)[this.MAP_NAME] = true;
            this.SET_MAPS_HEADER();
        }

        this.MAP_UTILS.fetchMaps(this.form.value, this.isOnline).subscribe({
            next: (res) => {

                (this.MAPS_DATA as any)[this.MAP_NAME] = res;
                this.SET_MAPS_DATA();

                //     this.MONTH = monthByArg(this.form.value.month).labelFR;
                //     this.YEAR = this.form.value.year;

                if (showProcess) {
                    const msgA = `Aucune données trouvées pour ${this.MAP_NAME}!`;
                    const msgB = `${this.MAP_NAME} récupéré avec succès.`;
                    this.snackbar.show({ msg: res?.data ? msgB : msgA, color: res?.data ? 'success' : 'info' });

                    (this.MAPS_HEADER.ON_FETCHING as any)[this.MAP_NAME] = false;
                    this.SET_MAPS_HEADER();

                    this.MAP_UTILS.afterFetchedMaps((this.MAPS_DATA as any)[this.MAP_NAME]);
                }

            },
            error: (err) => {
                if (showProcess) {
                    this.snackbar.show({ msg: `Erreur lors du chargement du ${this.MAP_NAME}.`, color: 'danger', position: 'TOP', duration: 5000 });

                    (this.MAPS_DATA as any)[this.MAP_NAME] = undefined;
                    this.SET_MAPS_DATA();

                    (this.MAPS_HEADER.ON_FETCHING as any)[this.MAP_NAME] = false;
                    this.SET_MAPS_HEADER();

                    this.MAP_UTILS.afterFetchedMaps((this.MAPS_DATA as any)[this.MAP_NAME]);
                }
            },
            complete: () => {
                // console.log('Finished!');
            }
        });
    }


}
