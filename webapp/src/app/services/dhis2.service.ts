import { Injectable, OnDestroy } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { BehaviorSubject, from, Observable, Subject, takeUntil } from 'rxjs';
import { ApiService } from './api.service';
import { ReportsData, ReportsHealth } from '@kossi-models/reports-selectors';
import { RecosMap } from '@kossi-models/org-unit-interface';
import { ConnectivityService } from './connectivity.service';
import { FormGroupService } from './form-group.service';
import { toArray } from '@kossi-shared/functions';
import { Dhis2DataValueSetParams } from '@kossi-models/dhis2';
import { UserContextService } from './user-context.service';
import { SnakBarOutPut } from '@kossi-models/interfaces';
import { LocalDbDataFetchService } from './local-db-data-fetch.service';


@Injectable({
    providedIn: 'root',
})
export class Dhis2Service implements OnDestroy {
    private dhis2SendingSubject = new BehaviorSubject<SnakBarOutPut | undefined>(undefined);

    Recos$!: RecosMap[];
    isOnline: boolean = false;

    private destroy$ = new Subject<void>();

    REPORTS_HEADER: ReportsHealth = {
        ON_FETCHING: {},
        IS_VALIDATED: {},
        IS_ON_DHIS2: {},
        ON_VALIDATION: {},
        ON_CANCEL_VALIDATION: {},
        ON_DHIS2_SENDING: {},
        ON_DHIS2_SENDING_ERROR: {}
    };

    REPORTS_DATA: ReportsData = {
        MONTHLY_ACTIVITY: undefined,
        FAMILY_PLANNING: undefined,
        HOUSE_HOLD_RECAP: undefined,
        MORBIDITY: undefined,
        PCIMNE_NEWBORN: undefined,
        PROMOTION: undefined,
        RECO_MEG_QUANTITIES: undefined,
    };

