import { Entity, PrimaryColumn, Column, Repository, DataSource, ManyToOne, JoinColumn } from "typeorm"
import { FP_Utils, ChwsRecoReportElements, MorbidityUtils, PcimneNewbornReportUtils, RecoMegQuantityUtils } from "../utils/Interfaces"
import { AppDataSource } from "../data_source";

// export enum FlightType { DOMESTIC = "domestic", INTERNATIONAL = "international" }
let Connection: DataSource = AppDataSource.manager.connection;


@Entity()
export class PromotionReport {
    constructor() { };
    @PrimaryColumn({ type: 'text', nullable: false })
    id!: string

    @Column({ type: 'varchar', nullable: false })
    month!: string

    @Column({ type: 'bigint', nullable: false })
    year!: number

    @Column({ type: 'bigint', nullable: false })
    malaria_nbr_touched_by_VAD_F!: number

    @Column({ type: 'bigint', nullable: false })
    malaria_nbr_touched_by_VAD_M!: number

    @Column({ type: 'bigint', nullable: false })
    malaria_nbr_touched_by_CE_F!: number

    @Column({ type: 'bigint', nullable: false })
    malaria_nbr_touched_by_CE_M!: number

    @Column({ type: 'bigint', nullable: false })
    malaria_nbr_total_F!: number

    @Column({ type: 'bigint', nullable: false })
    malaria_nbr_total_M!: number


    @Column({ type: 'bigint', nullable: false })
    vaccination_nbr_touched_by_VAD_F!: number

    @Column({ type: 'bigint', nullable: false })
    vaccination_nbr_touched_by_VAD_M!: number

    @Column({ type: 'bigint', nullable: false })
    vaccination_nbr_touched_by_CE_F!: number

    @Column({ type: 'bigint', nullable: false })
    vaccination_nbr_touched_by_CE_M!: number

    @Column({ type: 'bigint', nullable: false })
    vaccination_nbr_total_F!: number

    @Column({ type: 'bigint', nullable: false })
    vaccination_nbr_total_M!: number


    @Column({ type: 'bigint', nullable: false })
    child_health_nbr_touched_by_VAD_F!: number

    @Column({ type: 'bigint', nullable: false })
    child_health_nbr_touched_by_VAD_M!: number

    @Column({ type: 'bigint', nullable: false })
    child_health_nbr_touched_by_CE_F!: number

    @Column({ type: 'bigint', nullable: false })
    child_health_nbr_touched_by_CE_M!: number

    @Column({ type: 'bigint', nullable: false })
    child_health_nbr_total_F!: number

    @Column({ type: 'bigint', nullable: false })
    child_health_nbr_total_M!: number


    @Column({ type: 'bigint', nullable: false })
    cpn_cpon_nbr_touched_by_VAD_F!: number

    @Column({ type: 'bigint', nullable: false })
    cpn_cpon_nbr_touched_by_VAD_M!: number

    @Column({ type: 'bigint', nullable: false })
    cpn_cpon_nbr_touched_by_CE_F!: number

    @Column({ type: 'bigint', nullable: false })
    cpn_cpon_nbr_touched_by_CE_M!: number

    @Column({ type: 'bigint', nullable: false })
    cpn_cpon_nbr_total_F!: number

    @Column({ type: 'bigint', nullable: false })
    cpn_cpon_nbr_total_M!: number


    @Column({ type: 'bigint', nullable: false })
    family_planning_nbr_touched_by_VAD_F!: number

    @Column({ type: 'bigint', nullable: false })
    family_planning_nbr_touched_by_VAD_M!: number

    @Column({ type: 'bigint', nullable: false })
    family_planning_nbr_touched_by_CE_F!: number

    @Column({ type: 'bigint', nullable: false })
    family_planning_nbr_touched_by_CE_M!: number

    @Column({ type: 'bigint', nullable: false })
    family_planning_nbr_total_F!: number

    @Column({ type: 'bigint', nullable: false })
    family_planning_nbr_total_M!: number


    @Column({ type: 'bigint', nullable: false })
    hygienic_water_sanitation_nbr_touched_by_VAD_F!: number

    @Column({ type: 'bigint', nullable: false })
    hygienic_water_sanitation_nbr_touched_by_VAD_M!: number

    @Column({ type: 'bigint', nullable: false })
    hygienic_water_sanitation_nbr_touched_by_CE_F!: number

    @Column({ type: 'bigint', nullable: false })
    hygienic_water_sanitation_nbr_touched_by_CE_M!: number

