import { Entity, PrimaryGeneratedColumn, Column, Repository, DataSource } from "typeorm"
import { AppDataSource } from "../data-source"

let Connection: DataSource = AppDataSource.manager.connection;

@Entity()
export class ApiTokenAccess {
  constructor() { };
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true, type: 'varchar', nullable: false })
  token!: string

  @Column({ nullable: false, default: false })
  isActive!: boolean
}
export async function getApiTokenAccessRepository(): Promise<Repository<ApiTokenAccess>> {
  return Connection.getRepository(ApiTokenAccess);
}
