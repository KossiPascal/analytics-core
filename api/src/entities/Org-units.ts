import { Entity, PrimaryColumn, Column, Repository, ManyToOne, JoinColumn, Unique, Index, DataSource } from "typeorm";
import { AppDataSource } from "../data_source";

let Connection: DataSource = AppDataSource.manager.connection;

// ##################################################################
@Entity()
export class Country {
  @PrimaryColumn({ type: 'text', nullable: false })
  id!: string

  @Column({ type: 'varchar', nullable: false })
  rev!: string

  @Column({ type: 'bigint', nullable: false })
  year!: number

  @Column({ type: 'varchar', nullable: false })
  month!: string

  @Column({ type: 'varchar', nullable: true })
  name!: string

  @Column({ type: 'varchar', nullable: true })
  external_id!: string

  @Column({ type: 'varchar', nullable: true })
  code!: string

  @Column({ type: 'simple-json', nullable: true })
  geolocation!: object | null

  @Column({ type: 'bigint', nullable: false })
  reported_date_timestamp!: number

  @Column({ type: 'varchar', nullable: false })
  reported_date!: string

  @Column({ type: 'varchar', nullable: true })
  reported_full_date!: string | null
}
export async function getCountryRepository(): Promise<Repository<Country>> {
  return Connection.getRepository(Country);
}

// ##################################################################
@Entity()
export class Region {
  @PrimaryColumn({ type: 'text', nullable: false })
  id!: string

  @Column({ type: 'varchar', nullable: false })
  rev!: string

  @Column({ type: 'bigint', nullable: false })
  year!: number

  @Column({ type: 'varchar', nullable: false })
  month!: string

  @Column({ type: 'varchar', nullable: true })
  name!: string

  @Column({ type: 'varchar', nullable: true })
  external_id!: string

  @Column({ type: 'varchar', nullable: true })
  code!: string

  @Column({ type: 'simple-json', nullable: true })
  geolocation!: object | null

  @ManyToOne(() => Country, (country) => country.id, { lazy: true, eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'country_id', referencedColumnName: 'id' })
  country!: Country

  @Column({ type: 'bigint', nullable: false })
  reported_date_timestamp!: number

  @Column({ type: 'varchar', nullable: false })
  reported_date!: string

  @Column({ type: 'varchar', nullable: true })
  reported_full_date!: string | null
}
export async function getRegionRepository(): Promise<Repository<Region>> {
  return Connection.getRepository(Region);
}

// ##################################################################
@Entity()
export class Prefecture {
  @PrimaryColumn({ type: 'text', nullable: false })
  id!: string

  @Column({ type: 'varchar', nullable: false })
  rev!: string

  @Column({ type: 'bigint', nullable: false })
  year!: number

  @Column({ type: 'varchar', nullable: false })
  month!: string

  @Column({ type: 'varchar', nullable: true })
  name!: string

  @Column({ type: 'varchar', nullable: true })
  external_id!: string

  @Column({ type: 'varchar', nullable: true })
  code!: string

  @Column({ type: 'simple-json', nullable: true })
  geolocation!: object | null

  @ManyToOne(() => Country, (country) => country.id, { lazy: true, eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'country_id', referencedColumnName: 'id' })
  country!: Country

  @ManyToOne(() => Region, (region) => region.id, { lazy: true, eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'region_id', referencedColumnName: 'id' })
  region!: Region

  @Column({ type: 'bigint', nullable: false })
  reported_date_timestamp!: number

  @Column({ type: 'varchar', nullable: false })
  reported_date!: string

  @Column({ type: 'varchar', nullable: true })
  reported_full_date!: string | null
}
export async function getPrefectureRepository(): Promise<Repository<Prefecture>> {
  return Connection.getRepository(Prefecture);
}

// ##################################################################
@Entity()
export class Commune {
  @PrimaryColumn({ type: 'text', nullable: false })
  id!: string

  @Column({ type: 'varchar', nullable: false })
  rev!: string

  @Column({ type: 'bigint', nullable: false })
  year!: number

  @Column({ type: 'varchar', nullable: false })
  month!: string

  @Column({ type: 'varchar', nullable: true })
  name!: string

  @Column({ type: 'varchar', nullable: true })
  external_id!: string