    @Column({ type: 'bigint', nullable: false })
    hygienic_water_sanitation_nbr_total_F!: number

    @Column({ type: 'bigint', nullable: false })
    hygienic_water_sanitation_nbr_total_M!: number


    @Column({ type: 'bigint', nullable: false })
    other_diseases_nbr_touched_by_VAD_F!: number

    @Column({ type: 'bigint', nullable: false })
    other_diseases_nbr_touched_by_VAD_M!: number

    @Column({ type: 'bigint', nullable: false })
    other_diseases_nbr_touched_by_CE_F!: number

    @Column({ type: 'bigint', nullable: false })
    other_diseases_nbr_touched_by_CE_M!: number

    @Column({ type: 'bigint', nullable: false })
    other_diseases_nbr_total_F!: number

    @Column({ type: 'bigint', nullable: false })
    other_diseases_nbr_total_M!: number

    @Column({ type: 'jsonb', nullable: false })
    country!: { id: string, name: string }

    @Column({ type: 'jsonb', nullable: false })
    region!: { id: string, name: string }

    @Column({ type: 'jsonb', nullable: false })
    prefecture!: { id: string, name: string }

    @Column({ type: 'jsonb', nullable: false })
    commune!: { id: string, name: string }

    @Column({ type: 'jsonb', nullable: false })
    hospital!: { id: string, name: string }

    @Column({ type: 'jsonb', nullable: false })
    district_quartier!: { id: string, name: string }

    // @Column({ type: 'jsonb', nullable: false })
    // chw!: { id: string, name: string, phone:string }

    @Column({ type: 'jsonb', nullable: false })
    village_secteur!: { id: string, name: string }

    @Column({ type: 'jsonb', nullable: false })
    reco!: { id: string, name: string, phone:string }

    @Column({ type: 'boolean', nullable: false, default:false })
    is_validate!:boolean

    @Column({ type: 'varchar', nullable: true })
    validate_user_id!:string

    @Column({ type: 'boolean', nullable: false, default:false })
    already_on_dhis2!:boolean

    @Column({ type: 'varchar', nullable: true })
    already_on_dhis2_user_id!:string
}
export async function getPromotionReportRepository(): Promise<Repository<PromotionReport>> {
    return Connection.getRepository(PromotionReport);
}
@Entity()
export class FamilyPlanningReport {
    @PrimaryColumn({ type: 'text', nullable: false })
    id!: string

    @Column({ type: 'varchar', nullable: false })
    month!: string

    @Column({ type: 'bigint', nullable: false })
    year!: number

    @Column({ type: 'jsonb', nullable: false })
    pill_coc!: FP_Utils

    @Column({ type: 'jsonb', nullable: false })
    pill_cop!: FP_Utils

    @Column({ type: 'jsonb', nullable: false })
    condoms!: FP_Utils

    @Column({ type: 'jsonb', nullable: false })
    depo_provera_im!: FP_Utils

    @Column({ type: 'jsonb', nullable: false })
    dmpa_sc!: FP_Utils

    @Column({ type: 'jsonb', nullable: false })
    cycle_necklace!: FP_Utils

    @Column({ type: 'jsonb', nullable: false })
    diu!: FP_Utils

    @Column({ type: 'jsonb', nullable: false })
    implant!: FP_Utils

    @Column({ type: 'jsonb', nullable: false })
    tubal_ligation!: FP_Utils

    @Column({ type: 'jsonb', nullable: false })
    country!: { id: string, name: string }

    @Column({ type: 'jsonb', nullable: false })
    region!: { id: string, name: string }

    @Column({ type: 'jsonb', nullable: false })
    prefecture!: { id: string, name: string }

    @Column({ type: 'jsonb', nullable: false })
    commune!: { id: string, name: string }

    @Column({ type: 'jsonb', nullable: false })
    hospital!: { id: string, name: string }

    @Column({ type: 'jsonb', nullable: false })
    district_quartier!: { id: string, name: string }

    // @Column({ type: 'jsonb', nullable: false })
    // chw!: { id: string, name: string, phone:string }

    @Column({ type: 'jsonb', nullable: false })
    village_secteur!: { id: string, name: string }

    @Column({ type: 'jsonb', nullable: false })
    reco!: { id: string, name: string, phone:string }

    @Column({ type: 'boolean', nullable: false, default:false })
    is_validate!:boolean

    @Column({ type: 'varchar', nullable: true })
    validate_user_id!:string

