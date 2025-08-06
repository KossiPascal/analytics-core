import axios from "axios";
// import * as fs from "fs";
// import * as path from "path";
import { getCouchDBRepository, getCouchDBLastSeqRepository, getCouchDbLogRepository, getCouchDBLogsRepository, getCouchDBMetasRepository, getCouchDBSentinelRepository, getCouchDBUsersRepository } from "../entities/Couchdb";
import { In, Repository } from "typeorm";
import { APP_ENV } from "../providers/constantes";
import { RefreshMaterializedView } from "./refresh-view";
import { CouchdbFetchCible } from "../models/Interfaces";

const { NODE_ENV, CHT_USER, CHT_PASS, CHT_PROD_HOST, CHT_DEV_HOST, CHT_PROTOCOL, CHT_PORT } = APP_ENV;

// const USERS_URL  = `${CHT_PROTOCOL}://${NODE_ENV === 'production' ? CHT_PROD_HOST : CHT_DEV_HOST}:${CHT_PORT}/api/v1/users`;
const COUCHDB_BASE_URI = `${CHT_PROTOCOL}://${CHT_USER}:${CHT_PASS}@${NODE_ENV === 'production' ? CHT_PROD_HOST : CHT_DEV_HOST}:${CHT_PORT}`;

const LOW_MEMORY_LIMIT = 500;
const DEFAULT_LIMIT = 2000;
const HIGH_PERFORMANCE_LIMIT = 10000;

const EXCLUDED_PATTERNS: RegExp[] = [
    // /^task~org\.couchdb\.user/,
    /^target~.*~org\.couchdb\.user/,
    /^target~[^~]+~org\.couchdb\.user/,
    /^settings/,
    /^service-worker-meta/,
    /^resources/,
    /^privacy-policies/,
    /^partners/,
    // /^org\.couchdb\.user/,
    /^migration-log/,
    /^form:/,
    /^_design/,
    /^extension-libs/,
    /^messages-/ // Matches any string starting with "messages-"
];

type CouchDBChange = { id: string; doc?: any; deleted?: boolean; };
type CouchDBResponse = { last_seq: string; results: CouchDBChange[]; };
const cibleArray: CouchdbFetchCible[] = ['medic', 'users', 'logs', 'sentinel', 'users_meta']
const cibleMap: Record<CouchdbFetchCible, { index: number, name: string }> = {
    'medic': { index: 1, name: 'medic' },
    'users': { index: 2, name: '_users' },
    'logs': { index: 3, name: 'medic-logs' },
    'sentinel': { index: 4, name: 'medic-sentinel' },
    'users_meta': { index: 5, name: 'medic-users-meta' }
};


async function logMessage(message: string): Promise<void> {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;
    // const LOG_FILE = path.join(__dirname, "couch2pg_replicate.log");
    // fs.appendFileSync(LOG_FILE, logEntry);
    const _repo = await getCouchDbLogRepository();
    _repo.save({ log: logEntry });

    // console.log(logEntry.trim());
}

async function getLastSequence(cible: CouchdbFetchCible): Promise<string> {
    try {
        const _repo = await getCouchDBLastSeqRepository();
        const id = cibleMap[cible]?.index ?? cibleMap['medic'].index;
        const found = await _repo.findOneBy({ id });
        return found?.seq?.trim() || "0";
    } catch (error) {
        await logMessage(`${cible}: ⚠️ Failed to retrieve sequence: ${(error as Error).message}`);
        return "0";
    }
}

async function updateLastSequence(cible: CouchdbFetchCible, seq: string): Promise<void> {
    if (!seq || seq == '') return;
    try {
        const id = cibleMap[cible]?.index ?? cibleMap['medic'].index;
        const _repo = await getCouchDBLastSeqRepository();
        await _repo.save({ id, seq: seq });
        await logMessage(`${cible}: ✅ Sequence updated: ${seq}`);
    } catch (error) {
        await logMessage(`${cible}: ⚠️ Failed to update sequence: ${(error as Error).message}`);
    }
}

// --- Repository Fetcher ---
async function getRepository(cible: CouchdbFetchCible): Promise<Repository<any>> {
    switch (cible) {
        case 'users':
            return await getCouchDBUsersRepository();
        case 'logs':
            return await getCouchDBLogsRepository();
        case 'sentinel':
            return await getCouchDBSentinelRepository();
        case 'users_meta':
            return await getCouchDBMetasRepository();
        default:
            return await getCouchDBRepository();
    }
}