  @Column({ type: 'varchar', nullable: true })
  code!: string

  @Column({ type: 'simple-json', nullable: true })
  geolocation!: object | null

  @ManyToOne(() => Country, (country) => country.id, { lazy: true, eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'country_id', referencedColumnName: 'id' })
  country!: Country

  @ManyToOne(() => Region, (region) => region.id, { lazy: true, eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'region_id', referencedColumnName: 'id' })
  region!: Region

  @ManyToOne(() => Prefecture, (prefecture) => prefecture.id, { lazy: true, eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'prefecture_id', referencedColumnName: 'id' })
  prefecture!: Prefecture

  @Column({ type: 'bigint', nullable: false })
  reported_date_timestamp!: number

  @Column({ type: 'varchar', nullable: false })
  reported_date!: string

  @Column({ type: 'varchar', nullable: true })
  reported_full_date!: string | null
}
export async function getCommuneRepository(): Promise<Repository<Commune>> {
  return Connection.getRepository(Commune);
}

// ##################################################################
@Entity()
export class Hospital {
  @PrimaryColumn({ type: 'text', nullable: false })
  id!: string

  @Column({ type: 'varchar', nullable: false })
  rev!: string

  @Column({ type: 'bigint', nullable: false })
  year!: number

  @Column({ type: 'varchar', nullable: false })
  month!: string

  @Column({ type: 'varchar', nullable: true })
  name!: string

  @Column({ type: 'varchar', nullable: true })
  external_id!: string

  @Column({ type: 'varchar', nullable: true })
  code!: string

  @Column({ type: 'simple-json', nullable: true })
  geolocation!: object | null

  @ManyToOne(() => Country, (country) => country.id, { lazy: true, eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'country_id', referencedColumnName: 'id' })
  country!: Country

  @ManyToOne(() => Region, (region) => region.id, { lazy: true, eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'region_id', referencedColumnName: 'id' })
  region!: Region

  @ManyToOne(() => Prefecture, (prefecture) => prefecture.id, { lazy: true, eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'prefecture_id', referencedColumnName: 'id' })
  prefecture!: Prefecture

  @ManyToOne(() => Commune, (commune) => commune.id, { lazy: true, eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'commune_id', referencedColumnName: 'id' })
  commune!: Commune

  @Column({ type: 'bigint', nullable: false })
  reported_date_timestamp!: number

  @Column({ type: 'varchar', nullable: false })
  reported_date!: string

  @Column({ type: 'varchar', nullable: true })
  reported_full_date!: string | null
}
export async function getHospitalRepository(): Promise<Repository<Hospital>> {
  return Connection.getRepository(Hospital);
}

// ##################################################################

@Entity()
export class CountryManager {
  @PrimaryColumn({ type: 'text', nullable: false })
  id!: string

  @Column({ type: 'varchar', nullable: false })
  rev!: string

  @Column({ type: 'bigint', nullable: false })
  year!: number

  @Column({ type: 'varchar', nullable: false })
  month!: string

  @Column({ type: 'varchar', nullable: true })
  name!: string

  @Column({ type: 'varchar', nullable: true })
  code!: string

  @Column({ type: 'varchar', nullable: true })
  external_id!: string

  @Column({ type: 'varchar', nullable: true })
  role!: string

  @Column({ type: 'varchar', nullable: true })
  sex!: 'M' | 'F' | null

  @Column({ type: 'varchar', nullable: true })
  date_of_birth!: string

  @Column({ type: 'varchar', nullable: true })
  phone!: string

  @Column({ type: 'varchar', nullable: true })
  email!: string

  @Column({ type: 'varchar', nullable: true })
  profession!: string

  @Column({ type: 'simple-json', nullable: true })
  geolocation!: object | null

  @ManyToOne(() => Country, (country) => country.id, { lazy: true, eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'country_id', referencedColumnName: 'id' })
  country!: Country

  @Column({ type: 'bigint', nullable: false })
  reported_date_timestamp!: number

  @Column({ type: 'varchar', nullable: false })
  reported_date!: string

  @Column({ type: 'varchar', nullable: true })
  reported_full_date!: string | null
}
export async function getCountryManagerRepository(): Promise<Repository<CountryManager>> {
  return Connection.getRepository(CountryManager);
}

