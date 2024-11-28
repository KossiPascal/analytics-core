import { Router } from 'express';
import { SurveyController } from '../controllers/save-survey';

const SurveyRouter = Router();

SurveyRouter.post('/save', SurveyController.saveResponse);
SurveyRouter.post('/get-averages', SurveyController.calculateAveragePerQuestion);

export = SurveyRouter;