    @Column({ type: 'boolean', nullable: false, default:false })
    already_on_dhis2!:boolean

    @Column({ type: 'varchar', nullable: true })
    already_on_dhis2_user_id!:string
}
export async function getFamilyPlanningReportRepository(): Promise<Repository<FamilyPlanningReport>> {
    return Connection.getRepository(FamilyPlanningReport);
}
@Entity()
export class MorbidityReport {
    @PrimaryColumn({ type: 'text', nullable: false })
    id!: string

    @Column({ type: 'varchar', nullable: false })
    month!: string

    @Column({ type: 'bigint', nullable: false })
    year!: number

    @Column({ type: 'jsonb', nullable: false })
    hp_circulation_accident!: MorbidityUtils

    @Column({ type: 'jsonb', nullable: false })
    hp_burn!: MorbidityUtils

    @Column({ type: 'jsonb', nullable: false })
    hp_suspected_tb_cases!: MorbidityUtils

    @Column({ type: 'jsonb', nullable: false })
    hp_dermatosis!: MorbidityUtils

    @Column({ type: 'jsonb', nullable: false })
    hp_diarrhea!: MorbidityUtils

    @Column({ type: 'jsonb', nullable: false })
    hp_urethral_discharge!: MorbidityUtils

    @Column({ type: 'jsonb', nullable: false })
    hp_vaginal_discharge!: MorbidityUtils

    @Column({ type: 'jsonb', nullable: false })
    hp_urinary_loss!: MorbidityUtils

    @Column({ type: 'jsonb', nullable: false })
    hp_accidental_caustic_products_ingestion!: MorbidityUtils

    @Column({ type: 'jsonb', nullable: false })
    hp_food_poisoning!: MorbidityUtils

    @Column({ type: 'jsonb', nullable: false })
    hp_oral_diseases!: MorbidityUtils

    @Column({ type: 'jsonb', nullable: false })
    hp_dog_bite!: MorbidityUtils

    @Column({ type: 'jsonb', nullable: false })
    hp_snake_bite!: MorbidityUtils

    @Column({ type: 'jsonb', nullable: false })
    hp_parasitosis!: MorbidityUtils

    @Column({ type: 'jsonb', nullable: false })
    hp_measles!: MorbidityUtils

    @Column({ type: 'jsonb', nullable: false })
    hp_trauma!: MorbidityUtils

    @Column({ type: 'jsonb', nullable: false })
    hp_gender_based_violence!: MorbidityUtils


    @Column({ type: 'jsonb', nullable: false })
    malaria_total_cases!: MorbidityUtils

    @Column({ type: 'jsonb', nullable: false })
    malaria_rdt_performed!: MorbidityUtils

    @Column({ type: 'jsonb', nullable: false })
    malaria_positive_rdts!: MorbidityUtils

    @Column({ type: 'jsonb', nullable: false })
    malaria_cases_treated_with_cta!: MorbidityUtils

    @Column({ type: 'jsonb', nullable: false })
    country!: { id: string, name: string }

    @Column({ type: 'jsonb', nullable: false })
    region!: { id: string, name: string }

    @Column({ type: 'jsonb', nullable: false })
    prefecture!: { id: string, name: string }

    @Column({ type: 'jsonb', nullable: false })
    commune!: { id: string, name: string }

    @Column({ type: 'jsonb', nullable: false })
    hospital!: { id: string, name: string }

    @Column({ type: 'jsonb', nullable: false })
    district_quartier!: { id: string, name: string }

    // @Column({ type: 'jsonb', nullable: false })
    // chw!: { id: string, name: string, phone:string }

    @Column({ type: 'jsonb', nullable: false })
    village_secteur!: { id: string, name: string }

    @Column({ type: 'jsonb', nullable: false })
    reco!: { id: string, name: string, phone:string }

    @Column({ type: 'boolean', nullable: false, default:false })
    is_validate!:boolean

    @Column({ type: 'varchar', nullable: true })
    validate_user_id!:string

    @Column({ type: 'boolean', nullable: false, default:false })
    already_on_dhis2!:boolean

    @Column({ type: 'varchar', nullable: true })
    already_on_dhis2_user_id!:string
}
export async function getMorbidityReportRepository(): Promise<Repository<MorbidityReport>> {
    return Connection.getRepository(MorbidityReport);
}
@Entity()
export class HouseholdRecapReport {
    constructor() { };
    @PrimaryColumn({ type: 'text', nullable: false })
    id!: string

