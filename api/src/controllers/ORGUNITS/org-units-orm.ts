import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { notEmpty } from "../../functions/functions";
import { milisecond_to_date } from '../../functions/date-utils';
import { COUNTRIES_CUSTOM_QUERY, REGIONS_CUSTOM_QUERY, PREFECTURES_CUSTOM_QUERY, COMMUNES_CUSTOM_QUERY, HOSPITALS_CUSTOM_QUERY, DISTRICTS_QUARTIERS_CUSTOM_QUERY, CHWS_CUSTOM_QUERY, VILLAGES_SECTEURS_CUSTOM_QUERY, RECOS_CUSTOM_QUERY, FAMILIES_CUSTOM_QUERY, PATIENTS_CUSTOM_QUERY } from './org-units-custom';



export class OrgUnitsController {
    private static getDate(date: any): { year: number, month: string } {
        const reported_date = milisecond_to_date(date, 'dateOnly');
        const month = (new Date(reported_date)).getMonth() + 1;
        return { year: (new Date(reported_date)).getFullYear(), month: month < 10 ? `0${month}` : `${month}` }
    }

    static GET_COUNTRIES = async (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(201).json({ status: 201, data: 'Informations you provided are not valid' });
        try {
            const { userId } = req.body;
            // const _repo = await getCountryRepository();
            // const data: Country[] = await _repo.find({
            //     where: {
            //         id: notEmpty(req.body.id ?? req.body.countries) ? Array.isArray(req.body.id ?? req.body.countries) ? In(req.body.id ?? req.body.countries) : req.body.id ?? req.body.countries : undefined,
            //         // name: notEmpty(req.body.names) ? Array.isArray(req.body.names) ? In(req.body.names) : req.body.names : undefined,
            //         // code: notEmpty(req.body.codes) ? Array.isArray(req.body.codes) ? In(req.body.codes) : req.body.codes : undefined,
            //         external_id: notEmpty(req.body.external_ids) ? Array.isArray(req.body.external_ids) ? In(req.body.external_ids) : req.body.external_ids : undefined,
            //         year: notEmpty(req.body.years) ? Array.isArray(req.body.years) ? In(req.body.years) : req.body.years : undefined,
            //         month: notEmpty(req.body.months) ? Array.isArray(req.body.months) ? In(req.body.months) : req.body.months : undefined,
            //     }
            // });

            var data = await COUNTRIES_CUSTOM_QUERY();

            if (notEmpty(req.body.id ?? req.body.countries)) {
                const countries = Array.isArray(req.body.id ?? req.body.countries) ? (req.body.id ?? req.body.countries) : [req.body.id ?? req.body.countries];
                data = data.filter(r => countries.includes(r.id));
            }
            if (!data) return res.status(201).json({ status: 201, data: 'No Data Found !' });
            return res.status(200).json({ status: 200, data: data });
        } catch (err: any) {
            return res.status(201).json({ status: 201, data: err });
        }
    };

    static GET_REGIONS = async (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(201).json({ status: 201, data: 'Informations you provided are not valid' });
        try {
            const { userId } = req.body;
            // const _repo = await getRegionRepository();
            // const data: Region[] = await _repo.find({
            //     where: {
            //         id: notEmpty(req.body.id ?? req.body.regions) ? Array.isArray(req.body.id ?? req.body.regions) ? In(req.body.id ?? req.body.regions) : req.body.id ?? req.body.regions : undefined,
            //         // name: notEmpty(req.body.names) ? Array.isArray(req.body.names) ? In(req.body.names) : req.body.names : undefined,
            //         // code: notEmpty(req.body.codes) ? Array.isArray(req.body.codes) ? In(req.body.codes) : req.body.codes : undefined,
            //         external_id: notEmpty(req.body.external_ids) ? Array.isArray(req.body.external_ids) ? In(req.body.external_ids) : req.body.external_ids : undefined,
            //         country: notEmpty(req.body.countries) ? Array.isArray(req.body.countries) ? In(req.body.countries) : req.body.countries : undefined,
            //         year: notEmpty(req.body.years) ? Array.isArray(req.body.years) ? In(req.body.years) : req.body.years : undefined,
            //         month: notEmpty(req.body.months) ? Array.isArray(req.body.months) ? In(req.body.months) : req.body.months : undefined,
            //     }
            // });
            var data = await REGIONS_CUSTOM_QUERY();
            if (notEmpty(req.body.id ?? req.body.regions)) {
                const regions = Array.isArray(req.body.id ?? req.body.regions) ? (req.body.id ?? req.body.regions) : [req.body.id ?? req.body.regions];
                data = data.filter(r => regions.includes(r.id));
            }
            if (notEmpty(req.body.countries)) {
                const countries = Array.isArray(req.body.countries) ? req.body.countries : [req.body.countries];
                data = data.filter(r => countries.includes(r.country.id));
            }
            if (!data) return res.status(201).json({ status: 201, data: 'No Data Found !' });
            return res.status(200).json({ status: 200, data: data });
        } catch (err: any) {
            return res.status(500).json({ status: 500, data: `${err?.message || 'Erreur Interne Du Serveur'}` });
        }
    };

