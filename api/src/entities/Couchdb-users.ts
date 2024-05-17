import { Entity, PrimaryColumn, Column, Repository, DataSource } from "typeorm";
import { AppDataSource } from "../data_source";

let Connection: DataSource = AppDataSource.manager.connection;


@Entity()
export class CouchdbUsers {
  constructor() { };
  @PrimaryColumn({ type: 'varchar' })
  id!: string
  
  @Column({ type: 'varchar', nullable: true })
  rev!:string;
  
  @Column({ type: 'varchar', nullable: true })
  username!:string;
  
  @Column({ type: 'varchar', nullable: true })
  fullname!:string;
  
  @Column({ type: 'varchar', nullable: true })
  code!:string;

  @Column({ type: 'varchar', nullable: true })
  type!:string;

  @Column({ type: 'varchar', nullable: true })
  contact!:string;

  @Column({ type: 'varchar', nullable: true })
  role!:string;

  @Column({ type: 'varchar', nullable: true })
  place!:string;

}
export async function getCouchdbUsersRepository(): Promise<Repository<CouchdbUsers>> {
  return Connection.getRepository(CouchdbUsers);
}