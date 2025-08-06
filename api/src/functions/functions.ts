var JFile = require('jfile');
import fs from 'fs';
import { CouchDbFetchData } from '../models/Interfaces';
import https from "https";
import http from "http";
import axios from 'axios';
import { APP_ENV } from '../providers/constantes';
import { Express } from 'express';
import os from 'os';


const { NODE_ENV, CHT_USER, CHT_PASS, CHT_PROD_HOST, CHT_DEV_HOST, CHT_PROTOCOL, CHT_PORT } = APP_ENV;

const USER_CHT_HOST = NODE_ENV === 'production' ? CHT_PROD_HOST : CHT_DEV_HOST;

export async function AxioFetchCouchDbData(viewName: string, { username, password, startKey, endKey }: { username?: string, password?: string, startKey?: string, endKey?: string }): Promise<any> {
    const dbName = 'medic';
    const couchDbUrl = `${USER_CHT_HOST}:${CHT_PORT}`;
    username = username ?? CHT_USER ?? '';
    password = password ?? CHT_PASS ?? '';
    const couchArg = ['include_docs=true', 'returnDocs=true', 'attachments=false', 'binary=false', 'reduce=false', 'descending=false'];
    if (startKey) couchArg.push('key=[' + startKey + ']');
    if (endKey) couchArg.push('endkey=[' + endKey + ']');
    const finalUrl = `${CHT_PROTOCOL}://${couchDbUrl}/${dbName}/_design/medic-client/_view/${viewName}?${couchArg.join('&')}`;
    return await axios.get(finalUrl, {
        auth: {
            username,
            password
        }
    })
}

async function getPublicIP(): Promise<any> {
    try {
        const res = await axios.get('https://api.ipify.org?format=json');
        // console.log("🌐 Public IP:", res.data.ip);
        return res.data.ip;
    } catch (err) {
        // console.error("❌ Failed to fetch public IP:", err);
        return;
    }

    // https.get('https://api.ipify.org?format=json', (resp) => {
    //     let data = '';
    //     resp.on('data', (chunk) => (data += chunk));
    //     resp.on('end', () => {
    //         console.log('🌍 IP publique du serveur :', JSON.parse(data).ip);
    //     });
    // });

}

function getPrivateIP(): string[] {
    const interfaces = os.networkInterfaces();
    const results: string[] = [];

    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name] || []) {
            if (iface.family === 'IPv4' && !iface.internal) {
                results.push(iface.address);
            }
        }
    }
    // console.log("📡 IP(s) privée(s) :", results);
    return results;
}

function CouchDbFetchDataOptions(params: CouchDbFetchData,) {
    var dbCibleUrl = `/medic/_design/medic-client/_view/${params.viewName}`;
    if (dbCibleUrl[0] != '/') dbCibleUrl = `/${dbCibleUrl}`;
    if (dbCibleUrl[dbCibleUrl.length - 1] == '/') dbCibleUrl.slice(0, -1);

    var couchArg = ['include_docs=true', 'returnDocs=true', 'attachments=false', 'binary=false', 'reduce=false'];
    couchArg.push(`descending=${params.descending == true}`);
    if (notEmpty(params.startKey)) couchArg.push(`key=[${params.startKey}]`);
    if (notEmpty(params.endKey)) couchArg.push(`endkey=[${params.endKey}]`);
    const port = parseInt((CHT_PORT) ?? '443');
    var options = {
        host: USER_CHT_HOST ?? '',
        port: port,
        path: `${dbCibleUrl}?${couchArg.join('&')}`,
        url: `${USER_CHT_HOST}:${port}${dbCibleUrl}?${couchArg.join('&')}`,
        use_SSL_verification: true,
        user: CHT_USER ?? '',
        pass: CHT_PASS ?? '',
    };
    return getHttpsOptions(options);
}

export function isvalidCta<T>(data: T | any): boolean {
    try {
        const ok1 = data?.cta_nn !== undefined && data?.cta_nn !== null && parseInt(`${data?.cta_nn}`) > 0;
        const ok2 = data?.cta_pe !== undefined && data?.cta_pe !== null && parseInt(`${data?.cta_pe}`) > 0;
        const ok3 = data?.cta_ge !== undefined && data?.cta_ge !== null && parseInt(`${data?.cta_ge}`) > 0;
        const ok4 = data?.cta_ad !== undefined && data?.cta_ad !== null && parseInt(`${data?.cta_ad}`) > 0;
        return (ok1 || ok2 || ok3 || ok4) === true;
    } catch (error) {
        return false;
    }
}

