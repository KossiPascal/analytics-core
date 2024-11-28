import { Entity, PrimaryGeneratedColumn, Column, Repository, DataSource } from "typeorm"
import { AppDataSource } from "../data_source"

let Connection: DataSource = AppDataSource.manager.connection;

@Entity()
export class SurveyResponses {
  constructor() { }

  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int', nullable: false })
  question_id!: string;

  @Column({ type: 'varchar', nullable: true })
  answer!: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  submission_date!: Date;
}

export async function getSurveyResponsesRepository(): Promise<Repository<SurveyResponses>> {
  return Connection.getRepository(SurveyResponses);
}
