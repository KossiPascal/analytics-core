
import { MigrationInterface, QueryRunner } from "typeorm";
import { CreateViewIndex, DropViewIndexAndTable } from "../couch2pg/refresh-view";
import * as fs from 'fs';
import * as path from 'path';
import { IndexTarget } from "../models/Interfaces";


export abstract class SqlBaseViewMigration implements MigrationInterface {
  protected abstract viewsNames: string[];
  protected abstract cible: IndexTarget;
  protected schema?: string | null;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.dropViews(queryRunner);
    for (const name of this.viewsNames) {
      await queryRunner.query(getSqlFileContent(name, this.schema));
      await CreateViewIndex(name, { cible: this.cible, queryRunner });
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await this.dropViews(queryRunner);
  }

  private async dropViews(queryRunner: QueryRunner): Promise<void> {
    for (const name of this.viewsNames) {
      await DropViewIndexAndTable(name, { cible: this.cible, queryRunner });
    }
  }
}

export const getSqlFileContent = (fileNameWithoutExtension: string, folderPath: string | null = null): string => {
  if (!fileNameWithoutExtension || typeof fileNameWithoutExtension !== 'string') {
    throw new Error('Le nom du fichier SQL est invalide ou manquant.');
  }

  // Nettoyage des chemins (supprime les slashes avant/après)
  const cleanFileName = fileNameWithoutExtension.replace(/^[/\\]+|[/\\]+$/g, '');
  const cleanFolder = folderPath?.replace(/^[/\\]+|[/\\]+$/g, '');

  const baseSqlFolder = __dirname; //path.resolve(__dirname, '../sql');
  const resolvedFolder = cleanFolder ? path.resolve(baseSqlFolder, cleanFolder) : baseSqlFolder;
  const filePath = path.join(resolvedFolder, `${cleanFileName}.sql`);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Le fichier SQL "${filePath}" est introuvable.`);
  }

  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error: any) {
    throw new Error(`Erreur lors de la lecture du fichier SQL "${filePath}": ${error.message}`);
  }
};