// ##################################################################
@Entity()
export class RegionManager {
  @PrimaryColumn({ type: 'text', nullable: false })
  id!: string

  @Column({ type: 'varchar', nullable: false })
  rev!: string

  @Column({ type: 'bigint', nullable: false })
  year!: number

  @Column({ type: 'varchar', nullable: false })
  month!: string

  @Column({ type: 'varchar', nullable: true })
  name!: string

  @Column({ type: 'varchar', nullable: true })
  code!: string

  @Column({ type: 'varchar', nullable: true })
  external_id!: string

  @Column({ type: 'varchar', nullable: true })
  role!: string

  @Column({ type: 'varchar', nullable: true })
  sex!: 'M' | 'F' | null

  @Column({ type: 'varchar', nullable: true })
  date_of_birth!: string

  @Column({ type: 'varchar', nullable: true })
  phone!: string

  @Column({ type: 'varchar', nullable: true })
  email!: string

  @Column({ type: 'varchar', nullable: true })
  profession!: string

  @Column({ type: 'simple-json', nullable: true })
  geolocation!: object | null

  @ManyToOne(() => Country, (country) => country.id, { lazy: true, eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'country_id', referencedColumnName: 'id' })
  country!: Country

  @ManyToOne(() => Region, (region) => region.id, { lazy: true, eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'region_id', referencedColumnName: 'id' })
  region!: Region

  @Column({ type: 'bigint', nullable: false })
  reported_date_timestamp!: number

  @Column({ type: 'varchar', nullable: false })
  reported_date!: string

  @Column({ type: 'varchar', nullable: true })
  reported_full_date!: string | null
}
export async function getRegionManagerRepository(): Promise<Repository<RegionManager>> {
  return Connection.getRepository(RegionManager);
}

// ##################################################################
@Entity()
export class PrefectureManager {
  @PrimaryColumn({ type: 'text', nullable: false })
  id!: string

  @Column({ type: 'varchar', nullable: false })
  rev!: string

  @Column({ type: 'bigint', nullable: false })
  year!: number

  @Column({ type: 'varchar', nullable: false })
  month!: string

  @Column({ type: 'varchar', nullable: true })
  name!: string

  @Column({ type: 'varchar', nullable: true })
  code!: string

  @Column({ type: 'varchar', nullable: true })
  external_id!: string

  @Column({ type: 'varchar', nullable: true })
  role!: string

  @Column({ type: 'varchar', nullable: true })
  sex!: 'M' | 'F' | null

  @Column({ type: 'varchar', nullable: true })
  date_of_birth!: string

  @Column({ type: 'varchar', nullable: true })
  phone!: string

  @Column({ type: 'varchar', nullable: true })
  email!: string

  @Column({ type: 'varchar', nullable: true })
  profession!: string

  @Column({ type: 'simple-json', nullable: true })
  geolocation!: object | null

  @ManyToOne(() => Country, (country) => country.id, { lazy: true, eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'country_id', referencedColumnName: 'id' })
  country!: Country

  @ManyToOne(() => Region, (region) => region.id, { lazy: true, eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'region_id', referencedColumnName: 'id' })
  region!: Region

  @ManyToOne(() => Prefecture, (prefecture) => prefecture.id, { lazy: true, eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'prefecture_id', referencedColumnName: 'id' })
  prefecture!: Prefecture

  @Column({ type: 'bigint', nullable: false })
  reported_date_timestamp!: number

  @Column({ type: 'varchar', nullable: false })
  reported_date!: string

  @Column({ type: 'varchar', nullable: true })
  reported_full_date!: string | null
}
export async function getPrefectureManagerRepository(): Promise<Repository<PrefectureManager>> {
  return Connection.getRepository(PrefectureManager);
}

// ##################################################################
@Entity()
export class CommuneManager {
  @PrimaryColumn({ type: 'text', nullable: false })
  id!: string

  @Column({ type: 'varchar', nullable: false })
  rev!: string

  @Column({ type: 'bigint', nullable: false })
  year!: number

  @Column({ type: 'varchar', nullable: false })
  month!: string

  @Column({ type: 'varchar', nullable: true })
  name!: string

