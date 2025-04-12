# Mapping des RECOs à leur nouveau district
newDistrictId1 = "cfd7f42a-6e72-4fea-a398-88c7af6161e8"
newDistrictId2 = "dc9562b3-d4b4-43ef-883e-c97ce8d4839b"
newDistrictId3 = "d62cbe3e-99ba-4a0e-848d-5e31f9dc1cc8"

rocsIds = {
    "d95f6e5f-d27d-4557-af59-46559f47dfef": newDistrictId1,
    "a9e2cd0e-098b-4891-9055-4a29155231dc": newDistrictId1,
    "97406f7d-ad6f-459c-b6a8-84064236b62a": newDistrictId1,
    "eb8b3765-02ef-46e3-8b06-6b432cd42fc7": newDistrictId1,
    "2f165345-4b9a-408f-848f-d122c9722c7f": newDistrictId1,
    "9e023cb6-956c-4d52-9f17-a9d708b35772": newDistrictId1,
    "655423cc-a21c-40c7-b00a-b80a0720c629": newDistrictId1,
    "690f5ee8-afb2-4d1a-b07b-0582747ebbbf": newDistrictId2,
    "4be5e150-03c8-41e2-96a9-89cceb2b968e": newDistrictId3
}

zoneForms = [
    "drugs_management",
    "event_register",
    "pa_educational_talk",
    "supervision_notebook_reco"
]

familyForms = [
    "pa_home_visit"
]

patientForms = [
    "adult_consulation", 
    "adult_followup", 
    "death_report", 
    "delivery",
    "family_planning",
    "fp_danger_sign_check",
    "fp_renewal",
    "men_family_planning",
    "newborn_followup",
    "newborn_register",
    "pcimne_followup",
    "pcimne_register",
    "pregnancy_register",
    "prenatal_followup",
    "referral_followup",
    "referral_town_hall_followup",
    "undo_death_report",
    "vaccination_followup",
    "vaccination_referal_followup",
    "pa_individual_talk"
]


# "supervision_grid",
# "supervision_notebook_chws",
# "fs_meg_situation",



def chunked(iterable, size):
    for i in range(0, len(iterable), size):
        yield iterable[i:i + size]


