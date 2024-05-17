import { Entity, Column, Repository, DataSource, PrimaryColumn, JoinColumn, ManyToOne } from "typeorm"
import { AppDataSource } from "../data_source"
import { Country, Region, Prefecture, Commune, Hospital, DistrictQuartier, VillageSecteur, Family, Chw, Reco, Patient } from "./Org-units";

// export enum FlightType { DOMESTIC = "domestic", INTERNATIONAL = "international" }
let Connection: DataSource = AppDataSource.manager.connection;


@Entity()
export class DeathData {

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
    sex!: 'M' | 'F' | null

    @Column({ type: 'varchar', nullable: false })
    date_of_birth!: string

    @Column({ type: 'float', nullable: false })
    age_in_years!: number

    @Column({ type: 'float', nullable: false })
    age_in_months!: number

    @Column({ type: 'float', nullable: false })
    age_in_days!: number


    @Column({ type: 'varchar', nullable: true })
    date_of_death!: string | null

    @Column({ type: 'varchar', nullable: true })
    death_place!: string | null

    @Column({ type: 'simple-array', nullable: true })
    death_reason!: string[]

    @Column({ type: 'varchar', nullable: true })
    death_place_label!: string | null

    @Column({ type: 'varchar', nullable: true })
    death_reason_label!: string | null

    @Column({ type: 'boolean', nullable: true })
    is_maternal_death!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    is_home_death!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    has_malaria!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    has_diarrhea!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    has_malnutrition!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    has_cough_cold!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    has_pneumonia!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    has_maternal_death!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    has_fever!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    has_yellow_fever!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    has_tetanus!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    has_viral_diseases!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    has_meningitis!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    has_miscarriage!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    has_traffic_accident!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    has_burns!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    has_tuberculosis!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    has_bloody_diarrhea!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    has_accidental_ingestion_caustic_products!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    has_food_poisoning!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    has_dog_bites!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    has_snake_bite!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    has_trauma!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    has_domestic_violence!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    has_cholera!: boolean | null



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

export async function getDeathDataRepository(): Promise<Repository<DeathData>> {
    return Connection.getRepository(DeathData);
}