    static GET_PREFECTURES = async (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(201).json({ status: 201, data: 'Informations you provided are not valid' });
        try {
            const { userId } = req.body;
            // const _repo = await getPrefectureRepository();
            // const data: Prefecture[] = await _repo.find({
            //     where: {
            //         id: notEmpty(req.body.id ?? req.body.prefectures) ? Array.isArray(req.body.id ?? req.body.prefectures) ? In(req.body.id ?? req.body.prefectures) : req.body.id ?? req.body.prefectures : undefined,
            //         // name: notEmpty(req.body.names) ? Array.isArray(req.body.names) ? In(req.body.names) : req.body.names : undefined,
            //         // code: notEmpty(req.body.codes) ? Array.isArray(req.body.codes) ? In(req.body.codes) : req.body.codes : undefined,
            //         external_id: notEmpty(req.body.external_ids) ? Array.isArray(req.body.external_ids) ? In(req.body.external_ids) : req.body.external_ids : undefined,
            //         country: notEmpty(req.body.countries) ? Array.isArray(req.body.countries) ? In(req.body.countries) : req.body.countries : undefined,
            //         region: notEmpty(req.body.regions) ? Array.isArray(req.body.regions) ? In(req.body.regions) : req.body.regions : undefined,
            //         year: notEmpty(req.body.years) ? Array.isArray(req.body.years) ? In(req.body.years) : req.body.years : undefined,
            //         month: notEmpty(req.body.months) ? Array.isArray(req.body.months) ? In(req.body.months) : req.body.months : undefined,
            //     }
            // });

            var data = await PREFECTURES_CUSTOM_QUERY();
            if (notEmpty(req.body.id ?? req.body.prefectures)) {
                const prefectures = Array.isArray(req.body.id ?? req.body.prefectures) ? (req.body.id ?? req.body.prefectures) : [req.body.id ?? req.body.prefectures];
                data = data.filter(r => prefectures.includes(r.id));
            }
            if (notEmpty(req.body.countries)) {
                const countries = Array.isArray(req.body.countries) ? req.body.countries : [req.body.countries];
                data = data.filter(r => countries.includes(r.country.id));
            }
            if (notEmpty(req.body.regions)) {
                const regions = Array.isArray(req.body.regions) ? req.body.regions : [req.body.regions];
                data = data.filter(r => regions.includes(r.region.id));
            }

            if (!data) return res.status(201).json({ status: 201, data: 'No Data Found !' });
            return res.status(200).json({ status: 200, data: data });
        } catch (err: any) {
            return res.status(500).json({ status: 500, data: `${err?.message || 'Erreur Interne Du Serveur'}` });
        }
    };

    static GET_COMMUNES = async (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(201).json({ status: 201, data: 'Informations you provided are not valid' });
        try {
            const { userId } = req.body;
            // const _repo = await getCommuneRepository();
            // const data: Commune[] = await _repo.find({
            //     where: {
            //         id: notEmpty(req.body.id ?? req.body.communes) ? Array.isArray(req.body.id ?? req.body.communes) ? In(req.body.id ?? req.body.communes) : req.body.id ?? req.body.communes : undefined,
            //         // name: notEmpty(req.body.names) ? Array.isArray(req.body.names) ? In(req.body.names) : req.body.names : undefined,
            //         // code: notEmpty(req.body.codes) ? Array.isArray(req.body.codes) ? In(req.body.codes) : req.body.codes : undefined,
            //         external_id: notEmpty(req.body.external_ids) ? Array.isArray(req.body.external_ids) ? In(req.body.external_ids) : req.body.external_ids : undefined,
            //         country: notEmpty(req.body.countries) ? Array.isArray(req.body.countries) ? In(req.body.countries) : req.body.countries : undefined,
            //         region: notEmpty(req.body.regions) ? Array.isArray(req.body.regions) ? In(req.body.regions) : req.body.regions : undefined,
            //         prefecture: notEmpty(req.body.prefectures) ? Array.isArray(req.body.prefectures) ? In(req.body.prefectures) : req.body.prefectures : undefined,
            //         year: notEmpty(req.body.years) ? Array.isArray(req.body.years) ? In(req.body.years) : req.body.years : undefined,
            //         month: notEmpty(req.body.months) ? Array.isArray(req.body.months) ? In(req.body.months) : req.body.months : undefined,
            //     }
            // });


            var data= await COMMUNES_CUSTOM_QUERY();
            if (notEmpty(req.body.id ?? req.body.communes)) {
                const communes = Array.isArray(req.body.id ?? req.body.communes) ? (req.body.id ?? req.body.communes) : [req.body.id ?? req.body.communes];
                data = data.filter(r => communes.includes(r.id));
            }
            if (notEmpty(req.body.countries)) {
                const countries = Array.isArray(req.body.countries) ? req.body.countries : [req.body.countries];
                data = data.filter(r => countries.includes(r.country.id));
            }
            if (notEmpty(req.body.regions)) {
                const regions = Array.isArray(req.body.regions) ? req.body.regions : [req.body.regions];
                data = data.filter(r => regions.includes(r.region.id));
            }
            if (notEmpty(req.body.prefectures)) {
                const prefectures = Array.isArray(req.body.prefectures) ? req.body.prefectures : [req.body.prefectures];
                data = data.filter(r => prefectures.includes(r.prefecture.id));
            }

            if (!data) return res.status(201).json({ status: 201, data: 'No Data Found !' });
            return res.status(200).json({ status: 200, data: data });
        } catch (err: any) {
            return res.status(500).json({ status: 500, data: `${err?.message || 'Erreur Interne Du Serveur'}` });
        }
    };