def UpdateDistrictId():
    import requests
    # Configuration
    COUCHDB_URL = "https://kendeya.portal-integratehealth.org"
    DB_NAME = "medic"
    AUTH = ('admin', 'IntHea2004')

    # Requête pour récupérer tous les documents
    all_docs_url = f"{COUCHDB_URL}/{DB_NAME}/_all_docs?include_docs=true"
    response = requests.get(all_docs_url, auth=AUTH)


    if response.status_code == 200:
        rows = response.json().get("rows", [])

        updated_docs = []
        print("Start checking data to update")

        for row in rows:
            doc = row.get("doc")
            if not doc:
                print(f"Document {row.get('id')} has no doc object")
                continue

            doc_type = doc.get("type")
            doc_role = doc.get("role")
            contact = doc.get("contact")
            parent = doc.get("parent")
            user_info = doc.get("user_info")
            form = doc.get("form")
            fields = doc.get("fields")

            # Mise à jour des centres de santé
            if doc_type == "health_center":
                if contact and contact.get("_id") in rocsIds and parent:
                    district_id = rocsIds[contact["_id"]]
                    if parent.get("_id") != district_id:
                        parent["_id"] = district_id
                        updated_docs.append(doc)

            # Mise à jour des cliniques
            if doc_type == "clinic":
                if user_info and user_info.get("created_user_id") in rocsIds:
                    if parent and parent.get("parent"):
                        if parent and parent.get("parent"):
                            district_id = rocsIds[user_info["created_user_id"]]
                            if parent["parent"].get("_id") != district_id:
                                parent["parent"]["_id"] = district_id
                                updated_docs.append(doc)

            # Mise à jour des patients
            if doc_type == "person" and doc_role == "patient":
                if user_info and user_info.get("created_user_id") in rocsIds:
                    if parent and parent.get("parent") and parent["parent"].get("parent"):
                        district_id = rocsIds[user_info["created_user_id"]]
                        if parent["parent"]["parent"].get("_id") != district_id:
                            parent["parent"]["parent"]["_id"] = district_id
                            updated_docs.append(doc)

            # Mise à jour des RECO
            if doc_type == "person" and doc_role == "reco":
                if doc.get("_id") in rocsIds:
                    if parent and parent.get("parent"):
                        district_id = rocsIds[doc["_id"]]
                        if parent["parent"].get("_id") != district_id:
                            parent["parent"]["_id"] = district_id
                            updated_docs.append(doc)

            # Mise à jour des formulaires
            if form and contact and contact.get("_id") in rocsIds:
                district_id = rocsIds[contact["_id"]]

                if form in zoneForms:
                    if contact.get("parent") and contact["parent"].get("parent"):
                        if contact["parent"]["parent"].get("_id") != district_id:
                            contact["parent"]["parent"]["_id"] = district_id

                            if fields:
                                inputs = fields.get("inputs", {})
                                if inputs.get("contact") and inputs["contact"].get("parent"):
                                    inputs["contact"]["parent"]["_id"] = district_id

                                fields["district_quartier_id"] = district_id
                            updated_docs.append(doc)

                if form in familyForms:
                    if contact.get("parent") and contact["parent"].get("parent"):
                        if contact["parent"]["parent"].get("_id") != district_id:
                            contact["parent"]["parent"]["_id"] = district_id

                            if fields:
                                inputs = fields.get("inputs", {})
                                contact_input = inputs.get("contact", {})
                                if contact_input.get("parent") and contact_input["parent"].get("parent"):
                                    contact_input["parent"]["parent"]["_id"] = district_id

                                fields["district_quartier_id"] = district_id
                            updated_docs.append(doc)

                if form in patientForms:
                    if contact.get("parent") and contact["parent"].get("parent"):
                        if contact["parent"]["parent"].get("_id") != district_id:
                            contact["parent"]["parent"]["_id"] = district_id

                            if fields:
                                inputs = fields.get("inputs", {})
                                contact_input = inputs.get("contact", {})
                                if (contact_input.get("parent") and
                                    contact_input["parent"].get("parent") and
                                    contact_input["parent"]["parent"].get("parent")):
                                    contact_input["parent"]["parent"]["parent"]["_id"] = district_id

                                fields["district_quartier_id"] = district_id
                            updated_docs.append(doc)

            

        # Envoi des documents mis à jour en bloc
        if updated_docs:
            print("Start builk store ...")
            bulk_url = f"{COUCHDB_URL}/{DB_NAME}/_bulk_docs"
            CHUNK_SIZE = 100  # Ajustez à vos besoins

            for chunk in chunked(updated_docs, CHUNK_SIZE):
                bulk_response = requests.post(bulk_url, auth=AUTH, json={"docs": chunk})
                if bulk_response.status_code == 201:
                    print("Chunk updated successfully")
                else:
                    print("Error during chunk update:", bulk_response.status_code, bulk_response.text)


            # bulk_response = requests.post(bulk_url, auth=AUTH, json={"docs": updated_docs})
            # if bulk_response.status_code == 201:
            #     print("Documents mis à jour avec succès.")
            #     print(bulk_response.json())
            # else:
            #     print("Erreur lors de la mise à jour :", bulk_response.status_code, bulk_response.text)
        else:
            print("Aucun document à mettre à jour.")
    else:
        print("Erreur lors de la récupération des documents :", response.status_code, response.text)