export function sumAllCta<T>(data: T | any): number {
    try {
        const ok1 = data?.cta_nn !== undefined && data?.cta_nn !== null && parseInt(`${data?.cta_nn}`) > 0;
        const ok2 = data?.cta_pe !== undefined && data?.cta_pe !== null && parseInt(`${data?.cta_pe}`) > 0;
        const ok3 = data?.cta_ge !== undefined && data?.cta_ge !== null && parseInt(`${data?.cta_ge}`) > 0;
        const ok4 = data?.cta_ad !== undefined && data?.cta_ad !== null && parseInt(`${data?.cta_ad}`) > 0;
        return (
            (ok1 ? parseInt(`${data?.cta_nn}`) : 0) +
            (ok2 ? parseInt(`${data?.cta_pe}`) : 0) +
            (ok3 ? parseInt(`${data?.cta_ge}`) : 0) +
            (ok4 ? parseInt(`${data?.cta_ad}`) : 0)
        );
    } catch (error) {
        return 0;
    }
}

export function getPreviousMonthYear(month: string, year: number) {
    const m = parseInt(month);
    const previousMonth = m === 1 ? 12 : m - 1;
    const previousYear = m === 1 ? (year - 1) : year;

    return {
        month: previousMonth.toString().padStart(2, '0'),
        year: previousYear.toString()
    };
}

export function getHttpsOptions(data: any): Object {
    var options: Object = {
        host: data.host,
        port: data.port,
        path: data.path,
        url: data.url,
        rejectUnauthorized: data.use_SSL_verification === true,
        requestCert: data.use_SSL_verification === true,
        strictSSL: data.use_SSL_verification === true,
        agent: false,
        headers: httpHeaders('Basic ' + Buffer.from(data.user + ':' + data.pass).toString('base64')),
        ca: []
        // ca: data.use_SSL_verification === true ? rootCas.addFile(`${sslFolder('server.pem')}`) : []
    }
    return options;
}

export function logNginx(message: any) {
    console.log(message);
    try {
        let nxFile = new JFile('/var/log/nginx/access.log');
        nxFile.text += `\n${message}`;
    } catch (error) {

    }
}

export function isTrue(data: any) {
    return notEmpty(data) && (data === true || data === `true` || data === `yes`);
}

export function dataTransform(data: any, returnType: 'string' | 'boolean' | 'null_false' | 'number' | 'double' | ''): any {
    if (notEmpty(data)) {
        if (returnType === 'string') return `${data}`;
        if (returnType === 'boolean') return isTrue(data);
        if (returnType === 'null_false') return isTrue(data) ? true : null;
        if (returnType === 'number') return parseInt(`${data}`);
        if (returnType === 'double') return parseFloat(`${data}`);
        return `${data}`;
    }
    return null;
}

export function getSexe(sex: string) {
    if (sex === 'male' || sex === 'Male' || sex === 'homme' || sex === 'Homme') return 'M';
    if (sex === 'female' || sex === 'Female' || sex === 'femme' || sex === 'Femme') return 'F';
    return null;
}

export function hasCommunElement(elem1: string[], elem2: string[]): boolean {
    if (elem1.length > 0 && elem2.length > 0) {
        for (const elm of elem1) {
            if (elem2.includes(elm)) {
                return true;
            }
        }
    }
    return false;
}
export function normalizePort(val: any) {
    var port = parseInt(val, 10);
    if (isNaN(port)) return val;
    if (port >= 0) return port;
    return false;
}


export function onError(error: any, port: any) {
    if (error.syscall !== 'listen') throw error;
    var bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;
    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}

export function onListening(server: https.Server | http.Server, hostnames: any[], protocole: string = 'http') {
    var addr = server.address();
    var bind = typeof addr === 'string' ? addr : addr!.port;
    for (let i = 0; i < hostnames.length; i++) {
        logNginx(`\n🚀 ${protocole.toLocaleUpperCase()} Server is available at ${protocole}://${hostnames[i]}:${bind}`);
    }
    logNginx('\n');
}

export function onProcess() {
    process.on('unhandledRejection', (error, promise) => {
        logNginx(`Alert! ERROR : ${error}`);
    });
    process.on('uncaughtException', err => {
        logNginx(`${err && err.stack}`)
    });
    process.on('ERR_HTTP_HEADERS_SENT', err => {
        logNginx(`${err && err.stack}`)
    });
}

