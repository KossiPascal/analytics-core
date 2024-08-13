import { NextFunction, Request, Response } from "express";
import axios from 'axios';
import { getPromotionReportRepository } from "../entities/Reports";
import { APP_ENV } from "../utils/constantes";

const { NODE_ENV, DHIS2_USER, DHIS2_PASS, DHIS2_PROD_HOST, DHIS2_DEV_HOST, DHIS2_PROTOCOL } = APP_ENV;

// Define the structure of the data value
interface DataValue {
    dataElement: string;
    period: string;
    orgUnit: string;
    categoryOptionCombo: string;
    value: number;
}


export async function SEND_PROMOTONAL_ACTIVITIES_TO_DHIS2(req: Request, res: Response, next: NextFunction) {
    // The data to be sent to DHIS2

    const { userId, dataValues, months, year, recos } = req.body;
    const dhis2Host = NODE_ENV === 'production' ? DHIS2_PROD_HOST : DHIS2_DEV_HOST;

    try {
        await axios.post(`${DHIS2_PROTOCOL}://${dhis2Host}/api/dataValueSets`, dataValues, {
            auth: {
                username: DHIS2_USER ?? '',
                password: DHIS2_PASS ?? ''
            },
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(async (response: any) => {

            // ######################### UPDATE IS_ON DHIS2_DATA ###############################

            if (userId && months && year && recos) {
                const vmonths: string[] = Array.isArray(months) ? months : [months];
                const vrecos: string[] = Array.isArray(recos) ? recos : [recos];
                const _repo = await getPromotionReportRepository();
                var errorsCount = 0;
                for (const month of vmonths) {
                    const updatePromises = vrecos.map(async reco => {
                        const dataId = `${month}-${year}-${reco}`;
                        try {
                            await _repo.update({ id: dataId }, { already_on_dhis2: true, already_on_dhis2_user_id: userId });
                        } catch (err) {
                            errorsCount += 1;
                            console.error(`Failed to update record with id: ${dataId}`, err);
                            throw err; // Ensure the error is thrown to be caught by outer transaction handler if needed
                        }
                    });
                    await Promise.all(updatePromises); // Wait for all updates in the current month
                }
                if (errorsCount > 0) {
                    return res.status(201).json({ status: 201, data: 'error found' });
                }
            }

            // ########################################################

            // console.log('Data sent successfully:', response.data);
            return res.status(200).json({ status: 200, data: 'Successfull' });
        })
        .catch((err: any) => {
            console.log(err);
            return res.status(201).json({ status: 201, data: 'Error' });
        }).finally(() => {
            console.log('Finish!');
        })
    } catch (error) {
        // console.error('Error sending data:', error);
        return res.status(201).json({ status: 201, data: 'Error' });
    }
}
