// src/middleware/logger.ts
import { Request, Response, NextFunction } from 'express';
import { getUsersLogRepository } from '../entities/UserLog';
import { getUsersRepository } from '../entities/User';
import { APP_ENV } from '../providers/constantes';
import useragent from 'useragent'; // Optional: For parsing user-agent string
import { URL } from 'url'

const { ACTIVE_SECURE_MODE, SERVER_HOST } = APP_ENV;

// 🔐 Liste d'IP autorisées (à personnaliser selon ton infra)
const TRUSTED_IPS = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];

if (SERVER_HOST) {
  TRUSTED_IPS.push(SERVER_HOST);
}

const EXCLUDED_ORIGIN = [
  '/icons',
  '/assets',
  '/ngsw.json',
  '/auths/login',
  '/api/auth-user/login',
  '/runtime',
  '/polyfills',
  '/main',
  '/scripts',
  '/styles',
  '/manifest',
  // '/src_app_modules_auths_auths_module_ts',
  '/favicon.ico',
  '/ngsw-worker.js',
  '/index.html',
  '/publics',
  '/fa-solid-900'
];



export const userLoggerMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const isSecure = ACTIVE_SECURE_MODE === 'true';
  const method = req.method.toUpperCase();
  const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE'];
  const clientIp: string = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString();
  // Get user agent (browser info)
  const userAgent = req.headers['user-agent'] || '';
  // Additional info (can add more if needed)
  const referer = req.headers['referer'] || 'unknown'; // For the referring page
  const acceptLanguage = req.headers['accept-language'] || 'unknown'; // User language

  // Construct full URL
  const protocol = req.secure ? 'https' : 'http';
  const fullUrl = new URL(req.originalUrl, `${protocol}://${req.headers.host}`).href;



  const proceed = () => {
    if (!allowedMethods.includes(method)) return res.status(405).json({ message: 'Method Not Allowed' });
    if (!userAgent || userAgent.length < 3) return res.status(400).json({ message: 'Invalid User-Agent' });
    if (isSecure && !req.secure) return res.redirect(`https://${req.headers.host}${req.url}`);
    return next();
  };

  const isExcludedUrl = (): boolean => {
    return EXCLUDED_ORIGIN.some(path => req.originalUrl.includes(path));
  }

  try {
    // // 🔒 Vérifie si l'IP est autorisée
    // if (!TRUSTED_IPS.includes(clientIp)) {
    //   if (!isExcludedUrl()) {
    //     console.warn(`⛔ Unauthorized IP: ${clientIp}`);
    //   }
    //   return res.status(403).json({ message: 'Forbidden: Unauthorized IP' });
    // }

    // 🔒 Vérifie le Content-Type sur les POST
    if (method === 'POST' && req.headers['content-type'] !== 'application/json') {
      if (!isExcludedUrl()) {
        console.warn(`⛔ Invalid Content-Type: ${req.headers['content-type']}`);
      }
      return res.status(415).json({ message: 'Unsupported Media Type' });
    }

    // 🔒 Récupère userId de manière sécurisée
    const rawUserId = req.body?.userId || req.headers['x-user-id'];
    const userId = typeof rawUserId === 'string' && /^[a-zA-Z0-9\-]{10,}$/.test(rawUserId) ? rawUserId : null;

    const logData = req.body?.noLogData != true;

    if (!userId) {
      if (!isExcludedUrl() && logData) {
        console.warn(`⚠️ Invalid or missing userId | Method: ${method} | URL: ${req.originalUrl}`);
      }
      return proceed();
    }

    const userRepo = await getUsersRepository();
    const user = await userRepo.findOne({ where: { id: userId } });

    if (!user) {
      if (!isExcludedUrl() && logData) {
        console.warn(`⚠️ Unknown user with ID: ${userId} | Method: ${method} | URL: ${req.originalUrl}`);
      }
      return proceed();
    }

    if (!isExcludedUrl() && logData) {
      // Parsing User-Agent information
      const agent = useragent.parse(req.headers['user-agent']);
      const deviceInfo = {
        browser: agent.toString(),
        os: agent.os.toString(),
        // platform: agent.platform,
        device: agent.device.toString(),
      };


      const logRepo = await getUsersLogRepository();
      const log = logRepo.create({
        userId: user,
        method: method,
        url: fullUrl,
        userAgent: userAgent,
        clientIp: clientIp,
        referer: referer,
        acceptLanguage: acceptLanguage,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        // platform: deviceInfo.platform,
        device: deviceInfo.device,
      });

      await logRepo.save(log);

      // Log output for debugging (can be removed in production)
      console.log(`
      📥 Logged user action:
      → ID: ${userId}
      → Name: ${user.fullname ?? user.username}
      → Method: ${method}
      → URL: ${fullUrl}
      → IP: ${clientIp}
      → User-Agent: ${userAgent}
      → Referer: ${referer}
      → Accept-Language: ${acceptLanguage}
      → Device: ${deviceInfo.device}
      → Browser: ${deviceInfo.browser}
      → OS: ${deviceInfo.os}
    `);

      return proceed();
    } else {

      return proceed();
    }
  } catch (error) {
    console.error('❌ Logger Middleware Error:', {
      message: (error as any)?.message,
      stack: (error as any)?.stack,
      method,
      url: req.originalUrl,
      ip: clientIp
    });
    return proceed();
  }
};
