import { Entity, Column, Repository, DataSource, PrimaryColumn, JoinColumn, ManyToOne } from "typeorm"
import { AppDataSource } from "../data_source"
import { Country, Region, Prefecture, Commune, Hospital, DistrictQuartier, VillageSecteur, Family, Chw, Reco, Patient } from "./Org-units";

// export enum FlightType { DOMESTIC = "domestic", INTERNATIONAL = "international" }
let Connection: DataSource = AppDataSource.manager.connection;


@Entity()
export class VaccinationData {

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

    @Column({ type: 'varchar', nullable: false })
    sex!:'M'|'F'|null

    @Column({ type: 'varchar', nullable: false })
    date_of_birth!: string

    @Column({ type: 'float', nullable: false })
    age_in_years!:number

    @Column({ type: 'float', nullable: false })
    age_in_months!:number

    @Column({ type: 'float', nullable: false })
    age_in_days!:number


    @Column({ type: 'boolean', nullable: true })
    vaccine_BCG!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    vaccine_VPO_0!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    vaccine_PENTA_1!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    vaccine_VPO_1!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    vaccine_PENTA_2!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    vaccine_VPO_2!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    vaccine_PENTA_3!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    vaccine_VPO_3!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    vaccine_VPI_1!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    vaccine_VAR_1!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    vaccine_VAA!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    vaccine_VPI_2!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    vaccine_MEN_A!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    vaccine_VAR_2!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    is_birth_vaccine_ok!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    is_six_weeks_vaccine_ok!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    is_ten_weeks_vaccine_ok!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    is_forteen_weeks_vaccine_ok!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    is_nine_months_vaccine_ok!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    is_fifty_months_vaccine_ok!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    is_vaccine_referal!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    has_all_vaccine_done!: boolean | null



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

    @ManyToOne(() => DistrictQuartier, (district_quartier) => district_quartier.id, { eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'district_quartier_id', referencedColumnName: 'id' })
    district_quartier!: DistrictQuartier

    @ManyToOne(() => VillageSecteur, (village_secteur) => village_secteur.id, { eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'village_secteur_id', referencedColumnName: 'id' })
    village_secteur!: VillageSecteur

    @ManyToOne(() => Family, (family) => family.id, { eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'family_id', referencedColumnName: 'id' })
    family!: Family

    @ManyToOne(() => Reco, (reco) => reco.id, { eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'reco_id', referencedColumnName: 'id' })
    reco!: Reco

    @ManyToOne(() => Patient, (patient) => patient.id, { eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'patient_id', referencedColumnName: 'id' })
    patient!: Patient

    @Column({ type: 'bigint', nullable: false })
    reported_date_timestamp!: number
    

    @Column({ type: 'varchar', nullable: false })
    reported_date!: string

    @Column({ type: 'varchar', nullable: true })
    reported_full_date?: string | null

    @Column('json', { nullable: true })
    geolocation?: object;

}

export async function getVaccinationDataRepository(): Promise<Repository<VaccinationData>> {
    return Connection.getRepository(VaccinationData);
}