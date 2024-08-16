import { Entity, Column, Repository, DataSource, PrimaryColumn } from "typeorm"
import { AppDataSource } from "../data_source"
import { RecoPerformanceDashboardUtils, RecoVaccinationDashboardUtils } from "../utils/Interfaces";

// export enum FlightType { DOMESTIC = "domestic", INTERNATIONAL = "international" }
let Connection: DataSource = AppDataSource.manager.connection;


@Entity()
export class RecoPerformanceDashboard {

    @PrimaryColumn({ type: 'text', nullable: false })
    id!: string

    @Column({ type: 'bigint', nullable: false })
    year!: number

    @Column({ type: 'varchar', nullable: false })
    month!: string

    @Column({ type: 'bigint', nullable: false })
    householdCount!: number

    @Column({ type: 'bigint', nullable: false })
    patientCount!: number

    @Column({ type: 'bigint', nullable: false })
    newborn0To2MonthsCount!: number

    @Column({ type: 'bigint', nullable: false })
    child2To60MonthsCount!: number

    @Column({ type: 'bigint', nullable: false })
    child5To14YearsCount!: number

    @Column({ type: 'bigint', nullable: false })
    adultOver14YearsCount!: number

    @Column({ type: 'bigint', nullable: false })
    consultationCount!: number

    @Column({ type: 'bigint', nullable: false })
    followupCount!: number

    @Column({ type: 'bigint', nullable: false })
    allActionsCount!: number


    @Column({ type: 'jsonb', nullable: false })
    lineChart!: RecoPerformanceDashboardUtils

    @Column({ type: 'jsonb', nullable: false })
    barChart!: RecoPerformanceDashboardUtils


    @Column({ type: 'jsonb', nullable: false })
    country!: { id: string, name: string }

    @Column({ type: 'jsonb', nullable: false })
    region!: { id: string, name: string }

    @Column({ type: 'jsonb', nullable: false })
    prefecture!: { id: string, name: string }

    @Column({ type: 'jsonb', nullable: false })
    commune!: { id: string, name: string }

    @Column({ type: 'jsonb', nullable: false })
    hospital!: { id: string, name: string }

    @Column({ type: 'jsonb', nullable: false })
    district_quartier!: { id: string, name: string }

    @Column({ type: 'jsonb', nullable: false })
    chw!: { id: string, name: string, phone: string }

    @Column({ type: 'jsonb', nullable: false })
    village_secteur!: { id: string, name: string }

    @Column({ type: 'jsonb', nullable: false })
    reco!: { id: string, name: string, phone: string }

}
export async function getRecoPerformanceDashboardRepository(): Promise<Repository<RecoPerformanceDashboard>> {
    return Connection.getRepository(RecoPerformanceDashboard);
}

@Entity()
export class RecoChartPerformanceDashboard {

    @PrimaryColumn({ type: 'text', nullable: false })
    id!: string

    @Column({ type: 'bigint', nullable: false })
    year!: number

    @Column({ type: 'jsonb', nullable: false })
    lineChart!: RecoPerformanceDashboardUtils

    @Column({ type: 'jsonb', nullable: false })
    barChart!: RecoPerformanceDashboardUtils


    @Column({ type: 'jsonb', nullable: false })
    country!: { id: string, name: string }

    @Column({ type: 'jsonb', nullable: false })
    region!: { id: string, name: string }

    @Column({ type: 'jsonb', nullable: false })
    prefecture!: { id: string, name: string }

    @Column({ type: 'jsonb', nullable: false })
    commune!: { id: string, name: string }

    @Column({ type: 'jsonb', nullable: false })
    hospital!: { id: string, name: string }

    @Column({ type: 'jsonb', nullable: false })
    district_quartier!: { id: string, name: string }

    @Column({ type: 'jsonb', nullable: false })
    chw!: { id: string, name: string, phone: string }

    @Column({ type: 'jsonb', nullable: false })
    village_secteur!: { id: string, name: string }

    @Column({ type: 'jsonb', nullable: false })
    reco!: { id: string, name: string, phone: string }

}
export async function getRecoChartPerformanceDashboardRepository(): Promise<Repository<RecoChartPerformanceDashboard>> {
    return Connection.getRepository(RecoChartPerformanceDashboard);
}

@Entity()
export class RecoVaccinationDashboard {

    @PrimaryColumn({ type: 'text', nullable: false })
    id!: string

    @Column({ type: 'bigint', nullable: false })
    year!: number

    @Column({ type: 'varchar', nullable: false })
    month!: string

    @Column({ type: 'jsonb', nullable: false })
    children_vaccines!: { family_id: string, family_name: string, family_code: string, family_fullname: string, data: RecoVaccinationDashboardUtils[] }[]
    
    @Column({ type: 'jsonb', nullable: false })
    country!: { id: string, name: string }

    @Column({ type: 'jsonb', nullable: false })
    region!: { id: string, name: string }

    @Column({ type: 'jsonb', nullable: false })
    prefecture!: { id: string, name: string }

    @Column({ type: 'jsonb', nullable: false })
    commune!: { id: string, name: string }

    @Column({ type: 'jsonb', nullable: false })
    hospital!: { id: string, name: string }

    @Column({ type: 'jsonb', nullable: false })
    district_quartier!: { id: string, name: string }

    @Column({ type: 'jsonb', nullable: false })
    chw!: { id: string, name: string, phone: string }

    @Column({ type: 'jsonb', nullable: false })
    village_secteur!: { id: string, name: string }

    @Column({ type: 'jsonb', nullable: false })
    reco!: { id: string, name: string, phone: string }
}

export async function getRecoVaccinationDashboardRepository(): Promise<Repository<RecoVaccinationDashboard>> {
    return Connection.getRepository(RecoVaccinationDashboard);
}