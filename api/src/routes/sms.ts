import { Router } from 'express';
import { Middelware } from "../middleware/auth";
import { sendCustomSms, sendSms } from '../controllers/sms-sender';

const SmsRouter = Router();

SmsRouter.post('/send-sms', Middelware.authMiddleware, sendSms);
SmsRouter.post('/send-coustom-sms', Middelware.authMiddleware, sendCustomSms);


export = SmsRouter;
