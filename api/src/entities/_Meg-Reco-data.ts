import { Entity, Column, Repository, DataSource, PrimaryColumn, JoinColumn, ManyToOne } from "typeorm"
import { AppDataSource } from "../data_source"
import { Country, Region, Prefecture, Commune, Hospital, DistrictQuartier, VillageSecteur, Family, Chw, Reco, Patient } from "./Org-units";

// export enum FlightType { DOMESTIC = "domestic", INTERNATIONAL = "international" }
let Connection: DataSource = AppDataSource.manager.connection;


@Entity()
export class RecoMegData {

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
    meg_type!: 'stock' | 'inventory' | 'consumption' | 'loss' | 'damaged' | 'broken' | 'expired'
 
    @Column({ type: 'varchar', nullable: true })
    fp_method!: 'pill_coc' | 'pill_cop' | 'condoms' | 'dmpa_sc' | 'depo_provera_im' | 'cycle_necklace' | 'diu' | 'implant' | 'tubal_ligation' | null


    @Column({ type: 'bigint', nullable: true })
    pill_coc!: number | null

    @Column({ type: 'bigint', nullable: true })
    pill_cop!: number | null

    @Column({ type: 'bigint', nullable: true })
    condoms!: number | null

    @Column({ type: 'bigint', nullable: true })
    depo_provera_im!: number | null

    @Column({ type: 'bigint', nullable: true })
    dmpa_sc!: number | null

    @Column({ type: 'bigint', nullable: true })
    diu!: number | null

    @Column({ type: 'bigint', nullable: true })
    implant!: number | null
    
    @Column({ type: 'bigint', nullable: true })
    cycle_necklace!: number | null

    @Column({ type: 'bigint', nullable: true })
    tubal_ligation!: number | null

    // @Column({ type: 'float', nullable: true })
    // cta_total!: number

    @Column({ type: 'float', nullable: true })
    cta_nn!: number

    @Column({ type: 'float', nullable: true })
    cta_pe!: number

    @Column({ type: 'float', nullable: true })
    cta_ge!: number

    @Column({ type: 'float', nullable: true })
    cta_ad!: number


    @Column({ type: 'bigint', nullable: true })
    tdr!: number | null

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

    @Column({ type: 'boolean', nullable: true })
    is_fp_referred!: boolean|null

    @Column({ type: 'boolean', nullable: true })
    has_fp_side_effect!: boolean|null



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

export async function getRecoMegDataRepository(): Promise<Repository<RecoMegData>> {
    return Connection.getRepository(RecoMegData);
}


