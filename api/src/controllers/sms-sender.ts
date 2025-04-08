import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import twilio from "twilio";
import { APP_ENV } from "../providers/constantes";
import { MessageInstance } from "twilio/lib/rest/api/v2010/account/message";

const { TWILIO_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } = APP_ENV;

const client = twilio(TWILIO_SID, TWILIO_AUTH_TOKEN);

export async function sendSms(req: Request, res: Response, next: NextFunction) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(201).json({ status: 201, data: 'Informations you provided are not valid' });
    try {

        const { phoneNumbers, message } = req.body;

        if (!Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
            return res.status(201).json({ status: 201, data: 'Recipient list is empty' });
        }

        if (!message || message.trim().length === 0) {
            return res.status(201).json({ status: 201, data: 'Message is empty' });
        }

        const responses = await Promise.all(
            phoneNumbers.map(to =>
                client.messages.create({
                    body: message,
                    to,
                    from: TWILIO_PHONE_NUMBER
                })
            )
        );

        return res.status(200).json({ status: 200, data: responses.map(r => r.sid) });
    } catch (err) {
        // return next(err);
        return res.status(500).json({ status: 500, data: err });
    }
};


export async function sendCustomSms(req: Request, res: Response, next: NextFunction) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(201).json({ status: 201, data: 'Informations you provided are not valid' });
    try {

        const phoneMessage: { phone: string, message: string }[] = req.body.phoneNumbersMessage;

        if (!Array.isArray(phoneMessage) || phoneMessage.length === 0) {
            return res.status(400).json({ status: 201, error: 'Recipient list is empty' });
        }

        const responses: MessageInstance[] = [];
        const errors:{ phone: string, message: string }[] = []

        for (const pm of phoneMessage) {
            if (pm.phone && pm.phone.trim().length > 0 && pm.message && pm.message.trim().length > 0) {
                const response = await client.messages.create({
                    body: pm.message,
                    to: pm.phone,
                    from: TWILIO_PHONE_NUMBER
                });

                responses.push(response)
            } else {
                errors.push(pm);
            }
        }

        return res.status(200).json({ status: 200, data: responses.map(r => r.sid), errors: errors });
    } catch (err) {
        // return next(err);
        return res.status(500).json({ status: 500, data: err });
    }
};


// const Nexmo = require('nexmo');
// const nexmo = new Nexmo({
//   apiKey: 'YOUR_API_KEY',
//   apiSecret: 'YOUR_API_SECRET'
// });
// nexmo.message.sendSms('YOUR_VONAGE_NUMBER', 'RECIPIENT_NUMBER', 'Hello from Vonage!', (err, responseData) => {
//   if (err) {
//     console.log(err);
//   } else {
//     console.log(responseData);
//   }
// });



// const plivo = require('plivo');
// const client = new plivo.Client('YOUR_AUTH_ID', 'YOUR_AUTH_TOKEN');
// client.messages.create(
//   'YOUR_PLIVO_NUMBER',
//   'RECIPIENT_NUMBER',
//   'Hello from Plivo!'
// ).then(message_created => {
//   console.log(message_created);
// });




// const africastalking = require('africastalking');
// const username = 'YOUR_USERNAME';
// const apiKey = 'YOUR_API_KEY';
// const sms = africastalking.SMS;
// sms.send({
//   to: 'RECIPIENT_NUMBER',
//   message: 'Hello from Africa\'s Talking!',
//   from: 'YOUR_SHORTCODE'
// }).then(console.log).catch(console.error);




// const textlocal = require('textlocal');
// const api = new textlocal('YOUR_API_KEY');
// api.sendMessage({
//   numbers: 'RECIPIENT_NUMBER',
//   message: 'Hello from Textlocal!',
//   sender: 'TXTLCL'
// }).then(console.log).catch(console.error);





// const SibApiV3Sdk = require('sib-api-v3-sdk');
// const defaultClient = SibApiV3Sdk.ApiClient.instance;
// const apiKey = defaultClient.authentications['api-key'];
// apiKey.apiKey = 'YOUR_API_KEY';
// const api = new SibApiV3Sdk.TransactionalSMSApi();
// const sendTransacSms = new SibApiV3Sdk.SendTransacSms();
// sendTransacSms.sender = 'SENDER_NAME';
// sendTransacSms.recipient = 'RECIPIENT_NUMBER';
// sendTransacSms.content = 'Hello from Sendinblue!';
// api.sendTransacSms(sendTransacSms).then(console.log).catch(console.error);






// const TelesignSDK = require('telesign-sdk');
// const client = new TelesignSDK('YOUR_CUSTOMER_ID', 'YOUR_API_KEY');
// client.sms.message(
//   'RECIPIENT_NUMBER',
//   'Hello from Telesign!',
//   'ARN'
// ).then(response => {
//   console.log(response);
// }).catch(console.error);
