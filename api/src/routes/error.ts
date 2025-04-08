import { NextFunction, Request, Response } from "express";
import { join } from "path";
import { SRC_FOLDER } from "../providers/constantes";



export class Errors {
  static get404 =(req: Request, res: Response) => {
    // return res.status(404).send('Not found.')
    return res.status(404).sendFile(join(SRC_FOLDER, 'public', '404.html'));
  };

  static getErrors = (error: any, req: Request, res: Response, next: NextFunction) => {
    if (error.noStaticFiles) {
      return res.status(404).sendFile(join(SRC_FOLDER, 'public', '404.html'));
    } else {
      return res.status(error.statusCode || 500).json({
        error: {
          message: error.message,
          data: error.data,
        },
      });
    }
  }
}



