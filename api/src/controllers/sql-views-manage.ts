import { MIGRATIONS_FOLDER } from '../providers/constantes';
import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import { AppDataSource } from '../data-source';
import path from 'path';
import glob from 'glob';
import fs from 'fs';


function transformString(input: string) {
  const match = input.match(/(.*?)(\d+)$/);
  if (match) {
    const [_, textPart, numberPart] = match;
    return `${numberPart}-${textPart}`;
  }
  return input; // return as-is if pattern not matched
}
function generatePathInfos(filePath: string): { name: string; path: string; time: number; } {
  const base = path.basename(filePath, path.extname(filePath)); // ex: 1701012345678-CreateUsers
  const match = base.match(/^(\d+)-(.+)$/);

  let formattedName: string;
  let formattedTime: number;

  if (match) {
    const [, timestamp, namePart] = match;
    formattedName = `${namePart}${timestamp}`;
    formattedTime = parseInt(timestamp);
  } else {
    formattedName = base; // fallback if no match
    formattedTime = 0;
  }

  // console.log(`→ ${formattedTime} ||| ${formattedName}`)

  return {
    name: formattedName,
    path: filePath,
    time: formattedTime
  };
}
async function hasMigrationRun(migrationName: string) {
  if (!AppDataSource.isInitialized) await AppDataSource.initialize();
  const result = await AppDataSource.query(`SELECT * FROM typeorm_migrations WHERE name = $1`, [migrationName]);
  return result.length > 0;
}
async function removeMigrationFromDB(migrationName: string | 'all') {
  try {
    const migrationTable = AppDataSource.options.migrationsTableName || 'migrations';
    if (migrationName == 'all') {
      console.log(`🚨 Suppression des enregistrements dans la table "${migrationTable}"...`);
      await AppDataSource.query(`DELETE FROM "${migrationTable}"`);
      console.log(`🧹 All Migrations removed from database successfully.`);
      // return true;
    } else if ((migrationName ?? '') != '') {
      console.log(`🚨 Suppression de ${migrationName} dans la table "${migrationTable}"...`);
      await AppDataSource.query(`DELETE FROM ${migrationTable} WHERE name = $1`, [migrationName]);
      console.log(`🧹 Migration ${migrationName} removed from database successfully.`);
      // return true;
    } else {
      console.error(`❌ Pas de condition suffisante pour supprimer une migration!`);
      // return false;
    }
  } catch (error) {
    console.error(`❌ Erreur lors de la suppressions de migration!`);
    // return false;
  }
}
async function migrationsPathList(migrationName?: string): Promise<{ name: string; path: string; time: number; }[] | undefined> {

  const mName = (migrationName ?? '') != '' ? transformString(`${migrationName}`) : '*';

  const mf1 = glob.sync(`${MIGRATIONS_FOLDER}/${mName}{.ts,.js}`);
  const mf2 = glob.sync(`${MIGRATIONS_FOLDER}/**/${mName}{.ts,.js}`);
  const mf3 = glob.sync(`${MIGRATIONS_FOLDER}/**/**/${mName}{.ts,.js}`);
  const mf4 = glob.sync(`${MIGRATIONS_FOLDER}/**/**/**/${mName}{.ts,.js}`);
  const mf5 = glob.sync(`${MIGRATIONS_FOLDER}/**/**/**/**/${mName}{.ts,.js}`);
  const mf6 = glob.sync(`${MIGRATIONS_FOLDER}/**/**/**/**/**/${mName}{.ts,.js}`);

  const migrationFiles: string[] = Array.from(new Set([...mf1, ...mf2, ...mf3, ...mf4, ...mf5, ...mf6]));

  console.log('📋 Migrations triées par date (ordre croissant):');
  const sortedFiles = migrationFiles.sort((a, b) => fs.statSync(a).mtime.getTime() - fs.statSync(b).mtime.getTime());

  if (sortedFiles && sortedFiles.length > 0) {
    return sortedFiles.map(filePath => generatePathInfos(filePath));
  }

  return undefined;
}


