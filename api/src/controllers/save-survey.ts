import { Request, Response, NextFunction } from 'express';
import { getSurveyResponsesRepository, SurveyResponses } from '../entities/Survey-Responses';

export class SurveyController {

    static saveResponse = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { userId, survey } = req.body;
            if (userId && survey) {
                const surveyRepo = await getSurveyResponsesRepository();

                for (const key in survey) {
                    if (survey.hasOwnProperty(key)) {
                        // console.log(`Key: ${key}, Value: ${survey[key]}`);
                        const response = new SurveyResponses();
                        response.question_id = key;
                        response.answer = survey[key];
                        await surveyRepo.save(response);
                    }
                }

                const averages = await surveyRepo
                    .createQueryBuilder('survey')
                    .select('survey.question_id')
                    .addSelect('AVG(survey.answer)', 'average')
                    .groupBy('survey.question_id')
                    .getRawMany();
                return res.status(200).json({ status: 200, data: averages });
            }
            return res.status(201).json({ status: 201, data: 'no user ID provided' });
        } catch (err) {
            return res.status(500).json({ status: 500, data: `${err}` });
        }
    }

    static calculateAveragePerQuestion = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
        try {
            const { userId } = req.body;
            if (userId) {
                const surveyRepo = await getSurveyResponsesRepository();
                const averages = await surveyRepo
                    .createQueryBuilder('survey')
                    .select('survey.question_id')
                    .addSelect('AVG(survey.answer)', 'average')
                    .groupBy('survey.question_id')
                    .getRawMany();
                return res.status(200).json({ status: 200, data: averages });
            }
            return res.status(201).json({ status: 201, data: 'no user ID provided' });
        } catch (err) {
            return res.status(500).json({ status: 500, data: `${err}` });
        }
    }
}