// --- PostgreSQL Operations ---
async function saveToPostgres(cible: CouchdbFetchCible, docs: { id: string; doc: any }[]): Promise<void> {
    if (!docs.length) return;

    try {
        const repo = await getRepository(cible);
        await logMessage(`${cible}: 💾 Saving ${docs.length} documents to PostgreSQL...`);
        await repo.save(docs.map(d => ({ id: d.id, doc: d.doc })));
    } catch (error) {
        await logMessage(`${cible}: ❌ Error saving documents: ${(error as Error).message}`);
    }
}

async function deleteFromPostgres(cible: CouchdbFetchCible, docIds: string[]): Promise<void> {
    if (!docIds.length) return;

    try {
        const repo = await getRepository(cible);
        await logMessage(`${cible}: 🗑️ Deleting ${docIds.length} documents from PostgreSQL...`);
        await repo.delete({ id: In(docIds) });
    } catch (error) {
        await logMessage(`${cible}: ❌ Error deleting documents: ${(error as Error).message}`);
    }
}


async function fetchCouchDBChanges(cible: CouchdbFetchCible, lastSeq: string, limit: number = DEFAULT_LIMIT): Promise<CouchDBResponse | undefined | 'error_found'> {
    try {
        const dbName = cibleMap[cible].name;
        const response = await axios.get<CouchDBResponse>(`${COUCHDB_BASE_URI}/${dbName}/_changes`, {
            params: {
                since: lastSeq,
                include_docs: true,
                limit,
                // feed: "longpoll", //"normal", "longpoll", "continuous", "eventsource"
                // timeout: 60000,
                // heartbeat: 30000,
            },
        });
        return response.data;
    } catch (error) {
        await logMessage(`⚠️ Failed to fetch CouchDB changes: ${(error as Error).message}`);
        return 'error_found';
    }
}

async function processCouchDBChanges(cible: CouchdbFetchCible): Promise<void> {
    await logMessage(`${cible}: 🔄 Starting synchronization...`);

    const twelveHours = 12 * 60 * 60 * 1000;
    const oneMinute = 60 * 1000;

    let lastSeq = await getLastSequence(cible);
    let retryDelay = oneMinute;
    let successCount = 0;

    while (true) {
        try {
            const changes = await fetchCouchDBChanges(cible, lastSeq);

            if (changes == 'error_found') {
                await logMessage(`${cible}: ❌ Error occurred. Retrying in 1 minute...`);
                setTimeout(() => processCouchDBChanges(cible), oneMinute);
                return;
            }

            if (!changes || changes.results.length === 0) {
                await logMessage(`${cible}: 📌 No new changes detected.`);
                if (successCount === 0) {
                    setTimeout(() => processCouchDBChanges(cible), twelveHours);
                    return;
                }

                successCount = 0;
                await RefreshMaterializedView(cible);
                await logMessage(`${cible}: ✅ Synchronization complete.`);
                setTimeout(() => processCouchDBChanges(cible), twelveHours);
                return;
            }

            const validDocs: { id: string; doc: any }[] = [];
            const docsToDelete: string[] = [];

            for (const change of changes.results) {
                const { id, doc, deleted } = change;

                const isExcluded = EXCLUDED_PATTERNS.some(pattern => pattern.test(id));
                const isTombstone = doc?.type === "tombstone" || !!doc?.tombstone;
                const isDeletedDoc = deleted || doc?._deleted || isExcluded || isTombstone;

                if (isDeletedDoc) {
                    docsToDelete.push(id);
                } else if (doc) {
                    validDocs.push({ id, doc });
                }
            }

            await saveToPostgres(cible, validDocs);
            await deleteFromPostgres(cible, docsToDelete);
            await updateLastSequence(cible, changes.last_seq);

            lastSeq = changes.last_seq;
            retryDelay = oneMinute;
            successCount++;
        } catch (error: any) {
            await logMessage(`${cible}: ❌ Synchronization error: ${error.message}`);
            await logMessage(`${cible}: 🔁 Retrying in ${retryDelay / 1000}s...`);

            await new Promise(resolve => setTimeout(resolve, retryDelay));
            retryDelay = Math.min(retryDelay * 2, twelveHours);
        }
    }
}

export async function syncCouchDBToPostgres(): Promise<void> {
    await logMessage("🚀 Initiating CouchDB to PostgreSQL synchronization...");
    try {
        for (const cible of cibleArray) {
            await processCouchDBChanges(cible);
        }
    } catch (error) {
        logMessage(`Unhandled error: ${(error as Error).message}`);
    }
}

