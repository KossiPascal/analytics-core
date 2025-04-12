// src/entities/UserLog.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, DataSource, Repository } from 'typeorm';
import { AppDataSource } from "../data-source";
import { Users } from "./User";

// export enum FlightType { DOMESTIC = "domestic", INTERNATIONAL = "international" }
let Connection: DataSource = AppDataSource.manager.connection;

@Entity()
export class UsersLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Users, (user) => user.id, { eager: true, nullable: false, onDelete: "CASCADE", onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  userId!: Users;

  @Column()
  method!: string;

  @Column()
  url!: string;

  @Column({ nullable: true })
  userAgent!: string;

  @Column({ nullable: true })
  clientIp!: string;

  @Column({ nullable: true })
  referer!: string;

  @Column({ nullable: true })
  acceptLanguage!: string;

  @Column({ nullable: true })
  browser!: string;

  @Column({ nullable: true })
  os!: string;

  @Column({ nullable: true })
  platform!: string;

  @Column({ nullable: true })
  device!: string;

  @CreateDateColumn()
  timestamp!: Date;
}
export async function getUsersLogRepository(): Promise<Repository<UsersLog>> {
    return Connection.getRepository(UsersLog);
}
