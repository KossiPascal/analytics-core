
import { Entity, Column, Repository, DataSource, PrimaryColumn, JoinColumn, ManyToOne } from "typeorm"
import { AppDataSource } from "../data_source"
import { Country, Region, Prefecture, Commune, Hospital, DistrictQuartier, VillageSecteur, Family, Chw, Reco, Patient } from "./Org-units";

// export enum FlightType { DOMESTIC = "domestic", INTERNATIONAL = "international" }
let Connection: DataSource = AppDataSource.manager.connection;


@Entity()
export class PregnantData {

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


    @Column({ type: 'varchar', nullable: false })
    consultation_followup!: 'consultation' | 'followup'

    // pregnant form ----------------------------------
    @Column({ type: 'boolean', nullable: true })
    is_pregnant!: boolean | null

    @Column({ type: 'varchar', nullable: true })
    next_cpn_visit_date!: string

    @Column({ type: 'boolean', nullable: true })
    is_cpn_late!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    is_pregnant_referred!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    has_danger_sign!: boolean | null
    
    @Column({ type: 'boolean', nullable: true })
    is_referred!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    cpn_done!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    td1_done!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    td2_done!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    has_milda!: boolean | null

    @Column({ type: 'bigint', nullable: true })
    cpn_number!: number | null

    @Column({ type: 'varchar', nullable: true })
    date_cpn1!: string | null

    @Column({ type: 'varchar', nullable: true })
    date_cpn2!: string | null

    @Column({ type: 'varchar', nullable: true })
    date_cpn3!: string | null

    @Column({ type: 'varchar', nullable: true })
    date_cpn4!: string | null

    @Column({ type: 'varchar', nullable: true })
    next_cpn_date!: string | null

    @Column({ type: 'bigint', nullable: true })
    cpn_next_number!: number | null

    @Column({ type: 'varchar', nullable: true })
    delivery_place_wanted!: string | null

    @Column({ type: 'boolean', nullable: true })
    is_home_delivery_wanted!: boolean | null



    // prenatal followup form -----------------

    @Column({ type: 'bigint', nullable: true })
    cpn_already_count!: number | null

    @Column({ type: 'boolean', nullable: true })
    is_closed!: boolean | null

    @Column({ type: 'varchar', nullable: true })
    close_reason!: string | null

    @Column({ type: 'varchar', nullable: true })
    close_reason_name!: string | null

    // @Column({ type: 'boolean', nullable: true })
    // has_danger_sign!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    is_miscarriage_referred!: boolean | null

    // @Column({ type: 'boolean', nullable: true })
    // is_pregnant!: boolean | null

    // @Column({ type: 'boolean', nullable: true })
    // cpn_done!: boolean | null

    // @Column({ type: 'bigint', nullable: true })
    // cpn_number!: number | null

    // @Column({ type: 'varchar', nullable: true })
    // date_cpn1!: string|null

    // @Column({ type: 'varchar', nullable: true })
    // date_cpn2!: string|null

    // @Column({ type: 'varchar', nullable: true })
    // date_cpn3!: string|null

    // @Column({ type: 'varchar', nullable: true })
    // date_cpn4!: string|null

    // @Column({ type: 'boolean', nullable: true })
    // td1_done!: boolean | null

    // @Column({ type: 'boolean', nullable: true })
    // td2_done!: boolean | null

    // @Column({ type: 'boolean', nullable: true })
    // has_milda!: boolean | null

    // @Column({ type: 'bigint', nullable: true })
    // cpn_next_number!: number | null

    // @Column({ type: 'varchar', nullable: true })
    // next_cpn_date!: string|null

    // @Column({ type: 'varchar', nullable: true })
    // next_cpn_visit_date!: string|null

    // @Column({ type: 'boolean', nullable: true })
    // is_cpn_late!: boolean | null

    // @Column({ type: 'boolean', nullable: true })
    // is_referred!: boolean | null



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

    // @ManyToOne(() => Chw, (chw) => chw.id, { eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
    // @JoinColumn({ name: 'chw_id', referencedColumnName: 'id' })
    // chw!: Chw

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
    geolocation?: object | null;

}

export async function getPregnantDataRepository(): Promise<Repository<PregnantData>> {
    return Connection.getRepository(PregnantData);
}