export function ServerStart(data: {
    isSecure: boolean;
    credential?: {
        key: string;
        ca: string;
        cert: string;
    };
    server: Express;
    access_all_host: boolean;
    port: number;
    hostnames: string[];
    useLocalhost: boolean;
}) {
    // const handler = async (req: http.IncomingMessage, res: http.ServerResponse) => {
    //     if (req.method === 'POST' && req.headers['content-type'] === 'application/json') {
    //         let body = '';
    //         req.on('data', chunk => {
    //             body += chunk;
    //         });
    //         req.on('end', () => {
    //             try {
    //                 const bodyData = JSON.parse(body);
    //                 const userId = bodyData.userId;
    //                 console.log('Received userID:', userId);
    //                 res.writeHead(200, { 'Content-Type': 'application/json' });
    //                 res.end(JSON.stringify({ status: 'ok', received: userId }));
    //             } catch (e) {
    //                 res.writeHead(400);
    //                 res.end('Invalid JSON');
    //             }
    //         });
    //     } else {
    //         res.writeHead(404);
    //         res.end('Not found');
    //     }
    // };

    const server = data.isSecure
        ? https.createServer(data.credential ?? {}, data.server)
        : http.createServer(data.server);
    // var io = require('socket.io')(server, {});
    if (data.access_all_host) {
        server.listen(data.port, '0.0.0.0', () => onProcess);
    } else if (data.useLocalhost) {
        server.listen(data.port, '127.0.0.1', () => onProcess);
    } else {
        server.listen(data.port, data.hostnames[0], () => onProcess);
    }
    server.on('error', (err) => onError(err, data.port));
    server.on('listening', () => onListening(server, data.useLocalhost ? ['localhost'] : data.hostnames, data.isSecure == true ? 'https' : 'http'));
    server.on('connection', (stream) => {
        // console.log('someone connected!')
    });
    return server;
}

export function getIPAddress(accessAllAvailablePort: boolean = true): string[] {
    var ips: any[] = [];
    //   return require("ip").address();
    var interfaces = require('os').networkInterfaces();
    for (var devName in interfaces) {
        var iface = interfaces[devName];
        for (var i = 0; i < iface.length; i++) {
            var alias = iface[i];
            if (alias.family === 'IPv4') ips.push(alias.address);
            if (!accessAllAvailablePort && alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) return [alias.address];
            // if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) return alias.address;
        }
    }
    return ips.length > 0 ? ips : ['0.0.0.0'];
}

export function appVersion(): { service_worker_version: number | null, app_version: string | null } {
    var service_worker_version = null;
    var app_version = null;
    try {
        service_worker_version = require('../../../views/ngsw.json')?.timestamp;
        app_version = require('../../package.json')?.version;
    } catch (error) { }

    return {
        service_worker_version: service_worker_version,
        app_version: app_version
    };
}

export function versionAsInt(version: string): number {
    const v = version.split('.');
    var res = '';
    for (let i = 0; i < v.length; i++) {
        const e = v[i];
        res += e
    }
    return parseInt(res);
}

export function notEmpty(data: any): boolean {
    return data != '' && data != ' ' && data != null && data != undefined && data.length != 0 && JSON.stringify(data) != JSON.stringify({}) && `${data}` != `{}`;
}

export function createDirectories(path: string, cb: (err: NodeJS.ErrnoException | null) => void) {
    try {
        if (!fs.existsSync(path)) {
            fs.mkdirSync(path, { recursive: true });
            cb(null);
        } else {
            cb(null);
        }
    } catch (error: any) {
        cb(error)
    }
}

export function httpHeaders(Username?: string, Password?: string, WithParams: boolean = true) {
    // NODE_TLS_REJECT_UNAUTHORIZED = '0';
    var p: any = {
        'Authorization': 'Basic ' + Buffer.from(notEmpty(Username) && notEmpty(Password) ? `${Username}:${Password}` : `${CHT_USER}:${CHT_PASS}`).toString('base64'),
        "Accept": "application/json",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Methods": "DELETE, POST, GET, PUT, OPTIONS",
        "Access-Control-Allow-Headers": "X-API-KEY, Origin, X-Requested-With, Content-Type, Accept,Access-Control-Request-Method, Authorization,Access-Control-Allow-Headers",
    }
    if (WithParams) {
        p["Content-Type"] = "application/json";
        // 'Accept-Charset': 'UTF-8',
        // "Access-Control-Allow-Origin": "*",
        // "Access-Control-Max-Age": "86400",
        // 'ca': [fs.readFileSync(path.dirname(__dirname)+'/ssl/analytics/server.pem', {encoding: 'utf-8'})]
        // 'Accept-Encoding': '*',
    }
    return p;
}


export function getColors(numberOfColors: number) {
    const backgroundColor = [];
    const colors = [];
    for (let i = 0; i < (numberOfColors * 2); i++) {
        const color = '#' + Math.floor(Math.random() * 16777215).toString(16);
        if (backgroundColor.length !== numberOfColors) {
            backgroundColor.push(color);
        } else {
            colors.push(color);
        }
    }
    return { backgroundColors: backgroundColor, colors: colors };
}


export function getFirstAndLastDayOfMonth(year: number, month: string, withHours: boolean = false): { start_date: string, end_date: string } {
    const monthNumber = parseInt(month, 10);
    const startDate = (new Date(year, monthNumber - 1, 1)).toISOString().split('T')[0];
    const endDate = (new Date(year, monthNumber, 0)).toISOString().split('T')[0];
    return {
        start_date: withHours ? startDate : startDate.split(' ')[0],
        end_date: withHours ? endDate : endDate.split(' ')[0]
    };
}