  @Column({ type: 'varchar', nullable: true })
  code!: string

  @Column({ type: 'varchar', nullable: true })
  external_id!: string

  @Column({ type: 'varchar', nullable: true })
  role!: string

  @Column({ type: 'varchar', nullable: true })
  sex!: 'M' | 'F' | null

  @Column({ type: 'varchar', nullable: true })
  date_of_birth!: string

  @Column({ type: 'varchar', nullable: true })
  phone!: string

  @Column({ type: 'varchar', nullable: true })
  email!: string

  @Column({ type: 'varchar', nullable: true })
  profession!: string

  @Column({ type: 'simple-json', nullable: true })
  geolocation!: object | null

  @ManyToOne(() => Country, (country) => country.id, { lazy: true, eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'country_id', referencedColumnName: 'id' })
  country!: Country

  @ManyToOne(() => Region, (region) => region.id, { lazy: true, eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'region_id', referencedColumnName: 'id' })
  region!: Region

  @ManyToOne(() => Prefecture, (prefecture) => prefecture.id, { lazy: true, eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'prefecture_id', referencedColumnName: 'id' })
  prefecture!: Prefecture

  @ManyToOne(() => Commune, (commune) => commune.id, { lazy: true, eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'commune_id', referencedColumnName: 'id' })
  commune!: Commune

  @Column({ type: 'bigint', nullable: false })
  reported_date_timestamp!: number

  @Column({ type: 'varchar', nullable: false })
  reported_date!: string

  @Column({ type: 'varchar', nullable: true })
  reported_full_date!: string | null
}
export async function getCommuneManagerRepository(): Promise<Repository<CommuneManager>> {
  return Connection.getRepository(CommuneManager);
}

// ##################################################################
@Entity()
export class HospitalManager {
  @PrimaryColumn({ type: 'text', nullable: false })
  id!: string

  @Column({ type: 'varchar', nullable: false })
  rev!: string

  @Column({ type: 'bigint', nullable: false })
  year!: number

  @Column({ type: 'varchar', nullable: false })
  month!: string

  @Column({ type: 'varchar', nullable: true })
  name!: string

  @Column({ type: 'varchar', nullable: true })
  code!: string

  @Column({ type: 'varchar', nullable: true })
  external_id!: string

  @Column({ type: 'varchar', nullable: true })
  role!: string

  @Column({ type: 'varchar', nullable: true })
  sex!: 'M' | 'F' | null

  @Column({ type: 'varchar', nullable: true })
  date_of_birth!: string

  @Column({ type: 'varchar', nullable: true })
  phone!: string

  @Column({ type: 'varchar', nullable: true })
  email!: string

  @Column({ type: 'varchar', nullable: true })
  profession!: string

  @Column({ type: 'simple-json', nullable: true })
  geolocation!: object | null

  @ManyToOne(() => Country, (country) => country.id, { lazy: true, eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'country_id', referencedColumnName: 'id' })
  country!: Country

  @ManyToOne(() => Region, (region) => region.id, { lazy: true, eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'region_id', referencedColumnName: 'id' })
  region!: Region

  @ManyToOne(() => Prefecture, (prefecture) => prefecture.id, { lazy: true, eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'prefecture_id', referencedColumnName: 'id' })
  prefecture!: Prefecture

  @ManyToOne(() => Commune, (commune) => commune.id, { lazy: true, eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'commune_id', referencedColumnName: 'id' })
  commune!: Commune

  @ManyToOne(() => Hospital, (hospital) => hospital.id, { lazy: true, eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'hospital_id', referencedColumnName: 'id' })
  hospital!: Hospital

  @Column({ type: 'bigint', nullable: false })
  reported_date_timestamp!: number

  @Column({ type: 'varchar', nullable: false })
  reported_date!: string

  @Column({ type: 'varchar', nullable: true })
  reported_full_date!: string | null
}
export async function getHospitalManagerRepository(): Promise<Repository<HospitalManager>> {
  return Connection.getRepository(HospitalManager);
}

// ##################################################################
@Entity()
export class DistrictQuartier {
  @PrimaryColumn({ type: 'text', nullable: false })
  id!: string

  @Column({ type: 'varchar', nullable: false })
  rev!: string

