import { NextFunction, Request, Response } from "express";
import { validationResult } from 'express-validator';
import axios from 'axios';
import { dirname } from 'path';
import { config } from 'dotenv';

const apiFolder = dirname(dirname(__dirname));
const projectFolder = dirname(apiFolder);
const projectParentFolder = dirname(projectFolder);
config({ path: `${projectParentFolder}/ssl/analytics/.env` });

const { NODE_ENV, DHIS2_USER, DHIS2_PASS, DHIS2_PROD_HOST, DHIS2_DEV_HOST, DHIS2_PROTOCOL } = process.env;

// Define the structure of the data value
interface DataValue {
    dataElement: string;
    period: string;
    orgUnit: string;
    categoryOptionCombo: string;
    value: number;
}


export async function SEND_PROMOTONAL_ACTIVITIES_TO_DHIS2(req: Request, resp: Response, next: NextFunction) {
    // The data to be sent to DHIS2

    const { userId, dataToSend } = req.body;
    const dhis2Host = NODE_ENV === 'production' ? DHIS2_PROD_HOST : DHIS2_DEV_HOST

    try {
        await axios.post(`${DHIS2_PROTOCOL}://${dhis2Host}/api/dataValueSets`, dataToSend, {
            auth: {
                username: DHIS2_USER ?? '',
                password: DHIS2_PASS ?? ''
            },
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(async (response: any) => {
            // console.log('Data sent successfully:', response.data);
            return resp.status(200).json({ status: 200, data: 'Successfull' });
        })
        .catch((err: any) => {
            console.log(err);
            return resp.status(201).json({ status: 201, data: 'Error' });
        }).finally(() => {
            console.log('Finish!');
        })
    } catch (error) {
        // console.error('Error sending data:', error);
        return resp.status(201).json({ status: 201, data: 'Error' });
    }
}
