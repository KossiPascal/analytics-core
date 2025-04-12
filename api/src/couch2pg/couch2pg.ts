import axios from "axios";
// import * as fs from "fs";
// import * as path from "path";
import { getCouchDBRepository, getCouchDBLastSeqRepository, getCouchDbLogRepository } from "../entities/Couchdb";
import { In } from "typeorm";
import { APP_ENV } from "../providers/constantes";
import { RefreshMaterializedView } from "./refresh-view";

type CouchDBChange = {
    id: string;
    doc?: any;
    deleted?: boolean;
};

type CouchDBResponse = {
    last_seq: string;
    results: CouchDBChange[];
};

const { NODE_ENV, CHT_USER, CHT_PASS, CHT_PROD_HOST, CHT_DEV_HOST, CHT_PROTOCOL, CHT_PORT } = APP_ENV;
// const USERS_URL  = `${CHT_PROTOCOL}://${NODE_ENV === 'production' ? CHT_PROD_HOST : CHT_DEV_HOST}:${CHT_PORT}/api/v1/users`;

const COUCHDB_URL  = `${CHT_PROTOCOL}://${CHT_USER}:${CHT_PASS}@${NODE_ENV === 'production' ? CHT_PROD_HOST : CHT_DEV_HOST}:${CHT_PORT}/medic`;

const LOW_MEMORY_LIMIT = 500;    // Limite pour les serveurs avec peu de RAM
const DEFAULT_LIMIT = 1000;      // Limite recommandée pour des performances équilibrées
const HIGH_PERFORMANCE_LIMIT = 10000; // Limite pour des serveurs puissants

const EXCLUDED_PATTERNS: RegExp[] = [
    /^task~org\.couchdb\.user/,
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


async function logMessage(message: string): Promise<void> {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;
    // const LOG_FILE = path.join(__dirname, "couch2pg_replicate.log");
    // fs.appendFileSync(LOG_FILE, logEntry);
    const _repo = await getCouchDbLogRepository();
    _repo.save({log:logEntry});

    // console.log(logEntry.trim());
}

async function getLastSequence(): Promise<string> {
    try {
        const _repo = await getCouchDBLastSeqRepository();
        const found = await _repo.findOneBy({ id: 1 });
        return found?.seq?.trim() || "0";
    } catch (error) {
        logMessage(`⚠️ Erreur lors de la lecture de la séquence: ${(error as Error).message}`);
    }
    return "0";
}

async function updateLastSequence(seq: string): Promise<void> {
    if (!seq || seq == '') return;
    try {
        const _repo = await getCouchDBLastSeqRepository();
        await _repo.save({ id: 1, seq: seq });
        logMessage(`Updated last sequence to ${seq}`);
    } catch (error) {
        logMessage(`⚠️ Error updating last sequence: ${(error as Error).message}`);
    }
}

async function fetchCouchDBChanges(lastSeq: string, limit?:number): Promise<CouchDBResponse | undefined | 'error_found'> {
    try {
        limit = limit ?? DEFAULT_LIMIT;

        const response = await axios.get<CouchDBResponse>(`${COUCHDB_URL}/_changes`, {
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
        return 'error_found'
        logMessage(`⚠️ Erreur de mise à jour de la séquence: ${(error as Error).message}`);
    }
}

async function saveToPostgres(docs: { id: string; doc: any }[]): Promise<void> {
    if (docs.length === 0) return;
    logMessage("🔄 Start saving data to PostgreSQL...");
    try {
        const _repo = await getCouchDBRepository();
        logMessage(`✅ Saving ${docs.length} documents to PostgreSQL...`);
        await _repo.save(docs.map(d => ({ id: d.id, doc: d.doc })));
    } catch (error) {
        logMessage(`❌ Error saving to PostgreSQL: ${(error as Error).message}`);
    }
}

async function deleteFromPostgres(docIds: string[]): Promise<void> {
    if (docIds.length === 0) return;
    try {
        const _repo = await getCouchDBRepository();
        logMessage(`🗑️ Deleting ${docIds.length} documents from PostgreSQL...`);
        await _repo.delete({ id: In(docIds) });
    } catch (error) {
        logMessage(`Error deleting from PostgreSQL: ${(error as Error).message}`);
    }
}

async function processCouchDBChanges(): Promise<void> {
    logMessage("🔄 Démarrage de la synchronisation CouchDB -> PostgreSQL...");

    const _12hours = 60 * 60 * 1000 * 12; // 12 heures
    // const _12hours = 60 * 1000; // 12 heures
    const oneMinute = 60 * 1000;

    let lastSeq = await getLastSequence();
    let retryDelay = oneMinute; // 1 minute en cas d'erreur
    let keepFetching = true;

    let okLength = 0;

    while (keepFetching) {
        try {
            const changes = await fetchCouchDBChanges(lastSeq);

            if (changes == 'error_found') {
                logMessage("❌ Error found, will retry after 1 min");
                setTimeout(async() => await processCouchDBChanges(), oneMinute);
                return;
            }

            if (!changes || changes.results.length === 0) {
                logMessage("📌 Aucun nouveau changement détecté dans CouchDB.");

                if (okLength == 0) {
                    setTimeout(async() => await processCouchDBChanges(), _12hours);
                    return; 
                }

                // setTimeout(async() => await RefreshMaterializedView(), oneMinute);
                okLength = 0;
                await RefreshMaterializedView();
                logMessage("✅ Sync completed successfully.");

                setTimeout(async() => await processCouchDBChanges(), _12hours);
                return; 
            }

            okLength++;

            const validDocs: any[] = [];
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

            await saveToPostgres(validDocs);
            await deleteFromPostgres(docsToDelete);
            await updateLastSequence(changes.last_seq);

            lastSeq = changes.last_seq;
            retryDelay = oneMinute; // Réinitialiser le délai après succès
        } catch (error: any) {
            logMessage(`❌ Erreur lors de la synchronisation: ${error.message}`);
            logMessage(`🔄 Nouvelle tentative dans ${retryDelay / 1000} secondes...`);

            await new Promise((resolve) => setTimeout(resolve, retryDelay));
            retryDelay = Math.min(retryDelay * 2, _12hours); // Augmentation progressive jusqu'à 12h
        }
    }
}

export async function syncCouchDBToPostgres(): Promise<void> {
    logMessage("Starting CouchDB to PostgreSQL sync...");
    try {
        await processCouchDBChanges();
    } catch (error) {
        logMessage(`Unhandled error: ${(error as Error).message}`);
    }
}

