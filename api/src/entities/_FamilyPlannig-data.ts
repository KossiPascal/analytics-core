
import { Entity, Column, Repository, DataSource, PrimaryColumn, JoinColumn, ManyToOne } from "typeorm"
import { AppDataSource } from "../data_source"
import { Country, Region, Prefecture, Commune, Hospital, DistrictQuartier, VillageSecteur, Family, Chw, Reco, Patient } from "./Org-units";

// export enum FlightType { DOMESTIC = "domestic", INTERNATIONAL = "international" }
let Connection: DataSource = AppDataSource.manager.connection;


@Entity()
export class FamilyPlanningData {

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


    @Column({ type: 'varchar', nullable: false })
    consultation_followup!: 'consultation' | 'renewal' | 'danger_sign_check'


    // family planning form --------------------------------

    @Column({ type: 'boolean', nullable: true })
    has_counseling!: boolean | null

    @Column({ type: 'varchar', nullable: true })
    no_counseling_reasons!: string | null

    @Column({ type: 'varchar', nullable: true })
    no_counseling_reasons_name!: string | null

    @Column({ type: 'boolean', nullable: true })
    already_use_method!: boolean | null

    @Column({ type: 'varchar', nullable: true })
    method_already_used!: 'pill_coc' | 'pill_cop' | 'condoms' | 'dmpa_sc' | 'depo_provera_im' | 'cycle_necklace' | 'diu' | 'implant' | 'tubal_ligation' | null

    @Column({ type: 'boolean', nullable: true })
    is_currently_using_method!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    has_changed_method!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    want_renew_method!: boolean | null

    @Column({ type: 'varchar', nullable: true })
    want_renew_method_date!: string | null

    @Column({ type: 'varchar', nullable: true })
    refuse_renew_method_reasons!: string | null

    @Column({ type: 'varchar', nullable: true })
    refuse_renew_method_reasons_name!: string | null

    @Column({ type: 'varchar', nullable: true })
    new_method_wanted!: 'pill_coc' | 'pill_cop' | 'condoms' | 'dmpa_sc' | 'depo_provera_im' | 'cycle_necklace' | 'diu' | 'implant' | 'tubal_ligation' | null

    @Column({ type: 'varchar', nullable: true })
    who_will_give_method!: 'reco' | 'health_center' | null


    @Column({ type: 'boolean', nullable: true })
    method_was_given!: boolean | null

    @Column({ type: 'varchar', nullable: true })
    method_start_date!: string | null

    @Column({ type: 'varchar', nullable: true })
    method_not_given_reason!: string | null

    @Column({ type: 'varchar', nullable: true })
    method_not_given_reason_name!: string | null

    @Column({ type: 'boolean', nullable: true })
    is_method_avaible_reco!: boolean | null

    @Column({ type: 'varchar', nullable: true })
    fp_method!: 'pill_coc' | 'pill_cop' | 'condoms' | 'dmpa_sc' | 'depo_provera_im' | 'cycle_necklace' | 'diu' | 'implant' | 'tubal_ligation' | null


    @Column({ type: 'varchar', nullable: true })
    fp_method_name!: string | null

    @Column({ type: 'varchar', nullable: true })
    next_fp_renew_date!: string | null
    // -----------------------------------------------------------------------


    //fp danger sign check form -----------------------------

    // @Column({ type: 'varchar', nullable: true })
    // fp_method!: string|null

    // @Column({ type: 'varchar', nullable: true })
    // fp_method_name!: string|null

    @Column({ type: 'boolean', nullable: true })
    has_health_problem!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    has_fever!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    has_vomit!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    has_headaches!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    has_abdominal_pain!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    has_bleeding!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    has_feel_pain_injection!: boolean | null

    @Column({ type: 'varchar', nullable: true })
    other_health_problem_written!: string | null

    @Column({ type: 'boolean', nullable: true })
    has_secondary_effect!: boolean | null
    // -----------------------------------------------------------------------


    //FP renewal form ----------------------

    // @Column({ type: 'varchar', nullable: true })
    // fp_method!: string|null

    // @Column({ type: 'varchar', nullable: true })
    // fp_method_name!: string|null

    // @Column({ type: 'varchar', nullable: true })
    // next_fp_renew_date!: string|null

    // @Column({ type: 'boolean', nullable: true })
    // method_was_given!: boolean | null

    // @Column({ type: 'varchar', nullable: true })
    // method_start_date!: string|null

    // @Column({ type: 'varchar', nullable: true })
    // method_not_given_reason!: string|null

    // @Column({ type: 'varchar', nullable: true })
    // method_not_given_reason_name!: string|null

    @Column({ type: 'boolean', nullable: true })
    is_fp_referal!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    is_health_problem_referal!: boolean | null
    // -----------------------------------------------------------------------



    @ManyToOne(() => Country, (country) => country.id, { eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'country_id', referencedColumnName: 'id' })
    country!: Country  //country_id

    @ManyToOne(() => Region, (region) => region.id, { eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'region_id', referencedColumnName: 'id' })
    region!: Region //region_id

    @ManyToOne(() => Prefecture, (prefecture) => prefecture.id, { eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'prefecture_id', referencedColumnName: 'id' })
    prefecture!: Prefecture //prefecture_id

    @ManyToOne(() => Commune, (commune) => commune.id, { eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'commune_id', referencedColumnName: 'id' })
    commune!: Commune //commune_id

    @ManyToOne(() => Hospital, (hospital) => hospital.id, { eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'hospital_id', referencedColumnName: 'id' })
    hospital!: Hospital //hospital_id

    @ManyToOne(() => DistrictQuartier, (district_quartier) => district_quartier.id, { eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'district_quartier_id', referencedColumnName: 'id' })
    district_quartier!: DistrictQuartier //district_quartier_id

    @ManyToOne(() => VillageSecteur, (village_secteur) => village_secteur.id, { eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'village_secteur_id', referencedColumnName: 'id' })
    village_secteur!: VillageSecteur //village_secteur_id

    @ManyToOne(() => Family, (family) => family.id, { eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'family_id', referencedColumnName: 'id' })
    family!: Family //household_id

    @ManyToOne(() => Reco, (reco) => reco.id, { eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'reco_id', referencedColumnName: 'id' })
    reco!: Reco //user_id

    @ManyToOne(() => Patient, (patient) => patient.id, { eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'patient_id', referencedColumnName: 'id' })
    patient!: Patient //patient_id

    @Column({ type: 'bigint', nullable: false })
    reported_date_timestamp!: number

    @Column({ type: 'varchar', nullable: false })
    reported_date!: string

    @Column({ type: 'varchar', nullable: true })
    reported_full_date?: string | null

    @Column('json', { nullable: true })
    geolocation?: object | null;

}

export async function getFamilyPlanningDataRepository(): Promise<Repository<FamilyPlanningData>> {
    return Connection.getRepository(FamilyPlanningData);
}