    static GET_HOSPITALS = async (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(201).json({ status: 201, data: 'Informations you provided are not valid' });
        try {
            const { userId } = req.body;
            // const _repo = await getHospitalRepository();
            // const data: Hospital[] = await _repo.find({
            //     where: {
            //         id: notEmpty(req.body.id ?? req.body.hospitals) ? Array.isArray(req.body.id ?? req.body.hospitals) ? In(req.body.id ?? req.body.hospitals) : req.body.id ?? req.body.hospitals : undefined,
            //         // name: notEmpty(req.body.names) ? Array.isArray(req.body.names) ? In(req.body.names) : req.body.names : undefined,
            //         // code: notEmpty(req.body.codes) ? Array.isArray(req.body.codes) ? In(req.body.codes) : req.body.codes : undefined,
            //         external_id: notEmpty(req.body.external_ids) ? Array.isArray(req.body.external_ids) ? In(req.body.external_ids) : req.body.external_ids : undefined,
            //         country: notEmpty(req.body.countries) ? Array.isArray(req.body.countries) ? In(req.body.countries) : req.body.countries : undefined,
            //         region: notEmpty(req.body.regions) ? Array.isArray(req.body.regions) ? In(req.body.regions) : req.body.regions : undefined,
            //         prefecture: notEmpty(req.body.prefectures) ? Array.isArray(req.body.prefectures) ? In(req.body.prefectures) : req.body.prefectures : undefined,
            //         commune: notEmpty(req.body.communes) ? Array.isArray(req.body.communes) ? In(req.body.communes) : req.body.communes : undefined,
            //         year: notEmpty(req.body.years) ? Array.isArray(req.body.years) ? In(req.body.years) : req.body.years : undefined,
            //         month: notEmpty(req.body.months) ? Array.isArray(req.body.months) ? In(req.body.months) : req.body.months : undefined,
            //     }
            // });

            var data = await HOSPITALS_CUSTOM_QUERY();
            if (notEmpty(req.body.id ?? req.body.hospitals)) {
                const hospitals = Array.isArray(req.body.id ?? req.body.hospitals) ? (req.body.id ?? req.body.hospitals) : [req.body.id ?? req.body.hospitals];
                data = data.filter(r => hospitals.includes(r.id));
            }
            if (notEmpty(req.body.countries)) {
                const countries = Array.isArray(req.body.countries) ? req.body.countries : [req.body.countries];
                data = data.filter(r => countries.includes(r.country.id));
            }
            if (notEmpty(req.body.regions)) {
                const regions = Array.isArray(req.body.regions) ? req.body.regions : [req.body.regions];
                data = data.filter(r => regions.includes(r.region.id));
            }
            if (notEmpty(req.body.prefectures)) {
                const prefectures = Array.isArray(req.body.prefectures) ? req.body.prefectures : [req.body.prefectures];
                data = data.filter(r => prefectures.includes(r.prefecture.id));
            }
            if (notEmpty(req.body.communes)) {
                const communes = Array.isArray(req.body.communes) ? req.body.communes : [req.body.communes];
                data = data.filter(r => communes.includes(r.commune.id));
            }

            if (!data) return res.status(201).json({ status: 201, data: 'No Data Found !' });
            return res.status(200).json({ status: 200, data: data });
        } catch (err: any) {
            return res.status(500).json({ status: 500, data: `${err?.message || 'Erreur Interne Du Serveur'}` });
        }
    };

    static GET_DISTRICTS_QUARTIERS = async (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(201).json({ status: 201, data: 'Informations you provided are not valid' });
        try {
            const { userId } = req.body;
            // const _repo = await getDistrictQuartierRepository();
            // const data: DistrictQuartier[] = await _repo.find({
            //     where: {
            //         id: notEmpty(req.body.id ?? req.body.district_quartiers) ? Array.isArray(req.body.id ?? req.body.district_quartiers) ? In(req.body.id ?? req.body.district_quartiers) : req.body.id ?? req.body.district_quartiers : undefined,
            //         // name: notEmpty(req.body.names) ? Array.isArray(req.body.names) ? In(req.body.names) : req.body.names : undefined,
            //         // code: notEmpty(req.body.codes) ? Array.isArray(req.body.codes) ? In(req.body.codes) : req.body.codes : undefined,
            //         external_id: notEmpty(req.body.external_ids) ? Array.isArray(req.body.external_ids) ? In(req.body.external_ids) : req.body.external_ids : undefined,
            //         country: notEmpty(req.body.countries) ? Array.isArray(req.body.countries) ? In(req.body.countries) : req.body.countries : undefined,
            //         region: notEmpty(req.body.regions) ? Array.isArray(req.body.regions) ? In(req.body.regions) : req.body.regions : undefined,
            //         prefecture: notEmpty(req.body.prefectures) ? Array.isArray(req.body.prefectures) ? In(req.body.prefectures) : req.body.prefectures : undefined,
            //         commune: notEmpty(req.body.communes) ? Array.isArray(req.body.communes) ? In(req.body.communes) : req.body.communes : undefined,
            //         hospital: notEmpty(req.body.hospitals) ? Array.isArray(req.body.hospitals) ? In(req.body.hospitals) : req.body.hospitals : undefined,
            //         chw.id: notEmpty(req.body.chws) ? In(req.body.chws) : undefined,
            //         year: notEmpty(req.body.years) ? Array.isArray(req.body.years) ? In(req.body.years) : req.body.years : undefined,
            //         month: notEmpty(req.body.months) ? Array.isArray(req.body.months) ? In(req.body.months) : req.body.months : undefined,
            //     }
            // });

            var data = await DISTRICTS_QUARTIERS_CUSTOM_QUERY();
            if (notEmpty(req.body.id ?? req.body.district_quartiers)) {
                const district_quartiers = Array.isArray(req.body.id ?? req.body.district_quartiers) ? (req.body.id ?? req.body.district_quartiers) : [req.body.id ?? req.body.district_quartiers];
                data = data.filter(r => district_quartiers.includes(r.id));
            }
            if (notEmpty(req.body.countries)) {
                const countries = Array.isArray(req.body.countries) ? req.body.countries : [req.body.countries];
                data = data.filter(r => countries.includes(r.country.id));
            }
            if (notEmpty(req.body.regions)) {
                const regions = Array.isArray(req.body.regions) ? req.body.regions : [req.body.regions];
                data = data.filter(r => regions.includes(r.region.id));
            }
            if (notEmpty(req.body.prefectures)) {
                const prefectures = Array.isArray(req.body.prefectures) ? req.body.prefectures : [req.body.prefectures];
                data = data.filter(r => prefectures.includes(r.prefecture.id));
            }
            if (notEmpty(req.body.communes)) {
                const communes = Array.isArray(req.body.communes) ? req.body.communes : [req.body.communes];
                data = data.filter(r => communes.includes(r.commune.id));
            }
            if (notEmpty(req.body.hospitals)) {
                const hospitals = Array.isArray(req.body.hospitals) ? req.body.hospitals : [req.body.hospitals];
                data = data.filter(r => hospitals.includes(r.hospital.id));
            }

            if (!data) return res.status(201).json({ status: 201, data: 'No Data Found !' });
            return res.status(200).json({ status: 200, data: data });
        } catch (err: any) {
            return res.status(500).json({ status: 500, data: `${err?.message || 'Erreur Interne Du Serveur'}` });
        }
    };