  @Column({ type: 'bigint', nullable: false })
  year!: number

  @Column({ type: 'varchar', nullable: false })
  month!: string

  @Column({ type: 'varchar', nullable: true })
  name!: string

  @Column({ type: 'varchar', nullable: true })
  external_id!: string

  @Column({ type: 'varchar', nullable: true })
  code!: string

  // @Column({ type: 'varchar', nullable: true })
  // chw_id!: string

  @Column({ type: 'simple-json', nullable: true })
  geolocation!: object | null

  @ManyToOne(() => Country, (country) => country.id, { lazy: true, eager: true, nullable: true, onDelete: "CASCADE", onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'country_id', referencedColumnName: 'id' })
  country!: Country

  @ManyToOne(() => Region, (region) => region.id, { lazy: true, eager: true, nullable: true, onDelete: "CASCADE", onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'region_id', referencedColumnName: 'id' })
  region!: Region

  @ManyToOne(() => Prefecture, (prefecture) => prefecture.id, { lazy: true, eager: true, nullable: true, onDelete: "CASCADE", onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'prefecture_id', referencedColumnName: 'id' })
  prefecture!: Prefecture

  @ManyToOne(() => Commune, (commune) => commune.id, { lazy: true, eager: true, nullable: true, onDelete: "CASCADE", onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'commune_id', referencedColumnName: 'id' })
  commune!: Commune

  @ManyToOne(() => Hospital, (hospital) => hospital.id, { lazy: true, eager: true, nullable: true, onDelete: "CASCADE", onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'hospital_id', referencedColumnName: 'id' })
  hospital!: Hospital | null

  @Column({ type: 'bigint', nullable: false })
  reported_date_timestamp!: number

  @Column({ type: 'varchar', nullable: false })
  reported_date!: string

  @Column({ type: 'varchar', nullable: true })
  reported_full_date!: string | null
}
export async function getDistrictQuartierRepository(): Promise<Repository<DistrictQuartier>> {
  return Connection.getRepository(DistrictQuartier);
}

// ##################################################################
@Entity()
export class VillageSecteur {
  @PrimaryColumn({ type: 'text', nullable: false })
  id!: string

  @Column({ type: 'varchar', nullable: false })
  rev!: string

  @Column({ type: 'bigint', nullable: false })
  year!: number

  @Column({ type: 'varchar', nullable: false })
  month!: string

  @Column({ type: 'varchar', nullable: true })
  name!: string

  @Column({ type: 'varchar', nullable: true })
  external_id!: string

  @Column({ type: 'varchar', nullable: true })
  code!: string

  @Column({ type: 'simple-json', nullable: true })
  geolocation!: object | null

  @Column({ type: 'varchar', nullable: true })
  reco_id!: string

  @ManyToOne(() => Country, (country) => country.id, { lazy: true, eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'country_id', referencedColumnName: 'id' })
  country!: Country

  @ManyToOne(() => Region, (region) => region.id, { lazy: true, eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'region_id', referencedColumnName: 'id' })
  region!: Region

  @ManyToOne(() => Prefecture, (prefecture) => prefecture.id, { lazy: true, eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'prefecture_id', referencedColumnName: 'id' })
  prefecture!: Prefecture

  @ManyToOne(() => Commune, (commune) => commune.id, { lazy: true, eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'commune_id', referencedColumnName: 'id' })
  commune!: Commune

  @ManyToOne(() => Hospital, (hospital) => hospital.id, { lazy: true, eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'hospital_id', referencedColumnName: 'id' })
  hospital!: Hospital

  @ManyToOne(() => DistrictQuartier, (district_quartier) => district_quartier.id, { lazy: true, eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'district_quartier_id', referencedColumnName: 'id' })
  district_quartier!: DistrictQuartier

  @Column({ type: 'bigint', nullable: false })
  reported_date_timestamp!: number

  @Column({ type: 'varchar', nullable: false })
  reported_date!: string

  @Column({ type: 'varchar', nullable: true })
  reported_full_date!: string | null
}
export async function getVillageSecteurRepository(): Promise<Repository<VillageSecteur>> {
  return Connection.getRepository(VillageSecteur);
}

