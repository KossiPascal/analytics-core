import { Entity, PrimaryColumn, Column, Repository, DataSource, PrimaryGeneratedColumn } from "typeorm";
import { AppDataSource } from "../data-source";

let Connection: DataSource = AppDataSource.manager.connection;

@Entity({ name: 'couchdb_last_seq' })
export class CouchDBLastSeq {
  @PrimaryColumn({ type: 'int' })
  id!: number;

  @Column({ type: 'varchar', nullable: false })
  seq!: string
}
export async function getCouchDBLastSeqRepository(): Promise<Repository<CouchDBLastSeq>> {
  return Connection.getRepository(CouchDBLastSeq);
}

@Entity({ name: 'couchdb' })
export class CouchDB {
  //@PrimaryColumn('uuid')
  @PrimaryColumn({ type: 'text' })
  id!: string;

  @Column({ type: 'jsonb', nullable: false })
  doc!: Record<string, any>;
}
export async function getCouchDBRepository(): Promise<Repository<CouchDB>> {
  return Connection.getRepository(CouchDB);
}

@Entity({ name: 'couchdb_users' })
export class CouchDBUsers {
  //@PrimaryColumn('uuid')
  @PrimaryColumn({ type: 'text' })
  id!: string;

  @Column({ type: 'jsonb', nullable: false })
  doc!: Record<string, any>;
}
export async function getCouchDBUsersRepository(): Promise<Repository<CouchDBUsers>> {
  return Connection.getRepository(CouchDBUsers);
}

@Entity({ name: 'couchdb_logs' })
export class CouchDBLogs {
  //@PrimaryColumn('uuid')
  @PrimaryColumn({ type: 'text' })
  id!: string;

  @Column({ type: 'jsonb', nullable: false })
  doc!: Record<string, any>;
}
export async function getCouchDBLogsRepository(): Promise<Repository<CouchDBLogs>> {
  return Connection.getRepository(CouchDBLogs);
}

@Entity({ name: 'couchdb_metas' })
export class CouchDBMetas {
  //@PrimaryColumn('uuid')
  @PrimaryColumn({ type: 'text' })
  id!: string;

  @Column({ type: 'jsonb', nullable: false })
  doc!: Record<string, any>;
}
export async function getCouchDBMetasRepository(): Promise<Repository<CouchDBMetas>> {
  return Connection.getRepository(CouchDBMetas);
}

@Entity({ name: 'couchdb_sentinel' })
export class CouchDBSentinel {
  //@PrimaryColumn('uuid')
  @PrimaryColumn({ type: 'text' })
  id!: string;

  @Column({ type: 'jsonb', nullable: false })
  doc!: Record<string, any>;
}
export async function getCouchDBSentinelRepository(): Promise<Repository<CouchDBSentinel>> {
  return Connection.getRepository(CouchDBSentinel);
}


@Entity({ name: 'couchdb_log' })
export class CouchDbLog {
    constructor() { };
    @PrimaryGeneratedColumn()
    id!: number

    @Column({ type: 'text', nullable: true })
    log!: string
}
export async function getCouchDbLogRepository(): Promise<Repository<CouchDbLog>> {
    return Connection.getRepository(CouchDbLog);
}



export interface CouchdbUser {
  id: string
  rev:string;
  name:string;
  type:string;
  email:string;
  phone:string;
  fullname:string;
  code:string;
  known: boolean | null
  contact_id:string;
  places:string[];
  roles:string[];
}

