import { Entity, Column, Repository, DataSource, PrimaryColumn, JoinColumn, ManyToOne } from "typeorm"
import { AppDataSource } from "../data_source"
import { Country, Region, Prefecture, Commune, Hospital, DistrictQuartier, VillageSecteur, Family, Chw, Reco, Patient } from "./Org-units";

// export enum FlightType { DOMESTIC = "domestic", INTERNATIONAL = "international" }
let Connection: DataSource = AppDataSource.manager.connection;


@Entity()
export class PromotionalActivityData {

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
    activity_method!: string | null

    @Column({ type: 'boolean', nullable: true })
    is_vad_method!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    is_talk_method!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    is_interpersonal_com_method!: boolean | null

    @Column({ type: 'simple-array', nullable: true })
    activity_domain!: string[] | null

    @Column({ type: 'varchar', nullable: true })
    theme!: string | null

    @Column({ type: 'varchar', nullable: true })
    activity_location!: string | null

    @Column({ type: 'bigint', nullable: true })
    women_number!: number | null

    @Column({ type: 'bigint', nullable: true })
    men_number!: number | null

    @Column({ type: 'varchar', nullable: true })
    family_number!: string | null

    @Column({ type: 'bigint', nullable: true })
    total_person!: number | null




    @Column({ type: 'boolean', nullable: true })
    is_malaria_domain!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    is_family_planning_domain!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    is_cpn_domain!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    is_cpon_domain!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    is_child_birth_domain!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    is_vaccination_domain!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    is_sti_hiv_domain!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    is_tuberculosis_domain!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    is_nutrition_domain!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    is_water_hygiene_sanitation_domain!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    is_gbv_domain!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    is_fgm_domain!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    is_diarrhea_domain!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    is_pneumonia_domain!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    is_birth_registration_domain!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    is_meadow_domain!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    is_urine_loss_domain!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    is_diabetes_domain!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    is_blood_pressure_domain!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    is_onchocerciasis_domain!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    is_human_african_trypanosomiasis_domain!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    is_pfa_domain!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    is_bloody_diarrhea_domain!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    is_yellow_fever_domain!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    is_cholera_domain!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    is_maternal_and_neonatal_tetanus_domain!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    is_viral_diseases_domain!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    is_meningitis_domain!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    is_child_health_domain!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    is_other_diseases_domain!: boolean | null



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

    @ManyToOne(() => Family, (family) => family.id, { eager: true, nullable: true, onDelete: "CASCADE", onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'family_id', referencedColumnName: 'id' })
    family!: Family|null

    @ManyToOne(() => Patient, (patient) => patient.id, { eager: true, nullable: true, onDelete: "CASCADE", onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'patient_id', referencedColumnName: 'id' })
    patient!: Patient|null

    @ManyToOne(() => Reco, (reco) => reco.id, { eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
    @JoinColumn({ name: 'reco_id', referencedColumnName: 'id' })
    reco!: Reco

    @Column({ type: 'bigint', nullable: false })
    reported_date_timestamp!: number

    @Column({ type: 'varchar', nullable: false })
    reported_date!: string

    @Column({ type: 'varchar', nullable: true })
    reported_full_date?: string | null

    @Column('json', { nullable: true })
    geolocation?: object | null;

} 

export async function getPromotionalActivityDataRepository(): Promise<Repository<PromotionalActivityData>> {
    return Connection.getRepository(PromotionalActivityData);
}