    static GET_VILLAGES_SECTEURS = async (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(201).json({ status: 201, data: 'Informations you provided are not valid' });
        try {
            const { userId } = req.body;
            // const _repo = await getVillageSecteurRepository();
            // const data: Country[] = await _repo.find({
            //     where: {
            //         id: notEmpty(req.body.id ?? req.body.village_secteurs) ? Array.isArray(req.body.id ?? req.body.village_secteurs) ? In(req.body.id ?? req.body.village_secteurs) : req.body.id ?? req.body.village_secteurs : undefined,
            //         // name: notEmpty(req.body.names) ? Array.isArray(req.body.names) ? In(req.body.names) : req.body.names : undefined,
            //         // code: notEmpty(req.body.codes) ? Array.isArray(req.body.codes) ? In(req.body.codes) : req.body.codes : undefined,
            //         external_id: notEmpty(req.body.external_ids) ? Array.isArray(req.body.external_ids) ? In(req.body.external_ids) : req.body.external_ids : undefined,
            //         country: notEmpty(req.body.countries) ? Array.isArray(req.body.countries) ? In(req.body.countries) : req.body.countries : undefined,
            //         region: notEmpty(req.body.regions) ? Array.isArray(req.body.regions) ? In(req.body.regions) : req.body.regions : undefined,
            //         prefecture: notEmpty(req.body.prefectures) ? Array.isArray(req.body.prefectures) ? In(req.body.prefectures) : req.body.prefectures : undefined,
            //         commune: notEmpty(req.body.communes) ? Array.isArray(req.body.communes) ? In(req.body.communes) : req.body.communes : undefined,
            //         hospital: notEmpty(req.body.hospitals) ? Array.isArray(req.body.hospitals) ? In(req.body.hospitals) : req.body.hospitals : undefined,
            //         district_quartier: notEmpty(req.body.district_quartiers) ? Array.isArray(req.body.district_quartiers) ? In(req.body.district_quartiers) : req.body.district_quartiers : undefined,
            //         reco.id: notEmpty(req.body.recos) ? In(req.body.recos) : undefined,
            //         year: notEmpty(req.body.years) ? Array.isArray(req.body.years) ? In(req.body.years) : req.body.years : undefined,
            //         month: notEmpty(req.body.months) ? Array.isArray(req.body.months) ? In(req.body.months) : req.body.months : undefined,
            //     }
            // });

            var data = await VILLAGES_SECTEURS_CUSTOM_QUERY();
            if (notEmpty(req.body.id ?? req.body.village_secteurs)) {
                const village_secteurs = Array.isArray(req.body.id ?? req.body.village_secteurs) ? (req.body.id ?? req.body.village_secteurs) : [req.body.id ?? req.body.village_secteurs];
                data = data.filter(r => village_secteurs.includes(r.id));
            }
            if (notEmpty(req.body.countries)) {
                const countries = Array.isArray(req.body.countries) ? req.body.countries : [req.body.countries];
                data = data.filter(r => countries.includes(r.country.id));
            }
            if (notEmpty(req.body.regions)) {
                const regions = Array.isArray(req.body.regions) ? req.body.regions : [req.body.regions];
                data = data.filter(r => regions.includes(r.region.id));
            }
            if (notEmpty(req.body.prefectures)) {
                const prefectures = Array.isArray(req.body.prefectures) ? req.body.prefectures : [req.body.prefectures];
                data = data.filter(r => prefectures.includes(r.prefecture.id));
            }
            if (notEmpty(req.body.communes)) {
                const communes = Array.isArray(req.body.communes) ? req.body.communes : [req.body.communes];
                data = data.filter(r => communes.includes(r.commune.id));
            }
            if (notEmpty(req.body.hospitals)) {
                const hospitals = Array.isArray(req.body.hospitals) ? req.body.hospitals : [req.body.hospitals];
                data = data.filter(r => hospitals.includes(r.hospital.id));
            }
            if (notEmpty(req.body.district_quartiers)) {
                const district_quartiers = Array.isArray(req.body.district_quartiers) ? req.body.district_quartiers : [req.body.district_quartiers];
                data = data.filter(r => district_quartiers.includes(r.district_quartier.id));
            }


            if (!data) return res.status(201).json({ status: 201, data: 'No Data Found !' });
            return res.status(200).json({ status: 200, data: data });
        } catch (err: any) {
            return res.status(500).json({ status: 500, data: `${err?.message || 'Erreur Interne Du Serveur'}` });
        }
    };

