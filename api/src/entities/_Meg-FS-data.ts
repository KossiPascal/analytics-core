import { Entity, Column, Repository, DataSource, PrimaryColumn, JoinColumn, ManyToOne } from "typeorm"
import { AppDataSource } from "../data_source"
import { Country, Region, Prefecture, Commune, Hospital, DistrictQuartier, VillageSecteur, Family, Chw, Reco, Patient, HospitalManager } from "./Org-units";

// export enum FlightType { DOMESTIC = "domestic", INTERNATIONAL = "international" }
let Connection: DataSource = AppDataSource.manager.connection;


@Entity()
export class FsMegData {

    @PrimaryColumn({ type: 'text', nullable: false })
    id!: string

    @Column({ type: 'varchar', nullable: false })
    rev!: string

    @Column({ type: 'varchar', nullable: false })
    form!: string

    @Column({ type: 'bigint', nullable: false })
    year!: number

    @Column({ type: 'varchar', nullable: false })
    month!: string


    @Column({ type: 'varchar', nullable: true })
    action_date!: string | null

    @Column({ type: 'varchar', nullable: true })
    month_date_selected!: string | null

    @Column({ type: 'varchar', nullable: true })
    month_day!: string | null

    @Column({ type: 'bigint', nullable: true })
    all_med_shortage_days_number!: number | null

    @Column({ type: 'bigint', nullable: true })
    all_med_number!: number | null

    @Column({ type: 'bigint', nullable: true })
    meg_average_out_of!: number | null

    @Column({ type: 'bigint', nullable: true })
    meg_average_available!: number | null



    @ManyToOne(() => Country, (country) => country.id, { eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'country_id', referencedColumnName: 'id' })
    country!: Country

    @ManyToOne(() => Region, (region) => region.id, { eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'region_id', referencedColumnName: 'id' })
    region!: Region

    @ManyToOne(() => Prefecture, (prefecture) => prefecture.id, { eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'prefecture_id', referencedColumnName: 'id' })
    prefecture!: Prefecture

    @ManyToOne(() => Commune, (commune) => commune.id, { eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'commune_id', referencedColumnName: 'id' })
    commune!: Commune

    @ManyToOne(() => Hospital, (hospital) => hospital.id, { eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'hospital_id', referencedColumnName: 'id' })
    hospital!: Hospital

    @ManyToOne(() => HospitalManager, (hospital_manager) => hospital_manager.id, { eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'hospital_manager_id', referencedColumnName: 'id' })
    hospital_manager!: HospitalManager

    @Column({ type: 'bigint', nullable: false })
    reported_date_timestamp!: number

    @Column({ type: 'varchar', nullable: false })
    reported_date!: string | null

    @Column({ type: 'varchar', nullable: true })
    reported_full_date?: string | null

    @Column('json', { nullable: true })
    geolocation?: object | null;

}

export async function getFsMegDataRepository(): Promise<Repository<FsMegData>> {
    return Connection.getRepository(FsMegData);
}