    @Column({ type: 'varchar', nullable: false })
    month!: string

    @Column({ type: 'bigint', nullable: false })
    year!: number

    @Column({ type: 'bigint', nullable: false })
    index!: number

    @Column({ type: 'varchar', length: 255, nullable: false })
    household_code!: string

    @Column({ type: 'varchar', length: 255, nullable: false })
    household_name!: string

    @Column({ type: 'bigint', nullable: false })
    total_household_members!: number

    @Column({ type: 'bigint', nullable: false })
    total_women_15_50_years!: number

    @Column({ type: 'bigint', nullable: false })
    total_children_under_5_years!: number

    @Column({ type: 'bigint', nullable: false })
    total_children_0_12_months!: number

    @Column({ type: 'bigint', nullable: false })
    total_children_12_60_months!: number

    @Column({ type: 'boolean', nullable: false })
    has_functional_latrine!: boolean

    @Column({ type: 'boolean', nullable: false })
    has_drinking_water_access!: boolean

    @Column({ type: 'jsonb', nullable: false })
    country!: { id: string, name: string }

    @Column({ type: 'jsonb', nullable: false })
    region!: { id: string, name: string }

    @Column({ type: 'jsonb', nullable: false })
    prefecture!: { id: string, name: string }

    @Column({ type: 'jsonb', nullable: false })
    commune!: { id: string, name: string }

    @Column({ type: 'jsonb', nullable: false })
    hospital!: { id: string, name: string }

    @Column({ type: 'jsonb', nullable: false })
    district_quartier!: { id: string, name: string }

    // @Column({ type: 'jsonb', nullable: false })
    // chw!: { id: string, name: string, phone:string }

    @Column({ type: 'jsonb', nullable: false })
    village_secteur!: { id: string, name: string }

    @Column({ type: 'jsonb', nullable: false })
    reco!: { id: string, name: string, phone:string }

    @Column({ type: 'boolean', nullable: false, default:false })
    is_validate!:boolean

    @Column({ type: 'varchar', nullable: true })
    validate_user_id!:string

    @Column({ type: 'boolean', nullable: false, default:false })
    already_on_dhis2!:boolean

    @Column({ type: 'varchar', nullable: true })
    already_on_dhis2_user_id!:string
}
export async function getHouseholdRecapReportRepository(): Promise<Repository<HouseholdRecapReport>> {
    return Connection.getRepository(HouseholdRecapReport);
}
@Entity()
export class PcimneNewbornReport {
    constructor() { };
    @PrimaryColumn({ type: 'text', nullable: false })
    id!: string

    @Column({ type: 'varchar', nullable: false })
    month!: string

    @Column({ type: 'bigint', nullable: false })
    year!: number

    @Column({ type: 'jsonb', nullable: false })
    pcimne_newborn!: PcimneNewbornReportUtils[]

    @Column({ type: 'jsonb', nullable: false })
    country!: { id: string, name: string }

    @Column({ type: 'jsonb', nullable: false })
    region!: { id: string, name: string }

    @Column({ type: 'jsonb', nullable: false })
    prefecture!: { id: string, name: string }

    @Column({ type: 'jsonb', nullable: false })
    commune!: { id: string, name: string }

    @Column({ type: 'jsonb', nullable: false })
    hospital!: { id: string, name: string }

    @Column({ type: 'jsonb', nullable: false })
    district_quartier!: { id: string, name: string }

    // @Column({ type: 'jsonb', nullable: false })
    // chw!: { id: string, name: string, phone:string }

    @Column({ type: 'jsonb', nullable: false })
    village_secteur!: { id: string, name: string }

    @Column({ type: 'jsonb', nullable: false })
    reco!: { id: string, name: string, phone:string }

    @Column({ type: 'boolean', nullable: false, default:false })
    is_validate!:boolean

    @Column({ type: 'varchar', nullable: true })
    validate_user_id!:string

    @Column({ type: 'boolean', nullable: false, default:false })
    already_on_dhis2!:boolean

    @Column({ type: 'varchar', nullable: true })
    already_on_dhis2_user_id!:string
}
export async function getPcimneNewbornReportRepository(): Promise<Repository<PcimneNewbornReport>> {
    return Connection.getRepository(PcimneNewbornReport);
}
@Entity()
export class ChwsRecoReport {
    constructor() { };
    @PrimaryColumn({ type: 'text', nullable: false })
    id!: string

    @Column({ type: 'varchar', nullable: false })
    month!: string