// ##################################################################
@Entity()
export class Chw {
  @PrimaryColumn({ type: 'text', nullable: false })
  id!: string

  @Column({ type: 'varchar', nullable: false })
  rev!: string

  @Column({ type: 'bigint', nullable: false })
  year!: number

  @Column({ type: 'varchar', nullable: false })
  month!: string

  @Column({ type: 'varchar', nullable: true })
  name!: string

  @Column({ type: 'varchar', nullable: true })
  code!: string

  @Column({ type: 'varchar', nullable: true })
  external_id!: string

  @Column({ type: 'varchar', nullable: true })
  role!: string

  @Column({ type: 'varchar', nullable: true })
  sex!: 'M' | 'F' | null

  @Column({ type: 'varchar', nullable: true })
  date_of_birth!: string

  @Column({ type: 'varchar', nullable: true })
  phone!: string

  @Column({ type: 'varchar', nullable: true })
  email!: string

  @Column({ type: 'varchar', nullable: true })
  profession!: string

  @Column({ type: 'simple-json', nullable: true })
  geolocation!: object | null

  @ManyToOne(() => Country, (country) => country.id, { lazy: true, eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'country_id', referencedColumnName: 'id' })
  country!: Country

  @ManyToOne(() => Region, (region) => region.id, { lazy: true, eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'region_id', referencedColumnName: 'id' })
  region!: Region

  @ManyToOne(() => Prefecture, (prefecture) => prefecture.id, { lazy: true, eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'prefecture_id', referencedColumnName: 'id' })
  prefecture!: Prefecture

  @ManyToOne(() => Commune, (commune) => commune.id, { lazy: true, eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'commune_id', referencedColumnName: 'id' })
  commune!: Commune

  @ManyToOne(() => Hospital, (hospital) => hospital.id, { lazy: true, eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'hospital_id', referencedColumnName: 'id' })
  hospital!: Hospital

  @ManyToOne(() => DistrictQuartier, (district_quartier) => district_quartier.id, { lazy: true, eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'district_quartier_id', referencedColumnName: 'id' })
  district_quartier!: DistrictQuartier

  @Column({ type: 'bigint', nullable: false })
  reported_date_timestamp!: number

  @Column({ type: 'varchar', nullable: false })
  reported_date!: string

  @Column({ type: 'varchar', nullable: true })
  reported_full_date!: string | null
}
export async function getChwRepository(): Promise<Repository<Chw>> {
  return Connection.getRepository(Chw);
}

// ##################################################################
@Entity()
export class Reco {
  @PrimaryColumn({ type: 'text', nullable: false })
  id!: string

  @Column({ type: 'varchar', nullable: false })
  rev!: string

  @Column({ type: 'bigint', nullable: false })
  year!: number

  @Column({ type: 'varchar', nullable: false })
  month!: string

  @Column({ type: 'varchar', nullable: true })
  name!: string

  @Column({ type: 'varchar', nullable: true })
  code!: string

  @Column({ type: 'varchar', nullable: true })
  external_id!: string

  @Column({ type: 'varchar', nullable: true })
  role!: string

  @Column({ type: 'varchar', nullable: true })
  sex!: 'M' | 'F' | null

  @Column({ type: 'varchar', nullable: true })
  date_of_birth!: string

  @Column({ type: 'varchar', nullable: true })
  phone!: string

  @Column({ type: 'varchar', nullable: true })
  email!: string

  @Column({ type: 'varchar', nullable: true })
  profession!: string

  @Column({ type: 'simple-json', nullable: true })
  geolocation!: object | null

  @ManyToOne(() => Country, (country) => country.id, { lazy: true, eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'country_id', referencedColumnName: 'id' })
  country!: Country

  @ManyToOne(() => Region, (region) => region.id, { lazy: true, eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'region_id', referencedColumnName: 'id' })
  region!: Region

  @ManyToOne(() => Prefecture, (prefecture) => prefecture.id, { lazy: true, eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'prefecture_id', referencedColumnName: 'id' })
  prefecture!: Prefecture

  @ManyToOne(() => Commune, (commune) => commune.id, { lazy: true, eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'commune_id', referencedColumnName: 'id' })
  commune!: Commune