    static GET_FAMILIES = async (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(201).json({ status: 201, data: 'Informations you provided are not valid' });
        try {
            const { userId } = req.body;
            // const _repo = await getFamilyRepository();
            // const data: Family[] = await _repo.find({
            //     where: {
            //         id: notEmpty(req.body.id ?? req.body.families) ? Array.isArray(req.body.id ?? req.body.families) ? In(req.body.id ?? req.body.families) : req.body.id ?? req.body.families : undefined,
            //         // name: notEmpty(req.body.names) ? Array.isArray(req.body.names) ? In(req.body.names) : req.body.names : undefined,
            //         // code: notEmpty(req.body.codes) ? Array.isArray(req.body.codes) ? In(req.body.codes) : req.body.codes : undefined,
            //         external_id: notEmpty(req.body.external_ids) ? Array.isArray(req.body.external_ids) ? In(req.body.external_ids) : req.body.external_ids : undefined,
            //         country: notEmpty(req.body.countries) ? Array.isArray(req.body.countries) ? In(req.body.countries) : req.body.countries : undefined,
            //         region: notEmpty(req.body.regions) ? Array.isArray(req.body.regions) ? In(req.body.regions) : req.body.regions : undefined,
            //         prefecture: notEmpty(req.body.prefectures) ? Array.isArray(req.body.prefectures) ? In(req.body.prefectures) : req.body.prefectures : undefined,
            //         commune: notEmpty(req.body.communes) ? Array.isArray(req.body.communes) ? In(req.body.communes) : req.body.communes : undefined,
            //         hospital: notEmpty(req.body.hospitals) ? Array.isArray(req.body.hospitals) ? In(req.body.hospitals) : req.body.hospitals : undefined,
            //         district_quartier: {
            //             id: notEmpty(req.body.district_quartiers) ? Array.isArray(req.body.district_quartiers) ? In(req.body.district_quartiers) : req.body.district_quartiers : undefined,
            //             chw.id: notEmpty(req.body.chws) ? Array.isArray(req.body.chws) ? In(req.body.chws) : req.body.chws : undefined,
            //         },
            //         village_secteur: {
            //             id: notEmpty(req.body.village_secteurs) ? Array.isArray(req.body.village_secteurs) ? In(req.body.village_secteurs) : req.body.village_secteurs : undefined,
            //             // reco.id: notEmpty(req.body.recos) ? Array.isArray(req.body.recos) ? In(req.body.recos) : req.body.recos : undefined,
            //         },
            //         reco: notEmpty(req.body.recos) ? Array.isArray(req.body.recos) ? In(req.body.recos) : req.body.recos : undefined,
            //         reported_date: notEmpty(req.body.start_date) && notEmpty(req.body.end_date) ? Between(req.body.start_date, req.body.end_date) : undefined,
            //         year: notEmpty(req.body.years) ? Array.isArray(req.body.years) ? In(req.body.years) : req.body.years : undefined,
            //         month: notEmpty(req.body.months) ? Array.isArray(req.body.months) ? In(req.body.months) : req.body.months : undefined,
            //     }
            // });


            var data = await FAMILIES_CUSTOM_QUERY();
            if (notEmpty(req.body.id ?? req.body.families)) {
                const families = Array.isArray(req.body.id ?? req.body.families) ? (req.body.id ?? req.body.families) : [req.body.id ?? req.body.families];
                data = data.filter(r => families.includes(r.id));
            }
            if (notEmpty(req.body.countries)) {
                const countries = Array.isArray(req.body.countries) ? req.body.countries : [req.body.countries];
                data = data.filter(r => countries.includes(r.country.id));
            }
            if (notEmpty(req.body.regions)) {
                const regions = Array.isArray(req.body.regions) ? req.body.regions : [req.body.regions];
                data = data.filter(r => regions.includes(r.region.id));
            }
            if (notEmpty(req.body.prefectures)) {
                const prefectures = Array.isArray(req.body.prefectures) ? req.body.prefectures : [req.body.prefectures];
                data = data.filter(r => prefectures.includes(r.prefecture.id));
            }
            if (notEmpty(req.body.communes)) {
                const communes = Array.isArray(req.body.communes) ? req.body.communes : [req.body.communes];
                data = data.filter(r => communes.includes(r.commune.id));
            }
            if (notEmpty(req.body.hospitals)) {
                const hospitals = Array.isArray(req.body.hospitals) ? req.body.hospitals : [req.body.hospitals];
                data = data.filter(r => hospitals.includes(r.hospital.id));
            }
            if (notEmpty(req.body.district_quartiers)) {
                const district_quartiers = Array.isArray(req.body.district_quartiers) ? req.body.district_quartiers : [req.body.district_quartiers];
                data = data.filter(r => district_quartiers.includes(r.district_quartier.id));
            }
            if (notEmpty(req.body.village_secteurs)) {
                const village_secteurs = Array.isArray(req.body.village_secteurs) ? req.body.village_secteurs : [req.body.village_secteurs];
                data = data.filter(r => village_secteurs.includes(r.village_secteur.id));
            }
            if (notEmpty(req.body.chws)) {
                const chws = Array.isArray(req.body.chws) ? req.body.chws : [req.body.chws];
                const chwList = await CHWS_CUSTOM_QUERY();
                const CHWS = chwList.filter(r => chws.includes(r.id));
                data = data.filter(r => CHWS.map(c=>c.district_quartier.id).includes(r.district_quartier.id));
            }
            if (notEmpty(req.body.recos)) {
                const recos = Array.isArray(req.body.recos) ? req.body.recos : [req.body.recos];
                data = data.filter(r => recos.includes(r.reco.id));
            }
            
            if (!data) return res.status(201).json({ status: 201, data: 'No Data Found !' });
            return res.status(200).json({ status: 200, data: data });
        } catch (err: any) {
            return res.status(500).json({ status: 500, data: `${err?.message || 'Erreur Interne Du Serveur'}` });
        }
    };

