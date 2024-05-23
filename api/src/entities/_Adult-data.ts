import { Entity, Column, Repository, DataSource, PrimaryColumn, JoinColumn, ManyToOne } from "typeorm"
import { AppDataSource } from "../data_source"
import { Country, Region, Prefecture, Commune, Hospital, DistrictQuartier, VillageSecteur, Family, Chw, Reco, Patient } from "./Org-units";

// export enum FlightType { DOMESTIC = "domestic", INTERNATIONAL = "international" }
let Connection: DataSource = AppDataSource.manager.connection;


@Entity()
export class AdultData {

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

    // adult consultation ---------


    @Column({ type: 'boolean', nullable: true })
    is_pregnant!: boolean | null

    @Column({ type: 'bigint', nullable: true })
    promptitude!: number | null

    @Column({ type: 'boolean', nullable: true })
    has_malaria!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    has_fever!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    has_diarrhea!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    has_cough_cold!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    rdt_given!: boolean | null
    
    @Column({ type: 'varchar', nullable: true })
    rdt_result!: 'positive' | 'nagative' | null

    @Column({ type: 'boolean', nullable: true })
    is_referred!: boolean | null


    @Column({ type: 'boolean', nullable: true })
    malaria!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    fever!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    diarrhea!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    yellow_fever!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    tetanus!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    cough_or_cold!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    viral_diseases!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    acute_flaccid_paralysis!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    meningitis!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    miscarriage!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    traffic_accident!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    burns!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    suspected_tb!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    dermatosis!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    bloody_diarrhea!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    urethral_discharge!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    vaginal_discharge!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    loss_of_urine!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    accidental_ingestion_caustic_products!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    food_poisoning!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    oral_and_dental_diseases!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    dog_bites!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    snake_bite!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    parasitosis!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    measles!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    trauma!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    gender_based_violence!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    vomit!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    headaches!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    abdominal_pain!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    bleeding!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    feel_pain_injection!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    health_center_FP!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    cpn_done!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    td1_done!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    td2_done!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    danger_sign!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    fp_side_effect!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    domestic_violence!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    afp!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    cholera!: boolean | null

    @Column({ type: 'varchar', nullable: true })
    other_problems!: string | null


    @Column({ type: 'float', nullable: true })
    cta!: number

    @Column({ type: 'float', nullable: true })
    amoxicillin_250mg!: number

    @Column({ type: 'float', nullable: true })
    amoxicillin_500mg!: number

    @Column({ type: 'float', nullable: true })
    paracetamol_250mg!: number

    @Column({ type: 'float', nullable: true })
    paracetamol_500mg!: number

    @Column({ type: 'float', nullable: true })
    mebendazole_250mg!: number

    @Column({ type: 'float', nullable: true })
    mebendazole_500mg!: number

    @Column({ type: 'float', nullable: true })
    ors!: number

    @Column({ type: 'float', nullable: true })
    zinc!: number

    //---------------------------------------------------------


    //adult followup form -----
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
    // is_pregnant!: boolean | null

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

export async function getAdultDataRepository(): Promise<Repository<AdultData>> {
    return Connection.getRepository(AdultData);
}