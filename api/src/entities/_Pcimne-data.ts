
import { Entity, Column, Repository, DataSource, PrimaryColumn, JoinColumn, ManyToOne } from "typeorm"
import { AppDataSource } from "../data_source"
import { Country, Region, Prefecture, Commune, Hospital, DistrictQuartier, VillageSecteur, Family, Chw, Reco, Patient } from "./Org-units";

// export enum FlightType { DOMESTIC = "domestic", INTERNATIONAL = "international" }
let Connection: DataSource = AppDataSource.manager.connection;


@Entity()
export class PcimneData {

    @PrimaryColumn({ type: 'text', nullable: false })
    id!: string

    @Column({ type: 'varchar', nullable: false })
    rev!: string

    @Column({ type: 'varchar', nullable: false })
    form!: 'pcimne_register' | 'pcimne_followup'

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

    //pcime register form -------------------

    @Column({ type: 'bigint', nullable: true })
    promptitude!: number | null

    @Column({ type: 'boolean', nullable: true })
    has_initial_danger_signs!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    has_fever!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    has_malaria!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    has_cough_cold!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    has_pneumonia!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    has_normal_respiratory_rate!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    has_diarrhea!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    has_malnutrition!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    has_afp!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    is_danger_signs_referral!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    is_fever_referal!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    is_cough_cold_referal!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    is_diarrhea_referal!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    is_malnutrition_referal!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    is_referred!: boolean | null

    @Column({ type: 'float', nullable: true })
    temperature!: number | null

    @Column({ type: 'boolean', nullable: true })
    rdt_given!: boolean | null
    
    @Column({ type: 'varchar', nullable: true })
    rdt_result!: 'positive' | 'negative' | null

    @Column({ type: 'boolean', nullable: true })
    unable_drink_breastfeed!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    vomits_everything!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    convulsions!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    sleepy_unconscious!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    has_stiff_neck!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    has_bulging_fontanelle!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    breathing_difficulty!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    cough_more_than_14days!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    subcostal_indrawing!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    wheezing!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    bloody_diarrhea!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    diarrhea_more_than_14_days!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    blood_in_stool!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    restless!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    drinks_hungrily!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    sunken_eyes!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    has_edema!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    is_principal_referal!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    has_health_problem!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    has_serious_malaria!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    has_pre_reference_treatments!: boolean | null
    

    @Column({ type: 'bigint', nullable: true })
    cta!: number | null

    @Column({ type: 'bigint', nullable: true })
    amoxicillin_250mg!: number | null

    @Column({ type: 'bigint', nullable: true })
    amoxicillin_500mg!: number | null

    @Column({ type: 'bigint', nullable: true })
    paracetamol_250mg!: number | null

    @Column({ type: 'bigint', nullable: true })
    paracetamol_500mg!: number | null

    @Column({ type: 'bigint', nullable: true })
    ors!: number | null

    @Column({ type: 'bigint', nullable: true })
    zinc!: number | null

    @Column({ type: 'bigint', nullable: true })
    vitamin_a!: number | null

    @Column({ type: 'bigint', nullable: true })
    mebendazol_250mg!: number | null

    @Column({ type: 'bigint', nullable: true })
    mebendazol_500mg!: number | null

    @Column({ type: 'bigint', nullable: true })
    tetracycline_ointment!: number | null



    //pcime followup form --------------
    @Column({ type: 'boolean', nullable: true })
    is_present!: boolean | null

    @Column({ type: 'varchar', nullable: true })
    absence_reasons!: string | null

    @Column({ type: 'boolean', nullable: true })
    went_to_health_center!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    coupon_available!: boolean | null

    @Column({ type: 'varchar', nullable: true })
    coupon_number!: string | null

    @Column({ type: 'boolean', nullable: true })
    has_no_improvement!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    has_getting_worse!: boolean | null

    // @Column({ type: 'boolean', nullable: true })
    // is_referred!:boolean | null


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

export async function getPcimneDataRepository(): Promise<Repository<PcimneData>> {
    return Connection.getRepository(PcimneData);
}