    static GET_CHWS = async (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(201).json({ status: 201, data: 'Informations you provided are not valid' });
        try {
            const { userId } = req.body;
            // const _repo = await getChwRepository();
            // const data: Chw[] = await _repo.find({
            //     where: {
            //         id: notEmpty(req.body.id ?? req.body.chws) ? Array.isArray(req.body.id ?? req.body.chws) ? In(req.body.id ?? req.body.chws) : req.body.id ?? req.body.chws : undefined,
            //         // name: notEmpty(req.body.names) ? Array.isArray(req.body.names) ? In(req.body.names) : req.body.names : undefined,
            //         // code: notEmpty(req.body.codes) ? Array.isArray(req.body.codes) ? In(req.body.codes) : req.body.codes : undefined,
            //         external_id: notEmpty(req.body.external_ids) ? Array.isArray(req.body.external_ids) ? In(req.body.external_ids) : req.body.external_ids : undefined,
            //         country: notEmpty(req.body.countries) ? Array.isArray(req.body.countries) ? In(req.body.countries) : req.body.countries : undefined,
            //         region: notEmpty(req.body.regions) ? Array.isArray(req.body.regions) ? In(req.body.regions) : req.body.regions : undefined,
            //         prefecture: notEmpty(req.body.prefectures) ? Array.isArray(req.body.prefectures) ? In(req.body.prefectures) : req.body.prefectures : undefined,
            //         commune: notEmpty(req.body.communes) ? Array.isArray(req.body.communes) ? In(req.body.communes) : req.body.communes : undefined,
            //         hospital: notEmpty(req.body.hospitals) ? Array.isArray(req.body.hospitals) ? In(req.body.hospitals) : req.body.hospitals : undefined,
            //         district_quartier: notEmpty(req.body.district_quartiers) ? Array.isArray(req.body.district_quartiers) ? In(req.body.district_quartiers) : req.body.district_quartiers : undefined,
            //         year: notEmpty(req.body.years) ? Array.isArray(req.body.years) ? In(req.body.years) : req.body.years : undefined,
            //         month: notEmpty(req.body.months) ? Array.isArray(req.body.months) ? In(req.body.months) : req.body.months : undefined,
            //     }
            // });
            var data = await CHWS_CUSTOM_QUERY();
            if (notEmpty(req.body.id ?? req.body.chws)) {
                const chws = Array.isArray(req.body.id ?? req.body.chws) ? (req.body.id ?? req.body.chws) : [req.body.id ?? req.body.chws];
                data = data.filter(r => chws.includes(r.id));
            }
            if (notEmpty(req.body.countries)) {
                const countries = Array.isArray(req.body.countries) ? req.body.countries : [req.body.countries];
                data = data.filter(r => countries.includes(r.country.id));
            }
            if (notEmpty(req.body.regions)) {
                const regions = Array.isArray(req.body.regions) ? req.body.regions : [req.body.regions];
                data = data.filter(r => regions.includes(r.region.id));
            }
            if (notEmpty(req.body.prefectures)) {
                const prefectures = Array.isArray(req.body.prefectures) ? req.body.prefectures : [req.body.prefectures];
                data = data.filter(r => prefectures.includes(r.prefecture.id));
            }
            if (notEmpty(req.body.communes)) {
                const communes = Array.isArray(req.body.communes) ? req.body.communes : [req.body.communes];
                data = data.filter(r => communes.includes(r.commune.id));
            }
            if (notEmpty(req.body.hospitals)) {
                const hospitals = Array.isArray(req.body.hospitals) ? req.body.hospitals : [req.body.hospitals];
                data = data.filter(r => hospitals.includes(r.hospital.id));
            }
            if (notEmpty(req.body.district_quartiers)) {
                const district_quartiers = Array.isArray(req.body.district_quartiers) ? req.body.district_quartiers : [req.body.district_quartiers];
                data = data.filter(r => district_quartiers.includes(r.district_quartier.id));
            }

            if (!data) return res.status(201).json({ status: 201, data: 'No Data Found !' });
            return res.status(200).json({ status: 200, data: data });
        } catch (err: any) {
            return res.status(500).json({ status: 500, data: `${err?.message || 'Erreur Interne Du Serveur'}` });
        }
    };