    constructor(protected userCtx: UserContextService, protected conn: ConnectivityService, protected fGroup: FormGroupService, private api: ApiService, private ldbfetch: LocalDbDataFetchService) {
        this.getCurrentUser();
        this.conn.getOnlineStatus().pipe(takeUntil(this.destroy$)).subscribe(isOnline => {
            this.isOnline = isOnline;
        });

        this.fGroup.REPORTS_HEADER$.pipe(takeUntil(this.destroy$)).subscribe(dataSaved => {
            if (dataSaved) {
                Object.entries(this.REPORTS_HEADER).forEach(([key, value]) => {
                    (this.REPORTS_HEADER as any)[key] = dataSaved[key] ?? (Array.isArray(value) ? [] : {});
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

    public getDhis2SendingStatus(): Observable<SnakBarOutPut | undefined> {
        return this.dhis2SendingSubject.asObservable();
    }

    public async sendReportsToDhis2(params: { 
        form: FormGroup | undefined, dhis2Form: FormGroup | undefined, reportNames: string[] | undefined, 
        onStart: (data:SnakBarOutPut | undefined) => void,
        onProcess: (data:SnakBarOutPut | undefined) => void,
        onSuccess: (data:SnakBarOutPut | undefined) => void,
        onError: (data:SnakBarOutPut | undefined) => void, 
        onWarning: (data:SnakBarOutPut | undefined) => void 
    }): Promise<void> {
        params.onError({ msg: `Démarrage de l'envoi au DHIS2 ...`, color: 'default' });

        if (!params.form?.valid || !params.dhis2Form?.valid || !this.Recos$?.length || !params.reportNames?.length) {
            params.onError({ msg: `Informations non suffisante pour l'envoi des données au DHIS2`, color: 'danger', position: 'TOP' });
            return;
        }

        const year: string = params.form.value.year;
        const months: string[] = toArray(params.form.value.months);
        const dhis2Orgunits: { id: string, external_id: string, name: string }[] = params.dhis2Form.value.dhis2_orgunits ?? [];
        const dhis2Username: string = params.dhis2Form.value.dhis2_username;
        const dhis2Password: string = params.dhis2Form.value.dhis2_password;

        if (!year || !months.length || !dhis2Orgunits.length || !dhis2Username || !dhis2Password) {
            params.onWarning({ msg: `Informations invalides pour l'envoi au DHIS2`, color: 'warning' });
            return;
        }


        for (const reportName of params.reportNames) {

            await this.updateReportHeader(reportName, true, false);

            for (const month of months) {
                for (const orgUnit of dhis2Orgunits) {

                    const recos = this.Recos$.filter(r => r.hospital_id === orgUnit.id).map(r => r.id);

                    if ((recos ?? []).length == 0) {
                        await this.updateReportHeader(reportName, false, true);
                        params.onError({ msg: `Pas de RECO trouvés pour: [${reportName}, ${orgUnit.name}]`, color: 'danger' });
                        continue;
                    }

                    const paramsToFetch = { months: [month], year: parseInt(year), recos: recos };

                    const fetchApiMethod = from(this.getFetchMethod(reportName, paramsToFetch, true));
                    if (!fetchApiMethod) {
                        await this.updateReportHeader(reportName, false, true);
                        params.onError({ msg: `Informations invalides pour: [${reportName}, ${orgUnit.name}]`, color: 'danger' });
                        continue;
                    }

                    fetchApiMethod.subscribe({
                        next: async (res) => {
                            
                            if (!res || !res?.data) {
                                await this.updateReportHeader(reportName, false, true);
                                params.onWarning({ msg: `Données non trouvés pour: [${reportName}, ${orgUnit.name}]`, color: 'warning' });
                                return;
                            };

                            const dhis2Params: Dhis2DataValueSetParams = {
                                months: [month],
                                year: parseInt(year),
                                recos: recos,
                                username: dhis2Username,
                                password: dhis2Password,
                                data: res?.data,
                                period: { year: year, month: month },
                                orgunit: orgUnit.id,
                            }

                            const dhis2ApiMethod = this.getSendMethod(reportName, dhis2Params);
                            if (!dhis2ApiMethod) {
                                await this.updateReportHeader(reportName, false, true);
                                params.onWarning({ msg: `Impossible d'effectuer l'envoi pour: [${reportName}, ${orgUnit.name}]`, color: 'warning' });
                                return;
                            };

                            // params.onProcess({ msg: `Envoi des données ${reportName} au DHIS2 pour ${orgUnit.name}`, color: 'info', duration: 10000 });

                            dhis2ApiMethod.subscribe({
                                next: async (response: { status: number, data: string }) => {
                                    if (response.status === 200) {
                                        await this.updateReportHeader(reportName, false, false);
                                        params.onSuccess({ msg: `Données ${reportName} pour ${orgUnit.name} envoyées avec succès au DHIS2`, color: 'success' });
                                    } else {
                                        await this.updateReportHeader(reportName, false, true);
                                        // response.data ?? 
                                        params.onError({ msg: `Oups!!! Données ${reportName} pour ${orgUnit.name} non envoyées au DHIS2`, color: 'danger' });
                                    }
                                },
                                error: async (err) => {
                                    await this.updateReportHeader(reportName, false, true);
                                    // err.message || 
                                    params.onError({ msg: `Erreur inconnue avec ${reportName} pour ${orgUnit.name}`, color: 'danger' });

                                },
                                complete: async () => {
                                    // console.log('Finished!');
                                }
                            });
                        },
                        error: async (err) => {
                            await this.updateReportHeader(reportName, false, true);
                            params.onError({ msg: `Erreur lors de la récupération des données avec ${reportName} pour ${orgUnit.name}: ${err.message}`, color: 'danger' });
                        },
                        complete: async () => {
                            // console.log('Finished!');
                        }
                    });
                }
            }
        }
    }


    private async getCurrentUser() {
        const user = await this.userCtx.currentUser();
        if (!this.Recos$ || this.Recos$.length == 0) this.Recos$ = user?.recos ?? [];
    }

    private async updateReportHeader(reportName: string, sending: boolean, error: boolean): Promise<void> {
        (this.REPORTS_HEADER.ON_DHIS2_SENDING as any)[reportName] = sending;
        (this.REPORTS_HEADER.ON_DHIS2_SENDING_ERROR as any)[reportName] = error;
        await this.fGroup.SET_REPORTS_HEADER(this.REPORTS_HEADER);
    }

    private async getFetchMethod(reportName: string, params: { months: string[], year: number, recos: string[] }, isOnline: boolean = true): Promise<any> {
        return {
            'MONTHLY_ACTIVITY': this.ldbfetch.GetChwsRecoReports(params, isOnline),
            'FAMILY_PLANNING': this.ldbfetch.GetFamilyPlanningReports(params, isOnline),
            'HOUSE_HOLD_RECAP': this.ldbfetch.GetHouseholdRecapReports(params, isOnline),
            'MORBIDITY': this.ldbfetch.GetMorbidityReports(params, isOnline),
            'PCIMNE_NEWBORN': this.ldbfetch.GetPcimneNewbornReports(params, isOnline),
            'PROMOTION': this.ldbfetch.GetPromotionReports(params, isOnline),
            'RECO_MEG_QUANTITIES': this.ldbfetch.GetRecoMegSituationReports(params, isOnline),
        }[reportName];
    }



    private getSendMethod(reportName: string, params: Dhis2DataValueSetParams): Observable<any> | undefined {
        return {
            'MONTHLY_ACTIVITY': this.api.SendChwsRecoReportsToDhis2(params),
            'FAMILY_PLANNING': this.api.SendFamilyPlanningActivitiesToDhis2(params),
            'HOUSE_HOLD_RECAP': this.api.SendHouseholdActivitiesToDhis2(params),
            'MORBIDITY': this.api.SendMorbidityActivitiesToDhis2(params),
            'PCIMNE_NEWBORN': this.api.SendPcimneNewbornActivitiesToDhis2(params),
            'PROMOTION': this.api.SendPromotionActivitiesToDhis2(params),
            'RECO_MEG_QUANTITIES': this.api.SendRecoMegSituationActivitiesToDhis2(params),
        }[reportName];
    }






    // SHOW_DATA<T>(form: FormGroup | undefined, reportNames: string[] | undefined, afterSuccess: (data: { REPORTS: T | T[] | undefined; REPORTS_TOTAL: T | T[] | undefined }) => Promise<void>, showProcess: boolean): void {
    //     if (!form?.valid || !this.Recos$?.length || !reportNames?.length) {
    //         this.dhis2SendingSubject.next({ msg: `Informations non suffisante pour l'envoi des données au DHIS2`, color: 'danger', position: 'TOP', duration: 5000 });
    //         return;
    //     }

    //     if (showProcess) {
    //         if (!form || !form.value || form.invalid) {
    //             this.snackbar.showError('Veuillez remplir tous les champs requis.');
    //             return;
    //         }
    //         if (!form.value.recos || toArray(form.value.recos).length == 0) {
    //             this.snackbar.show({ msg: 'Veuillez sélectionner au moins un RECO', color: 'warning', position: 'TOP' });
    //             return;
    //         }
    //         if (!form.value.months || toArray(form.value.months).length == 0) {
    //             this.snackbar.show({ msg: 'Veuillez sélectionner au moins un mois', color: 'warning', position: 'TOP' });
    //             return;
    //         }
    //         if (!form.value.year || !(parseInt(form.value.year) > 0)) {
    //             this.snackbar.show({ msg: 'Veuillez sélectionner au moins une année', color: 'warning', position: 'TOP' });
    //             return;
    //         }

    //         // this.REPORTS_HEADER.ORG_UNIT_TO_SEND_DATA = form.value.org_units.hospital
    //         // this.REPORTS_HEADER.ALL_NEEDED_RECOS = form.value.all_recos_ids;
    //         // this.REPORTS_HEADER.SELECTED_RECOS = form.value.selected_recos_ids;
    //     }

    //     for (const reportName of reportNames) {


    //         (this.REPORTS_HEADER.ON_FETCHING as any)[reportName] = true;

    //         this.fGroup.SET_REPORTS_HEADER(this.REPORTS_HEADER);


    //         let fetchApiMethod: Observable<any> | undefined = undefined;

    //         const paramToFecth = { months: form.value.months, year: form.value.year, recos: form.value.recos };

    //         if (reportName == 'MONTHLY_ACTIVITY') fetchApiMethod = this.api.GetChwsRecoReports(paramToFecth);
    //         if (reportName == 'FAMILY_PLANNING') fetchApiMethod = this.api.GetFamilyPlanningReports(paramToFecth);
    //         if (reportName == 'HOUSE_HOLD_RECAP') fetchApiMethod = this.api.GetHouseholdRecapReports(paramToFecth);
    //         if (reportName == 'MORBIDITY') fetchApiMethod = this.api.GetMorbidityReports(paramToFecth);
    //         if (reportName == 'PCIMNE_NEWBORN') fetchApiMethod = this.api.GetPcimneNewbornReports(paramToFecth);
    //         if (reportName == 'PROMOTION') fetchApiMethod = this.api.GetPromotionReports(paramToFecth);
    //         if (reportName == 'RECO_MEG_QUANTITIES') fetchApiMethod = this.api.GetRecoMegSituationReports(paramToFecth);

    //         if (!fetchApiMethod) {
    //             return;
    //         }


    //         let isRecoConnected = false;

    //         fetchApiMethod.subscribe({
    //             next: async (res) => {
    //                 let response;

    //                 if (reportName == 'HOUSE_HOLD_RECAP') {
    //                     response = res as IndicatorsDataOutput<T[]> | undefined;
    //                     await afterSuccess({REPORTS:response?.out.data, REPORTS_TOTAL:response?.total});

    //                     // REPORTS = response?.out.data;
    //                     // REPORTS_TOTAL = response?.total;
    //                     // CAN_VISIBLE = (response?.out.data && this._formGroup.value.recos.length > 0) === true;
    //                     (this.REPORTS_HEADER.IS_VALIDATED as any)[reportName] = response?.out.is_validate === true;
    //                     (this.REPORTS_HEADER.IS_ON_DHIS2 as any)[reportName] = response?.out.already_on_dhis2 === true;

    //                     response = response?.out;

    //                 } else if (reportName == 'PCIMNE_NEWBORN') {
    //                     response = res as T | undefined;
    //                     // REPORTS = response;
    //                 } else {
    //                     response = res as IndicatorsDataOutput<T> | undefined;
    //                     // REPORTS = response?.data;
    //                 }

    //                 isRecoConnected = (response as any)?.['reco_asc_type'] === 'RECO';
    //                 // CAN_VISIBLE = (response && form.value.recos.length > 0) === true;
    //                 (this.REPORTS_HEADER.IS_VALIDATED as any)[reportName] = (response as any)?.['is_validate'] === true;
    //                 (this.REPORTS_HEADER.IS_ON_DHIS2 as any)[reportName] = (response as any)?.['already_on_dhis2'] === true;

    //                 if (showProcess) {
    //                     (this.REPORTS_HEADER.ON_FETCHING as any)[reportName] = false;
    //                     if (!res) {
    //                         this.snackbar.show({ msg: `Aucune données trouvé pour ${reportName}!`, color: 'info', position: 'TOP', duration: 5000 });
    //                     } else {
    //                         this.snackbar.show({ msg: `${reportName} récupéré avec succès.`, color: 'success', position: 'TOP', duration: 5000 });
    //                     }
    //                 }

    //                 (this.REPORTS_DATA as any)[reportName] = response;

    //                 this.fGroup.SET_REPORTS_DATA(this.REPORTS_DATA);

    //                 this.fGroup.SET_REPORTS_HEADER(this.REPORTS_HEADER);

    //             },
    //             error: (err) => {
    //                 if (showProcess) {
    //                     this.snackbar.show({ msg: `Erreur lors du chargement du ${reportName}.`, color: 'danger', position: 'TOP', duration: 5000 });
    //                     (this.REPORTS_HEADER.ON_FETCHING as any)[reportName] = false;
    //                     (this.REPORTS_DATA as any)[reportName] = undefined;
    //                     this.fGroup.SET_REPORTS_DATA(this.REPORTS_DATA);

    //                     this.fGroup.SET_REPORTS_HEADER(this.REPORTS_HEADER);
    //                 }
    //             },
    //             complete: () => {
    //                 // console.log('Finished!');
    //             }
    //         });
    //     }
    // }



}