export async function getAllMigrationsPathList(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(201).json({ status: 201, data: 'Informations you provided are not valid' });
  try {
    const { userId } = req.body;
    if (!userId) return res.status(201).json({ status: 201, data: 'Aucun utilisateur selectionné' });

    const pathList = await migrationsPathList();

    if (pathList) {
      return res.status(200).json({ status: 200, data: pathList });
    }
    return res.status(201).json({ status: 201, data: `❌ Migration non trouvée.` });
  } catch (err) {
    // return next(err);
    return res.status(500).json({ status: 500, data: err });
  }
}
export async function runAllMigrationsAvailable(req: Request, res: Response, next: NextFunction) {
  const { userId, runAllMigrations } = req.body;
  if (!userId) return res.status(201).json({ status: 201, data: 'Aucun utilisateur selectionné' });

  if (runAllMigrations !== true) return res.status(201).json({ status: 201, data: `❌ Vous n'avez pas le droit d'excécuter cette action.` });

  try {
    // Initialisation de la connexion
    if (!AppDataSource.isInitialized) await AppDataSource.initialize();

    console.log('⚙️ Running all migrations...');
    const queryRunner = AppDataSource.createQueryRunner();

    await removeMigrationFromDB('all');

    console.log(`📦 Exécution forcée de toutes les migrations...`);
    const migrations = await AppDataSource.runMigrations({ transaction: 'all' });

    const result: { name: string; path: string; time: number; }[] = [];

    for (const m of migrations) {
      const mName = await migrationsPathList(m.name)
      if (mName && mName.length == 1) {
        result.push(mName[0]);
      }
      // return {
      //   id: m.id,
      //   mane: m.name,
      //   timestamp: m.timestamp
      // }
    }

    console.log('✅ Toutes les migrations ont été réexécutées avec succès.');
    await queryRunner.release();


    if (result && result.length > 0) {
      return res.status(200).json({ status: 200, data: result });
    }
    return res.status(201).json({ status: 201, data: `❌ Erreur pendant les migrations.` });

    // await AppDataSource.destroy();
  } catch (err) {
    return res.status(500).json({ status: 500, data: `❌ Erreur pendant les migrations: ${err}` });
  }
}
export async function getOneMigrationsPath(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(201).json({ status: 201, data: 'Informations you provided are not valid' });
  const { userId, migrationName } = req.body;
  if (!userId) return res.status(201).json({ status: 201, data: 'Aucun utilisateur selectionné' });
  try {

    const pathList = await migrationsPathList(migrationName);

    if (pathList && pathList.length == 1) {
      return res.status(200).json({ status: 200, data: pathList[0] });
    }
    return res.status(201).json({ status: 201, data: `❌ Migration ${migrationName} non trouvée.` });

  } catch (err) {
    // return next(err);
    return res.status(500).json({ status: 500, data: err });
  }
}
export async function runOneMigrationAvailable(req: Request, res: Response, next: NextFunction) {
  const { userId, migrationName, runOneMigrations } = req.body;
  if (!userId) return res.status(201).json({ status: 201, data: 'Aucun utilisateur selectionné' });
  if (runOneMigrations !== true) return res.status(201).json({ status: 201, data: `❌ Vous n'avez pas le droit d'excécuter cette action.` });

  try {
    if (!migrationName) {
      return res.status(201).json({ status: 201, data: `❌ Migration ${migrationName} non trouvée.` });
    }

    if (!AppDataSource.isInitialized) await AppDataSource.initialize();

    const pathInfos = await migrationsPathList(migrationName)

    if (!pathInfos || pathInfos.length != 1) {
      return res.status(201).json({ status: 201, data: `❌ Migration ${migrationName} non trouvée.` });
    }

    // Check if migration is already executed
    const exist = await hasMigrationRun(migrationName);
    if (exist) {
      console.log(`⚠️ Migration ${migrationName} has already been executed.`);
      await removeMigrationFromDB(migrationName);
    } else {
      console.log(`✔️ Migration ${migrationName} has not been run yet.`);
    }

    console.log("📦 Importing module...");
    const mod = await import(path.resolve(pathInfos[0].path));
    console.log("🔍 Keys of imported module:", Object.keys(mod));

    console.log("🎯 Instantiating migration class...");
    const MigrationClass = mod[migrationName] || mod.default || Object.values(mod)[0];

    if (typeof MigrationClass !== 'function') {
      console.error("Clés disponibles dans le module :", Object.keys(mod));
      throw new Error(`❌ La migration "${migrationName}" n'exporte pas de classe par défaut ou instanciable.`);
    }

    console.log("🔁 Instantiating migration class...");
    const migration = new MigrationClass();

    console.log("⚙️ Creating query runner...");
    const queryRunner = AppDataSource.createQueryRunner();

    console.log("🚀 Running migration...");
    await migration.up(queryRunner);

    console.log("🧹 Releasing query runner...");
    await queryRunner.release();

    console.log(`✅ Migration ${migrationName} has been executed successfully.`);
    return res.status(200).json({ status: 200, data: pathInfos[0] });

  } catch (err) {
    return res.status(500).json({ status: 500, data: `❌ Error d'execution de la migration ${migrationName}: ${err}` });
  }
}