    static GET_RECOS = async (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(201).json({ status: 201, data: 'Informations you provided are not valid' });
        try {
            const { userId } = req.body;
            // const _repo = await getRecoRepository();
            // const data: Reco[] = await _repo.find({
            //     where: {
            //         id: notEmpty(req.body.id ?? req.body.recos) ? Array.isArray(req.body.id ?? req.body.recos) ? In(req.body.id ?? req.body.recos) : req.body.id ?? req.body.recos : undefined,
            //         // name: notEmpty(req.body.names) ? Array.isArray(req.body.names) ? In(req.body.names) : req.body.names : undefined,
            //         // code: notEmpty(req.body.codes) ? Array.isArray(req.body.codes) ? In(req.body.codes) : req.body.codes : undefined,
            //         external_id: notEmpty(req.body.external_ids) ? Array.isArray(req.body.external_ids) ? In(req.body.external_ids) : req.body.external_ids : undefined,
            //         country: notEmpty(req.body.countries) ? Array.isArray(req.body.countries) ? In(req.body.countries) : req.body.countries : undefined,
            //         region: notEmpty(req.body.regions) ? Array.isArray(req.body.regions) ? In(req.body.regions) : req.body.regions : undefined,
            //         prefecture: notEmpty(req.body.prefectures) ? Array.isArray(req.body.prefectures) ? In(req.body.prefectures) : req.body.prefectures : undefined,
            //         commune: notEmpty(req.body.communes) ? Array.isArray(req.body.communes) ? In(req.body.communes) : req.body.communes : undefined,
            //         hospital: notEmpty(req.body.hospitals) ? Array.isArray(req.body.hospitals) ? In(req.body.hospitals) : req.body.hospitals : undefined,
            //         district_quartier: notEmpty(req.body.district_quartiers) ? Array.isArray(req.body.district_quartiers) ? In(req.body.district_quartiers) : req.body.district_quartiers : undefined,
            //         village_secteur: notEmpty(req.body.village_secteurs) ? Array.isArray(req.body.village_secteurs) ? In(req.body.village_secteurs) : req.body.village_secteurs : undefined,
            //         chw: notEmpty(req.body.chws) ? Array.isArray(req.body.chws) ? In(req.body.chws) : req.body.chws : undefined,
            //         year: notEmpty(req.body.years) ? Array.isArray(req.body.years) ? In(req.body.years) : req.body.years : undefined,
            //         month: notEmpty(req.body.months) ? Array.isArray(req.body.months) ? In(req.body.months) : req.body.months : undefined,
            //     }
            // });
            var data = await RECOS_CUSTOM_QUERY();
            if (notEmpty(req.body.id ?? req.body.recos)) {
                const recos = Array.isArray(req.body.id ?? req.body.recos) ? (req.body.id ?? req.body.recos) : [req.body.id ?? req.body.recos];
                data = data.filter(r => recos.includes(r.id));
            }
            if (notEmpty(req.body.countries)) {
                const countries = Array.isArray(req.body.countries) ? req.body.countries : [req.body.countries];
                data = data.filter(r => countries.includes(r.country.id));
            }
            if (notEmpty(req.body.regions)) {
                const regions = Array.isArray(req.body.regions) ? req.body.regions : [req.body.regions];
                data = data.filter(r => regions.includes(r.region.id));
            }
            if (notEmpty(req.body.prefectures)) {
                const prefectures = Array.isArray(req.body.prefectures) ? req.body.prefectures : [req.body.prefectures];
                data = data.filter(r => prefectures.includes(r.prefecture.id));
            }
            if (notEmpty(req.body.communes)) {
                const communes = Array.isArray(req.body.communes) ? req.body.communes : [req.body.communes];
                data = data.filter(r => communes.includes(r.commune.id));
            }
            if (notEmpty(req.body.hospitals)) {
                const hospitals = Array.isArray(req.body.hospitals) ? req.body.hospitals : [req.body.hospitals];
                data = data.filter(r => hospitals.includes(r.hospital.id));
            }
            if (notEmpty(req.body.district_quartiers)) {
                const district_quartiers = Array.isArray(req.body.district_quartiers) ? req.body.district_quartiers : [req.body.district_quartiers];
                data = data.filter(r => district_quartiers.includes(r.district_quartier.id));
            }
            if (notEmpty(req.body.village_secteurs)) {
                const village_secteurs = Array.isArray(req.body.village_secteurs) ? req.body.village_secteurs : [req.body.village_secteurs];
                data = data.filter(r => village_secteurs.includes(r.village_secteur.id));
            }
            if (notEmpty(req.body.chws)) {
                const chws = Array.isArray(req.body.chws) ? req.body.chws : [req.body.chws];
                const chwList = await CHWS_CUSTOM_QUERY();
                const CHWS = chwList.filter(r => chws.includes(r.id));
                data = data.filter(r => CHWS.map(c=>c.district_quartier.id).includes(r.district_quartier.id));
            }
            
            if (!data) return res.status(201).json({ status: 201, data: 'No Data Found !' });
            return res.status(200).json({ status: 200, data: data });
        } catch (err: any) {
            return res.status(500).json({ status: 500, data: `${err?.message || 'Erreur Interne Du Serveur'}` });
        }
    };

