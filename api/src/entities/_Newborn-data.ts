
import { Entity, Column, Repository, DataSource, PrimaryColumn, JoinColumn, ManyToOne } from "typeorm"
import { AppDataSource } from "../data_source"
import { Country, Region, Prefecture, Commune, Hospital, DistrictQuartier, VillageSecteur, Family, Chw, Reco, Patient } from "./Org-units";

// export enum FlightType { DOMESTIC = "domestic", INTERNATIONAL = "international" }
let Connection: DataSource = AppDataSource.manager.connection;

@Entity()
export class NewbornData {

    @PrimaryColumn({ type: 'text', nullable: false })
    id!: string

    @Column({ type: 'varchar', nullable: false })
    rev!: string

    @Column({ type: 'varchar', nullable: false })
    form!: 'newborn_register' | 'newborn_followup'

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


    // newborm register from --------------------------------------

    @Column({ type: 'bigint', nullable: true })
    promptitude!: number | null

    @Column({ type: 'boolean', nullable: true })
    is_referred!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    has_danger_sign!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    has_unable_to_suckle!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    has_vomits_everything_consumes!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    has_convulsion!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    has_sleepy_unconscious!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    has_stiff_neck!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    has_domed_fontanelle!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    has_breathe_hard!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    has_subcostal_indrawing!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    has_wheezing!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    has_diarrhea!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    has_malnutrition!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    has_malaria!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    has_pneumonia!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    has_cough_cold!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    coupon_available!: boolean | null

    @Column({ type: 'varchar', nullable: true })
    coupon_number!: string | null
    

    @Column({ type: 'boolean', nullable: true })
    has_others_heath_problem!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    has_pre_reference_treatments!: boolean | null

    

    @Column({ type: 'varchar', nullable: true })
    reference_pattern_other!: string | null
    // -------------------------------------------------------------

    //newborn followup form ---------------------------------

    @Column({ type: 'boolean', nullable: true })
    referal_health_center!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    is_health_referred!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    has_new_complaint!: boolean | null

    @Column({ type: 'varchar', nullable: true })
    other_diseases!: string | null

    // @Column({ type: 'boolean', nullable: true })
    // has_pre_reference_treatments!: boolean | null

    // @Column({ type: 'boolean', nullable: true })
    // has_malaria!: boolean | null

    // @Column({ type: 'boolean', nullable: true })
    // has_pneumonia!: boolean | null

    // @Column({ type: 'boolean', nullable: true })
    // has_malnutrition!: boolean | null

    // @Column({ type: 'boolean', nullable: true })
    // has_danger_sign!: boolean | null

    // @Column({ type: 'boolean', nullable: true })
    // has_unable_to_suckle!: boolean | null

    // @Column({ type: 'boolean', nullable: true })
    // has_vomits_everything_consumes!: boolean | null

    // @Column({ type: 'boolean', nullable: true })
    // has_convulsion!: boolean | null

    // @Column({ type: 'boolean', nullable: true })
    // has_sleepy_unconscious!: boolean | null

    // @Column({ type: 'boolean', nullable: true })
    // has_stiff_neck!: boolean | null

    // @Column({ type: 'boolean', nullable: true })
    // has_domed_fontanelle!: boolean | null

    // @Column({ type: 'boolean', nullable: true })
    // has_breathe_hard!: boolean | null

    // @Column({ type: 'boolean', nullable: true })
    // has_subcostal_indrawing!: boolean | null

    // @Column({ type: 'boolean', nullable: true })
    // has_wheezing!: boolean | null

    // @Column({ type: 'boolean', nullable: true })
    // has_diarrhea!: boolean | null

    // @Column({ type: 'boolean', nullable: true })
    // has_others_heath_problem!: boolean | null

    // @Column({ type: 'varchar', nullable: true })
    // reference_pattern_other!: string|null

    // @Column({ type: 'boolean', nullable: true })
    // is_referred!: boolean | null
    //--------------------------------------------------


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
    geolocation?: object | null;

}

export async function getNewbornDataRepository(): Promise<Repository<NewbornData>> {
    return Connection.getRepository(NewbornData);
}