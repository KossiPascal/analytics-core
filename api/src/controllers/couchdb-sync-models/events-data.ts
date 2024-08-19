import { Repository } from "typeorm";
import { milisecond_to_date } from "../../utils/date-utils";
import { EventsData, getEventsDataRepository } from "../../entities/_Events-data";
import { dataTransform, notEmpty } from "../../utils/functions";


export async function SyncEventsData(report: any, _repoEvent: Repository<EventsData> | null = null): Promise<boolean> {
    try {
        _repoEvent = _repoEvent ?? await getEventsDataRepository();

        const reported_date = milisecond_to_date(report.reported_date, 'dateOnly');
        const month = (new Date(reported_date)).getMonth() + 1;
        const fields = report.fields;

        const events: string[] = notEmpty(fields.event_desease?.events) ? fields.event_desease.events.split(' ') : [];

        const _event = new EventsData();

        _event.id = report._id;
        _event.rev = report._rev;
        _event.form = report.form;
        _event.year = (new Date(reported_date)).getFullYear();
        _event.month = month < 10 ? `0${month}` : `${month}`;
        
        _event.events = events;
        _event.other_event = dataTransform(fields.event_desease.other_event, 'string');
        _event.event_name = dataTransform(fields.event_desease.event_name, 'string');
        _event.event_date = dataTransform(fields.event_desease.event_date, 'string');
        _event.village_location_name = dataTransform(fields.event_desease.village_location_name, 'string');
        _event.name_person_in_charge = dataTransform(fields.event_desease.name_person_in_charge, 'string');
        _event.phone_person_in_charge = dataTransform(fields.event_desease.phone_person_in_charge, 'string');
        _event.health_center_feedback_date = dataTransform(fields.event_desease.health_center_feedback_date, 'string');
        _event.feedback_manager = dataTransform(fields.event_desease.health_center_feedback_location, 'string');

        _event.is_flood = dataTransform(events.includes(`flood`), `null_false`);
        _event.is_fire = dataTransform(events.includes(`fire`), `null_false`);
        _event.is_shipwreck = dataTransform(events.includes(`shipwreck`), `null_false`);
        _event.is_landslide = dataTransform(events.includes(`landslide`), `null_false`);
        _event.is_grouped_animal_deaths = dataTransform(events.includes(`grouped_animal_deaths`), `null_false`);
        _event.is_pfa = dataTransform(events.includes(`pfa`), `null_false`);
        _event.is_bloody_diarrhea = dataTransform(events.includes(`bloody_diarrhea`), `null_false`);
        _event.is_yellow_fever = dataTransform(events.includes(`yellow_fever`), `null_false`);
        _event.is_cholera = dataTransform(events.includes(`cholera`), `null_false`);
        _event.is_maternal_and_neonatal_tetanus = dataTransform(events.includes(`maternal_and_neonatal_tetanus`), `null_false`);
        _event.is_viral_diseases = dataTransform(events.includes(`viral_diseases`), `null_false`);
        _event.is_meningitis = dataTransform(events.includes(`meningitis`), `null_false`);
        _event.is_maternal_deaths = dataTransform(events.includes(`maternal_deaths`), `null_false`);
        _event.is_community_deaths = dataTransform(events.includes(`community_deaths`), `null_false`);
        _event.is_influenza_fever = dataTransform(events.includes(`influenza_fever`), `null_false`);

        _event.country = fields.country_id;
        _event.region = fields.region_id;
        _event.prefecture = fields.prefecture_id;
        _event.commune = fields.commune_id;
        _event.hospital = fields.hospital_id;
        _event.district_quartier = fields.district_quartier_id;
        _event.village_secteur = fields.village_secteur_id;
        _event.reco = fields.user_id;
        _event.reported_date_timestamp = report.reported_date;
        _event.reported_date = reported_date;
        _event.reported_full_date = milisecond_to_date(report.reported_date, 'fulldate');
        _event.geolocation = report.geolocation;

        await _repoEvent.save(_event);
        return true;
    } catch (err: any) {
        return false;
    }
}