    static GET_PATIENTS = async (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(201).json({ status: 201, data: 'Informations you provided are not valid' });
        try {
            const { userId } = req.body;
            // const _repo = await getPatientRepository();
            // const data: Patient[] = await _repo.find({
            //     where: {
            //         id: notEmpty(req.body.id ?? req.body.patients) ? Array.isArray(req.body.id ?? req.body.patients) ? In(req.body.id ?? req.body.patients) : req.body.id ?? req.body.patients : undefined,
            //         // name: notEmpty(req.body.names) ? Array.isArray(req.body.names) ? In(req.body.names) : req.body.names : undefined,
            //         // code: notEmpty(req.body.codes) ? Array.isArray(req.body.codes) ? In(req.body.codes) : req.body.codes : undefined,
            //         external_id: notEmpty(req.body.external_ids) ? Array.isArray(req.body.external_ids) ? In(req.body.external_ids) : req.body.external_ids : undefined,
            //         country: notEmpty(req.body.countries) ? Array.isArray(req.body.countries) ? In(req.body.countries) : req.body.countries : undefined,
            //         region: notEmpty(req.body.regions) ? Array.isArray(req.body.regions) ? In(req.body.regions) : req.body.regions : undefined,
            //         prefecture: notEmpty(req.body.prefectures) ? Array.isArray(req.body.prefectures) ? In(req.body.prefectures) : req.body.prefectures : undefined,
            //         commune: notEmpty(req.body.communes) ? Array.isArray(req.body.communes) ? In(req.body.communes) : req.body.communes : undefined,
            //         hospital: notEmpty(req.body.hospitals) ? Array.isArray(req.body.hospitals) ? In(req.body.hospitals) : req.body.hospitals : undefined,
            //         district_quartier: notEmpty(req.body.district_quartiers) ? Array.isArray(req.body.district_quartiers) ? In(req.body.district_quartiers) : req.body.district_quartiers : undefined,
            //         village_secteur: notEmpty(req.body.village_secteurs) ? Array.isArray(req.body.village_secteurs) ? In(req.body.village_secteurs) : req.body.village_secteurs : undefined,
            //         family: notEmpty(req.body.families) ? Array.isArray(req.body.families) ? In(req.body.families) : req.body.families : undefined,
            //         chw: notEmpty(req.body.chws) ? Array.isArray(req.body.chws) ? In(req.body.chws) : req.body.chws : undefined,
            //         reco: notEmpty(req.body.recos) ? Array.isArray(req.body.recos) ? In(req.body.recos) : req.body.recos : undefined,
            //         reported_date: notEmpty(req.body.start_date) && notEmpty(req.body.end_date) ? Between(req.body.start_date, req.body.end_date) : undefined,
            //         year: notEmpty(req.body.years) ? Array.isArray(req.body.years) ? In(req.body.years) : req.body.years : undefined,
            //         month: notEmpty(req.body.months) ? Array.isArray(req.body.months) ? In(req.body.months) : req.body.months : undefined,
            //     }
            // });

            var data = await PATIENTS_CUSTOM_QUERY();
            if (notEmpty(req.body.id ?? req.body.patients)) {
                const patients = Array.isArray(req.body.id ?? req.body.patients) ? (req.body.id ?? req.body.patients) : [req.body.id ?? req.body.patients];
                data = data.filter(r => patients.includes(r.id));
            }
            if (notEmpty(req.body.countries)) {
                const countries = Array.isArray(req.body.countries) ? req.body.countries : [req.body.countries];
                data = data.filter(r => countries.includes(r.country.id));
            }
            if (notEmpty(req.body.regions)) {
                const regions = Array.isArray(req.body.regions) ? req.body.regions : [req.body.regions];
                data = data.filter(r => regions.includes(r.region.id));
            }
            if (notEmpty(req.body.prefectures)) {
                const prefectures = Array.isArray(req.body.prefectures) ? req.body.prefectures : [req.body.prefectures];
                data = data.filter(r => prefectures.includes(r.prefecture.id));
            }
            if (notEmpty(req.body.communes)) {
                const communes = Array.isArray(req.body.communes) ? req.body.communes : [req.body.communes];
                data = data.filter(r => communes.includes(r.commune.id));
            }
            if (notEmpty(req.body.hospitals)) {
                const hospitals = Array.isArray(req.body.hospitals) ? req.body.hospitals : [req.body.hospitals];
                data = data.filter(r => hospitals.includes(r.hospital.id));
            }
            if (notEmpty(req.body.district_quartiers)) {
                const district_quartiers = Array.isArray(req.body.district_quartiers) ? req.body.district_quartiers : [req.body.district_quartiers];
                data = data.filter(r => district_quartiers.includes(r.district_quartier.id));
            }
            if (notEmpty(req.body.village_secteurs)) {
                const village_secteurs = Array.isArray(req.body.village_secteurs) ? req.body.village_secteurs : [req.body.village_secteurs];
                data = data.filter(r => village_secteurs.includes(r.village_secteur.id));
            }
            if (notEmpty(req.body.chws)) {
                const chws = Array.isArray(req.body.chws) ? req.body.chws : [req.body.chws];
                const chwList = await CHWS_CUSTOM_QUERY();
                const CHWS = chwList.filter(r => chws.includes(r.id));
                data = data.filter(r => CHWS.map(c=>c.district_quartier.id).includes(r.district_quartier.id));
            }
            if (notEmpty(req.body.recos)) {
                const recos = Array.isArray(req.body.recos) ? req.body.recos : [req.body.recos];
                data = data.filter(r => recos.includes(r.reco.id));
            }
            
            if (!data) return res.status(201).json({ status: 201, data: 'No Data Found !' });
            return res.status(200).json({ status: 200, data: data });
        } catch (err: any) {
            return res.status(500).json({ status: 500, data: `${err?.message || 'Erreur Interne Du Serveur'}` });
        }
    };



}