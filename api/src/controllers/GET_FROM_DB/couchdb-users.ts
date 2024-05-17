import { NextFunction, Request, Response } from "express";
import { validationResult } from 'express-validator';
import { getCouchdbUsersRepository } from "../../entities/Couchdb-users";

export async function GET_COUCHPG_DB_USERS_FROM_DB(req: Request, res: Response, next: NextFunction) {
    try {
        const _repo = await getCouchdbUsersRepository();
        const users = await _repo.find();
        if (users.length <= 0) return res.status(201).json({ status: 201, data: "Pas d'utilisateur couchDb trouvé" });
        return res.status(200).json({ status: 200, data: users });
    } catch (err: any) {
        return res.status(500).json({ status: 500, data: err.toString() });
    }
}