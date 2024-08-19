import { Entity, Column, Repository, DataSource, PrimaryColumn, JoinColumn, ManyToOne } from "typeorm"
import { AppDataSource } from "../data_source"
import { Country, Region, Prefecture, Commune, Hospital, DistrictQuartier, VillageSecteur, Family, Chw, Reco, Patient } from "./Org-units";

// export enum FlightType { DOMESTIC = "domestic", INTERNATIONAL = "international" }
let Connection: DataSource = AppDataSource.manager.connection;


@Entity()
export class EventsData {

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


    @Column({ type:'simple-array', nullable: true })
    events!: string[] | null

    @Column({ type: 'varchar', nullable: true })
    other_event!: string | null

    @Column({ type: 'varchar', nullable: true })
    event_name!: string | null

    @Column({ type: 'varchar', nullable: true })
    event_date!: string | null

    @Column({ type: 'varchar', nullable: true })
    village_location_name!: string | null

    @Column({ type: 'varchar', nullable: true })
    name_person_in_charge!: string | null

    @Column({ type: 'varchar', nullable: true })
    phone_person_in_charge!: string | null

    @Column({ type: 'varchar', nullable: true })
    health_center_feedback_date!: string | null

    @Column({ type: 'varchar', nullable: true })
    feedback_manager!: string | null


    @Column({ type: 'boolean', nullable: true })
    is_flood!: boolean | null
    @Column({ type: 'boolean', nullable: true })
    is_fire!: boolean | null
    @Column({ type: 'boolean', nullable: true })
    is_shipwreck!: boolean | null
    @Column({ type: 'boolean', nullable: true })
    is_landslide!: boolean | null
    @Column({ type: 'boolean', nullable: true })
    is_grouped_animal_deaths!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    is_pfa!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    is_bloody_diarrhea!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    is_yellow_fever!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    is_cholera!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    is_maternal_and_neonatal_tetanus!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    is_viral_diseases!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    is_meningitis!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    is_maternal_deaths!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    is_community_deaths!: boolean | null

    @Column({ type: 'boolean', nullable: true })
    is_influenza_fever!: boolean | null



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

export async function getEventsDataRepository(): Promise<Repository<EventsData>> {
    return Connection.getRepository(EventsData);
}