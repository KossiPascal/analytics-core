import { Entity, PrimaryColumn, Column, Repository, DataSource } from "typeorm"
import { AppDataSource } from "../data-source";
import { Users } from "./User";

// export enum FlightType { DOMESTIC = "domestic", INTERNATIONAL = "international" }
let Connection: DataSource = AppDataSource.manager.connection;

@Entity()
export class PromotionReportValidation {
    constructor() { };
    @PrimaryColumn({ type: 'text', nullable: false })
    uid!: string

    @Column({ type: 'boolean', nullable: false, default:false })
    is_validate!:boolean

    @Column({ type: 'varchar', nullable: true })
    validated_at!:string

    @Column({ type: 'varchar', nullable: true })
    validated_by!:Users

    @Column({ type: 'varchar', nullable: true })
    canceled_at!:string

    @Column({ type: 'varchar', nullable: true })
    canceled_by!:Users

    @Column({ type: 'boolean', nullable: false, default:false })
    on_dhis2!:boolean

    @Column({ type: 'varchar', nullable: true })
    on_dhis2_at!:string

    @Column({ type: 'varchar', nullable: true })
    on_dhis2_by!:Users
}
export async function getPromotionReportValidationRepository(): Promise<Repository<PromotionReportValidation>> {
    return Connection.getRepository(PromotionReportValidation);
}

@Entity()
export class FamilyPlanningReportValidation {
    @PrimaryColumn({ type: 'text', nullable: false })
    uid!: string

    @Column({ type: 'boolean', nullable: false, default:false })
    is_validate!:boolean

    @Column({ type: 'varchar', nullable: true })
    validated_at!:string

    @Column({ type: 'varchar', nullable: true })
    validated_by!:Users

    @Column({ type: 'varchar', nullable: true })
    canceled_at!:string

    @Column({ type: 'varchar', nullable: true })
    canceled_by!:Users

    @Column({ type: 'boolean', nullable: false, default:false })
    on_dhis2!:boolean

    @Column({ type: 'varchar', nullable: true })
    on_dhis2_at!:string

    @Column({ type: 'varchar', nullable: true })
    on_dhis2_by!:Users
}
export async function getFamilyPlanningReportValidationRepository(): Promise<Repository<FamilyPlanningReportValidation>> {
    return Connection.getRepository(FamilyPlanningReportValidation);
}

@Entity()
export class MorbidityReportValidation {
    @PrimaryColumn({ type: 'text', nullable: false })
    uid!: string

    @Column({ type: 'boolean', nullable: false, default:false })
    is_validate!:boolean

    @Column({ type: 'varchar', nullable: true })
    validated_at!:string

    @Column({ type: 'varchar', nullable: true })
    validated_by!:Users

    @Column({ type: 'varchar', nullable: true })
    canceled_at!:string

    @Column({ type: 'varchar', nullable: true })
    canceled_by!:Users

    @Column({ type: 'boolean', nullable: false, default:false })
    on_dhis2!:boolean

    @Column({ type: 'varchar', nullable: true })
    on_dhis2_at!:string

    @Column({ type: 'varchar', nullable: true })
    on_dhis2_by!:Users
}
export async function getMorbidityReportValidationRepository(): Promise<Repository<MorbidityReportValidation>> {
    return Connection.getRepository(MorbidityReportValidation);
}

@Entity()
export class HouseholdRecapReportValidation {
    constructor() { };
    @PrimaryColumn({ type: 'text', nullable: false })
    uid!: string

    @Column({ type: 'boolean', nullable: false, default:false })
    is_validate!:boolean

    @Column({ type: 'varchar', nullable: true })
    validated_at!:string

    @Column({ type: 'varchar', nullable: true })
    validated_by!:Users

    @Column({ type: 'varchar', nullable: true })
    canceled_at!:string

    @Column({ type: 'varchar', nullable: true })
    canceled_by!:Users

    @Column({ type: 'boolean', nullable: false, default:false })
    on_dhis2!:boolean

    @Column({ type: 'varchar', nullable: true })
    on_dhis2_at!:string

    @Column({ type: 'varchar', nullable: true })
    on_dhis2_by!:Users
}
export async function getHouseholdRecapReportValidationRepository(): Promise<Repository<HouseholdRecapReportValidation>> {
    return Connection.getRepository(HouseholdRecapReportValidation);
}

@Entity()
export class PcimneNewbornReportValidation {
    constructor() { };
    @PrimaryColumn({ type: 'text', nullable: false })
    uid!: string

    @Column({ type: 'boolean', nullable: false, default:false })
    is_validate!:boolean

    @Column({ type: 'varchar', nullable: true })
    validated_at!:string

    @Column({ type: 'varchar', nullable: true })
    validated_by!:Users

    @Column({ type: 'varchar', nullable: true })
    canceled_at!:string

    @Column({ type: 'varchar', nullable: true })
    canceled_by!:Users

    @Column({ type: 'boolean', nullable: false, default:false })
    on_dhis2!:boolean

    @Column({ type: 'varchar', nullable: true })
    on_dhis2_at!:string

    @Column({ type: 'varchar', nullable: true })
    on_dhis2_by!:Users
}
export async function getPcimneNewbornReportValidationRepository(): Promise<Repository<PcimneNewbornReportValidation>> {
    return Connection.getRepository(PcimneNewbornReportValidation);
}

@Entity()
export class ChwsRecoReportValidation {
    constructor() { };
    @PrimaryColumn({ type: 'text', nullable: false })
    uid!: string

    @Column({ type: 'boolean', nullable: false, default:false })
    is_validate!:boolean

    @Column({ type: 'varchar', nullable: true })
    validated_at!:string

    @Column({ type: 'varchar', nullable: true })
    validated_by!:Users

    @Column({ type: 'varchar', nullable: true })
    canceled_at!:string

    @Column({ type: 'varchar', nullable: true })
    canceled_by!:Users

    @Column({ type: 'boolean', nullable: false, default:false })
    on_dhis2!:boolean

    @Column({ type: 'varchar', nullable: true })
    on_dhis2_at!:string

    @Column({ type: 'varchar', nullable: true })
    on_dhis2_by!:Users
}
export async function getChwsRecoReportValidationRepository(): Promise<Repository<ChwsRecoReportValidation>> {
    return Connection.getRepository(ChwsRecoReportValidation);
}

@Entity()
export class RecoMegSituationReportValidation {
    @PrimaryColumn({ type: 'text', nullable: false })
    uid!: string

    @Column({ type: 'boolean', nullable: false, default:false })
    is_validate!:boolean

    @Column({ type: 'varchar', nullable: true })
    validated_at!:string

    @Column({ type: 'varchar', nullable: true })
    validated_by!:Users

    @Column({ type: 'varchar', nullable: true })
    canceled_at!:string

    @Column({ type: 'varchar', nullable: true })
    canceled_by!:Users

    @Column({ type: 'boolean', nullable: false, default:false })
    on_dhis2!:boolean

    @Column({ type: 'varchar', nullable: true })
    on_dhis2_at!:string

    @Column({ type: 'varchar', nullable: true })
    on_dhis2_by!:Users
}
export async function getRecoMegSituationReportValidationRepository(): Promise<Repository<RecoMegSituationReportValidation>> {
    return Connection.getRepository(RecoMegSituationReportValidation);
}