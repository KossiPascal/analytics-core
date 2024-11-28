import { Repository } from "typeorm";
import { milisecond_to_date } from "../../utils/date-utils";
import { FsMegData, getFsMegDataRepository } from "../../entities/_Meg-FS-data";
import { dataTransform } from "../../utils/functions";


export async function SyncFsMegData(report: any, _repoFsMeg: Repository<FsMegData> | null = null): Promise<boolean> {
    try {
        _repoFsMeg = _repoFsMeg ?? await getFsMegDataRepository();

        const reported_date = milisecond_to_date(report.reported_date, 'dateOnly');
        const month = (new Date(reported_date)).getMonth() + 1;
        const fields = report.fields;

        const _fsMeg = new FsMegData();

        _fsMeg.id = report._id;
        _fsMeg.rev = report._rev;
        _fsMeg.form = report.form;
        _fsMeg.year = (new Date(reported_date)).getFullYear();
        _fsMeg.month = month < 10 ? `0${month}` : `${month}`;

        _fsMeg.action_date = dataTransform(fields.action_date, 'string')
        _fsMeg.month_date_selected = dataTransform(fields.month_date_selected, 'string')
        _fsMeg.month_day = dataTransform(fields.month_day, 'number');
        _fsMeg.all_med_shortage_days_number = dataTransform(fields.all_med_shortage_days_number, 'number');
        _fsMeg.all_med_number = dataTransform(fields.all_med_number, 'number');
        _fsMeg.meg_average_out_of = dataTransform(fields.meg_average_out_of, 'double');
        _fsMeg.meg_average_available = dataTransform(fields.meg_average_available, 'double');

        _fsMeg.country = fields.country_id;
        _fsMeg.region = fields.region_id;
        _fsMeg.prefecture = fields.prefecture_id;
        _fsMeg.commune = fields.commune_id;
        _fsMeg.hospital = fields.hospital_id;
        _fsMeg.hospital_manager = fields.user_id;
        _fsMeg.reported_date_timestamp = report.reported_date;
        _fsMeg.reported_date = reported_date;
        _fsMeg.reported_full_date = milisecond_to_date(report.reported_date, 'fulldate');
        _fsMeg.geolocation = report.geolocation;

        await _repoFsMeg.save(_fsMeg);
        return true;
    } catch (err: any) {
        return false;
    }
}