  @ManyToOne(() => Hospital, (hospital) => hospital.id, { lazy: true, eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'hospital_id', referencedColumnName: 'id' })
  hospital!: Hospital

  @ManyToOne(() => DistrictQuartier, (district_quartier) => district_quartier.id, { lazy: true, eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'district_quartier_id', referencedColumnName: 'id' })
  district_quartier!: DistrictQuartier

  @ManyToOne(() => VillageSecteur, (village_secteur) => village_secteur.id, { lazy: true, eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'village_secteur_id', referencedColumnName: 'id' })
  village_secteur!: VillageSecteur

  // @ManyToOne(() => Chw, (chw) => chw.id, { lazy: true, eager: true, nullable: true, onDelete: "CASCADE", onUpdate: 'CASCADE' })
  // @JoinColumn({ name: 'chw_id', referencedColumnName: 'id' })
  // chw!: Chw | null

  // @Column({ type: 'simple-json', nullable: true })
  // chw!: object | null

  @Column({ type: 'bigint', nullable: false })
  reported_date_timestamp!: number

  @Column({ type: 'varchar', nullable: false })
  reported_date!: string

  @Column({ type: 'varchar', nullable: true })
  reported_full_date!: string | null
}
export async function getRecoRepository(): Promise<Repository<Reco>> {
  return Connection.getRepository(Reco);
}

// ##################################################################
@Entity()
export class Family {
  @PrimaryColumn({ type: 'text', nullable: false })
  id!: string

  @Column({ type: 'varchar', nullable: false })
  rev!: string

  @Column({ type: 'bigint', nullable: false })
  year!: number

  @Column({ type: 'varchar', nullable: false })
  month!: string

  @Column({ type: 'varchar', nullable: true })
  given_name!: string

  @Column({ type: 'varchar', nullable: true })
  name!: string

  @Column({ type: 'varchar', nullable: true })
  external_id!: string

  @Column({ type: 'varchar', nullable: true })
  code!: string

  @Column({ type: 'boolean', nullable: true })
  household_has_working_latrine!: boolean | null

  @Column({ type: 'boolean', nullable: true })
  household_has_good_water_access!: boolean | null

  @Column({ type: 'simple-json', nullable: true })
  geolocation!: object | null

  @ManyToOne(() => Country, (country) => country.id, { lazy: true, eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'country_id', referencedColumnName: 'id' })
  country!: Country

  @ManyToOne(() => Region, (region) => region.id, { lazy: true, eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'region_id', referencedColumnName: 'id' })
  region!: Region

  @ManyToOne(() => Prefecture, (prefecture) => prefecture.id, { lazy: true, eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'prefecture_id', referencedColumnName: 'id' })
  prefecture!: Prefecture

  @ManyToOne(() => Commune, (commune) => commune.id, { lazy: true, eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'commune_id', referencedColumnName: 'id' })
  commune!: Commune

  @ManyToOne(() => Hospital, (hospital) => hospital.id, { lazy: true, eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'hospital_id', referencedColumnName: 'id' })
  hospital!: Hospital

  @ManyToOne(() => DistrictQuartier, (district_quartier) => district_quartier.id, { lazy: true, eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'district_quartier_id', referencedColumnName: 'id' })
  district_quartier!: DistrictQuartier

  // @ManyToOne(() => Chw, (chw) => chw.id, { lazy: true, eager: true, nullable: true, onDelete: "CASCADE", onUpdate: 'CASCADE' })
  // @JoinColumn({ name: 'chw_id', referencedColumnName: 'id' })
  // chw!: Chw | null

  @ManyToOne(() => VillageSecteur, (village_secteur) => village_secteur.id, { lazy: true, eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'village_secteur_id', referencedColumnName: 'id' })
  village_secteur!: VillageSecteur

  @ManyToOne(() => Reco, (reco) => reco.id, { lazy: true, eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'reco_id', referencedColumnName: 'id' })
  reco!: Reco

  @Column({ type: 'bigint', nullable: false })
  reported_date_timestamp!: number

  @Column({ type: 'varchar', nullable: false })
  reported_date!: string

  @Column({ type: 'varchar', nullable: true })
  reported_full_date!: string | null
}
export async function getFamilyRepository(): Promise<Repository<Family>> {
  return Connection.getRepository(Family);
}