def UpdateDbUsersInfos():

    from sshtunnel import SSHTunnelForwarder
    import psycopg2

    # Données SSH
    ssh_host = "portal-integratehealth.org"
    ssh_port = 7822
    ssh_user = "kossi"
    ssh_password = "kossi@123"  # ou None si tu utilises un mot de passe

    # Données PostgreSQL (côté serveur distant)
    remote_pg_host = "127.0.0.1"
    remote_pg_port = 5432
    db_name = "guinee_db"
    db_user = "kossi"
    db_password = "kossi@123"

    # Liste des reco_id
    reco_ids = ['abc123', 'def456', 'ghi789']

    with SSHTunnelForwarder(
        (ssh_host, ssh_port),
        ssh_username=ssh_user,
        ssh_password=ssh_password, # ou ssh_pkey=ssh_key_path,
        remote_bind_address=(remote_pg_host, remote_pg_port),
        local_bind_address=('localhost', 6543)  # port local vers lequel on redirige
    ) as tunnel:
        conn = psycopg2.connect(
            host='localhost',
            port=6543,
            dbname=db_name,
            user=db_user,
            password=db_password
        )


        # villageSecteurs
        # chws
        # recos

        # export interface VillageSecteursMap { id: string, external_id: string, name: string, country_id: string, region_id: string, prefecture_id: string, commune_id: string, hospital_id: string, district_quartier_id: string }
        # export interface ChwsMap { id: string, external_id: string, name: string, country_id: string, region_id: string, prefecture_id: string, commune_id: string, hospital_id: string, district_quartier_id: string }
        # export interface RecosMap { id: string, external_id: string, name: string, country_id: string, region_id: string, prefecture_id: string, commune_id: string, hospital_id: string, district_quartier_id: string, village_secteur_id: string }


        cursor = conn.cursor()

        # cursor.execute(
        #     "UPDATE users SET updated_at = NOW() WHERE reco_id = ANY(%s)",
        #     (reco_ids,)
        # )

        # -- Mise à jour de villageSecteurs
        # UPDATE users
        # SET villageSecteurs = (
        # SELECT jsonb_agg(
        #     jsonb_set(elem, '{district_quartier_id}', to_jsonb('jskhfiohsdkfhkshd'))
        # )
        # FROM jsonb_array_elements(villageSecteurs) AS elem
        # )
        # WHERE EXISTS (
        #     SELECT 1 FROM jsonb_array_elements(villageSecteurs) AS elem
        #     WHERE elem->>'district_quartier_id' = 'HJKHKJKK'
        # );

        # -- Mise à jour de chws
        # UPDATE users
        # SET chws = (
        # SELECT jsonb_agg(
        #     jsonb_set(elem, '{district_quartier_id}', to_jsonb('jskhfiohsdkfhkshd'))
        # )
        # FROM jsonb_array_elements(chws) AS elem
        # )
        # WHERE EXISTS (
        #     SELECT 1 FROM jsonb_array_elements(chws) AS elem
        #     WHERE elem->>'district_quartier_id' = 'HJKHKJKK'
        # );

        # -- Mise à jour de recos
        # UPDATE users
        # SET recos = (
        # SELECT jsonb_agg(
        #     jsonb_set(elem, '{district_quartier_id}', to_jsonb('jskhfiohsdkfhkshd'))
        # )
        # FROM jsonb_array_elements(recos) AS elem
        # )
        # WHERE EXISTS (
        #     SELECT 1 FROM jsonb_array_elements(recos) AS elem
        #     WHERE elem->>'district_quartier_id' = 'HJKHKJKK'
        # );




        # Requêtes SQL
        update_queries = [
            f"""
            UPDATE users
            SET villageSecteurs = (
            SELECT jsonb_agg(
                jsonb_set(elem, '{{district_quartier_id}}', to_jsonb('{new_district_id}'))
            )
            FROM jsonb_array_elements(villageSecteurs) AS elem
            )
            WHERE EXISTS (
                SELECT 1 FROM jsonb_array_elements(villageSecteurs) AS elem
                WHERE elem->>'district_quartier_id' = '{old_district_id}'
            );
            """,
            f"""
            UPDATE users
            SET chws = (
            SELECT jsonb_agg(
                jsonb_set(elem, '{{district_quartier_id}}', to_jsonb('{new_district_id}'))
            )
            FROM jsonb_array_elements(chws) AS elem
            )
            WHERE EXISTS (
                SELECT 1 FROM jsonb_array_elements(chws) AS elem
                WHERE elem->>'district_quartier_id' = '{old_district_id}'
            );
            """,
            f"""
            UPDATE users
            SET recos = (
            SELECT jsonb_agg(
                jsonb_set(elem, '{{district_quartier_id}}', to_jsonb('{new_district_id}'))
            )
            FROM jsonb_array_elements(recos) AS elem
            )
            WHERE EXISTS (
                SELECT 1 FROM jsonb_array_elements(recos) AS elem
                WHERE elem->>'district_quartier_id' = '{old_district_id}'
            );
            """
        ]



        cursor.execute("SELECT * FROM users")
        users = cursor.fetchall()

        conn.commit()

        cursor.close()
        conn.close()





    # # Connexion à PostgreSQL
    # # conn = psycopg2.connect(
    # #     dbname="your_db",
    # #     user="your_user",
    # #     password="your_password",
    # #     host="localhost",
    # #     port="5432"
    # # )

    # conn = psycopg2.connect(
    #     host="your-cloud-db-host.com",
    #     port=5432,
    #     dbname="your_db_name",
    #     user="your_username",
    #     password="your_password",
    #     sslmode="require"  # souvent nécessaire pour le cloud
    # )
    # cursor = conn.cursor()

    # # Tableau d'identifiants reco_id
    # reco_ids = ['reco_1', 'reco_2', 'reco_3']
    # new_value = 'new_value'

    # # Requête de mise à jour
    # query = """
    # UPDATE users
    # SET column_name = %s
    # WHERE reco_id = ANY(%s);
    # """

    # cursor.execute(query, (new_value, reco_ids))
    # conn.commit()

    # cursor.close()
    # conn.close()