    @Column({ type: 'bigint', nullable: false })
    year!: number

    @Column({ type: 'jsonb', nullable: false })
    reco_monitoring!: ChwsRecoReportElements

    @Column({ type: 'jsonb', nullable: false })
    demography!: ChwsRecoReportElements

    @Column({ type: 'jsonb', nullable: false })
    child_health_0_59_months!: ChwsRecoReportElements

    @Column({ type: 'jsonb', nullable: false })
    mother_health!: ChwsRecoReportElements

    @Column({ type: 'jsonb', nullable: false })
    pcimne_activity!: ChwsRecoReportElements

    @Column({ type: 'jsonb', nullable: false })
    morbidity_activities!: ChwsRecoReportElements

    @Column({ type: 'jsonb', nullable: false })
    malaria_more_5_years!: ChwsRecoReportElements

    @Column({ type: 'jsonb', nullable: false })
    home_visit!: ChwsRecoReportElements

    @Column({ type: 'jsonb', nullable: false })
    educational_chat!: ChwsRecoReportElements

    @Column({ type: 'jsonb', nullable: false })
    developed_areas!: ChwsRecoReportElements

    @Column({ type: 'jsonb', nullable: false })
    diseases_alerts!: ChwsRecoReportElements

    @Column({ type: 'jsonb', nullable: false })
    country!: { id: string, name: string }

    @Column({ type: 'jsonb', nullable: false })
    region!: { id: string, name: string }

    @Column({ type: 'jsonb', nullable: false })
    prefecture!: { id: string, name: string }

    @Column({ type: 'jsonb', nullable: false })
    commune!: { id: string, name: string }

    @Column({ type: 'jsonb', nullable: false })
    hospital!: { id: string, name: string }

    @Column({ type: 'jsonb', nullable: false })
    district_quartier!: { id: string, name: string }

    // @Column({ type: 'jsonb', nullable: false })
    // chw!: { id: string, name: string, phone:string }

    @Column({ type: 'jsonb', nullable: false })
    village_secteur!: { id: string, name: string }

    @Column({ type: 'jsonb', nullable: false })
    reco!: { id: string, name: string, phone:string }

    @Column({ type: 'boolean', nullable: false, default:false })
    is_validate!:boolean

    @Column({ type: 'varchar', nullable: true })
    validate_user_id!:string

    @Column({ type: 'boolean', nullable: false, default:false })
    already_on_dhis2!:boolean

    @Column({ type: 'varchar', nullable: true })
    already_on_dhis2_user_id!:string
}
export async function getChwsRecoReportRepository(): Promise<Repository<ChwsRecoReport>> {
    return Connection.getRepository(ChwsRecoReport);
}
@Entity()
export class RecoMegSituationReport {

    @PrimaryColumn({ type: 'text', nullable: false })
    id!: string

    @Column({ type: 'bigint', nullable: false })
    year!: number

    @Column({ type: 'varchar', nullable: false })
    month!: string

    @Column({ type: 'jsonb', nullable: false })
    meg_data!: RecoMegQuantityUtils[]

    @Column({ type: 'jsonb', nullable: false })
    country!: { id: string, name: string }

    @Column({ type: 'jsonb', nullable: false })
    region!: { id: string, name: string }

    @Column({ type: 'jsonb', nullable: false })
    prefecture!: { id: string, name: string }

    @Column({ type: 'jsonb', nullable: false })
    commune!: { id: string, name: string }

    @Column({ type: 'jsonb', nullable: false })
    hospital!: { id: string, name: string }

    @Column({ type: 'jsonb', nullable: false })
    district_quartier!: { id: string, name: string }

    // @Column({ type: 'jsonb', nullable: false })
    // chw!: { id: string, name: string, phone: string }

    @Column({ type: 'jsonb', nullable: false })
    village_secteur!: { id: string, name: string }

    @Column({ type: 'jsonb', nullable: false })
    reco!: { id: string, name: string, phone: string }

    @Column({ type: 'boolean', nullable: false, default:false })
    is_validate!:boolean

    @Column({ type: 'varchar', nullable: true })
    validate_user_id!:string

    @Column({ type: 'boolean', nullable: false, default:false })
    already_on_dhis2!:boolean

    @Column({ type: 'varchar', nullable: true })
    already_on_dhis2_user_id!:string

}
export async function getRecoMegSituationReportRepository(): Promise<Repository<RecoMegSituationReport>> {
    return Connection.getRepository(RecoMegSituationReport);
}