// ##################################################################
@Entity()
export class Patient {
  @PrimaryColumn({ type: 'text', nullable: false })
  id!: string

  @Column({ type: 'varchar', nullable: false })
  rev!: string

  @Column({ type: 'bigint', nullable: false })
  year!: number

  @Column({ type: 'varchar', nullable: false })
  month!: string

  @Column({ type: 'varchar', nullable: true })
  name!: string

  @Column({ type: 'varchar', nullable: true })
  code!: string

  @Column({ type: 'varchar', nullable: true })
  external_id!: string

  @Column({ type: 'varchar', nullable: true })
  role!: string

  @Column({ type: 'varchar', nullable: true })
  sex!: 'M' | 'F' | null

  @Column({ type: 'varchar', nullable: true })
  date_of_birth!: string

  @Column({ type: 'float', nullable: true })
  age_in_year_on_creation!: number

  @Column({ type: 'float', nullable: true })
  age_in_month_on_creation!: number

  @Column({ type: 'float', nullable: true })
  age_in_day_on_creation!: number

  @Column({ type: 'varchar', nullable: true })
  phone!: string | null

  @Column({ type: 'varchar', nullable: true })
  profession!: string | null

  @Column({ type: 'varchar', nullable: true })
  relationship_with_household_head!: string

  @Column({ type: 'boolean', nullable: true })
  has_birth_certificate!: boolean | null

  @Column({ type: 'varchar', nullable: true })
  place_of_death!: string | null

  @Column({ type: 'boolean', nullable: true })
  is_home_death!: boolean | null

  @Column({ type: 'boolean', nullable: true })
  is_stillbirth!: boolean | null


  @Column({ type: 'simple-json', nullable: true })
  geolocation!: object | null

  @ManyToOne(() => Country, (country) => country.id, { lazy: true, eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'country_id', referencedColumnName: 'id' })
  country!: Country

  @ManyToOne(() => Region, (region) => region.id, { lazy: true, eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'region_id', referencedColumnName: 'id' })
  region!: Region

  @ManyToOne(() => Prefecture, (prefecture) => prefecture.id, { lazy: true, eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'prefecture_id', referencedColumnName: 'id' })
  prefecture!: Prefecture

  @ManyToOne(() => Commune, (commune) => commune.id, { lazy: true, eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'commune_id', referencedColumnName: 'id' })
  commune!: Commune

  @ManyToOne(() => Hospital, (hospital) => hospital.id, { lazy: true, eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'hospital_id', referencedColumnName: 'id' })
  hospital!: Hospital

  @ManyToOne(() => DistrictQuartier, (district_quartier) => district_quartier.id, { lazy: true, eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'district_quartier_id', referencedColumnName: 'id' })
  district_quartier!: DistrictQuartier

  @ManyToOne(() => VillageSecteur, (village_secteur) => village_secteur.id, { lazy: true, eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'village_secteur_id', referencedColumnName: 'id' })
  village_secteur!: VillageSecteur

  @ManyToOne(() => Family, (family) => family.id, { lazy: true, eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'family_id', referencedColumnName: 'id' })
  family!: Family

  // @ManyToOne(() => Chw, (chw) => chw.id, { lazy: true, eager: true, nullable: true, onDelete: "CASCADE", onUpdate: 'CASCADE' })
  // @JoinColumn({ name: 'chw_id', referencedColumnName: 'id' })
  // chw!: Chw | null

  @ManyToOne(() => Reco, (reco) => reco.id, { lazy: true, eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'reco_id', referencedColumnName: 'id' })
  reco!: Reco

  @Column({ type: 'varchar', nullable: true })
  date_of_death!: string | null

  @Column({ type: 'bigint', nullable: true })
  year_of_death!: number | null

  @Column({ type: 'varchar', nullable: true })
  month_of_death!: string | null

  @Column({ type: 'bigint', nullable: false })
  reported_date_timestamp!: number

  @Column({ type: 'varchar', nullable: false })
  reported_date!: string

  @Column({ type: 'varchar', nullable: true })
  reported_full_date!: string | null
}
export async function getPatientRepository(): Promise<Repository<Patient>> {
  return Connection.getRepository(Patient);
}

// ##################################################################