"""
Equipment Manager — Seeders
Données de référence réalistes pour l'environnement Integrate Health.

Usage CLI :
    flask em seed              → seed tout
    flask em seed --module locations
    flask em seed --module positions
    flask em seed --module categories
    flask em seed --module brands
    flask em seed --module problem-types
    flask em seed --module alert-config
    flask em seed --module employees
    flask em seed --module equipment
    flask em seed --module tickets
    flask em seed --reset      → vide les tables puis reseed (DANGER: dev only)
"""
from __future__ import annotations

from datetime import datetime, timezone

from backend.src.modules.analytics.logger import get_backend_logger
from backend.src.modules.equipments.models.email_config import AlertConfig
from backend.src.modules.equipments.models.locations import Site
from backend.src.modules.equipments.models.tickets import Issue, ProblemType, RepairTicket, TicketEvent

logger = get_backend_logger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────────────────────

def _upsert(model, lookup: dict, defaults: dict):
    """
    Récupère ou crée un enregistrement.
    Retourne (instance, created: bool).
    """
    from backend.src.app.configs.extensions import db
    obj = model.query.filter_by(**lookup).first()
    if obj:
        return obj, False
    obj = model(**lookup, **defaults)
    db.session.add(obj)
    return obj, True


def _flush():
    from backend.src.app.configs.extensions import db
    db.session.flush()


def _commit():
    from backend.src.app.configs.extensions import db
    db.session.commit()


# ─────────────────────────────────────────────────────────────────────────────
# LOCATIONS  (Régions → Districts → Sites)
# ─────────────────────────────────────────────────────────────────────────────

REGIONS_DATA = [
    {"name": "Maritime",  "code": "MAR"},
    {"name": "Plateaux",  "code": "PLA"},
    {"name": "Centrale",  "code": "CEN"},
    {"name": "Kara",      "code": "KAR"},
    {"name": "Savanes",   "code": "SAV"},
]

DISTRICTS_DATA = [
    # Maritime
    {"region_code": "MAR", "name": "Lomé Commune",  "code": "MAR-LOM"},
    {"region_code": "MAR", "name": "Golfe",          "code": "MAR-GOL"},
    {"region_code": "MAR", "name": "Zio",            "code": "MAR-ZIO"},
    {"region_code": "MAR", "name": "Lacs",           "code": "MAR-LAC"},
    # Plateaux
    {"region_code": "PLA", "name": "Kloto",          "code": "PLA-KLO"},
    {"region_code": "PLA", "name": "Ogou",           "code": "PLA-OGO"},
    {"region_code": "PLA", "name": "Haho",           "code": "PLA-HAH"},
    {"region_code": "PLA", "name": "Amou",           "code": "PLA-AMO"},
    # Centrale
    {"region_code": "CEN", "name": "Tchaoudjo",      "code": "CEN-TCH"},
    {"region_code": "CEN", "name": "Sotouboua",      "code": "CEN-SOT"},
    # Kara
    {"region_code": "KAR", "name": "Kozah",          "code": "KAR-KOZ"},
    {"region_code": "KAR", "name": "Bassar",         "code": "KAR-BAS"},
    # Savanes
    {"region_code": "SAV", "name": "Tone",           "code": "SAV-TON"},
    {"region_code": "SAV", "name": "Kpendjal",       "code": "SAV-KPE"},
]

SITES_DATA = [
    # Lomé Commune
    {"district_code": "MAR-LOM", "name": "CS Tokoin",          "code": "MAR-LOM-001"},
    {"district_code": "MAR-LOM", "name": "CS Be",              "code": "MAR-LOM-002"},
    {"district_code": "MAR-LOM", "name": "CS Adidogome",       "code": "MAR-LOM-003"},
    # Golfe
    {"district_code": "MAR-GOL", "name": "CS Agoenyvie",       "code": "MAR-GOL-001"},
    {"district_code": "MAR-GOL", "name": "CS Legbassito",      "code": "MAR-GOL-002"},
    # Zio
    {"district_code": "MAR-ZIO", "name": "CS Tsevie Centre",   "code": "MAR-ZIO-001"},
    {"district_code": "MAR-ZIO", "name": "CS Kpome",           "code": "MAR-ZIO-002"},
    # Lacs
    {"district_code": "MAR-LAC", "name": "CS Vogan Centre",    "code": "MAR-LAC-001"},
    {"district_code": "MAR-LAC", "name": "CS Aneho",           "code": "MAR-LAC-002"},
    # Kloto
    {"district_code": "PLA-KLO", "name": "CS Kpalime Centre",  "code": "PLA-KLO-001"},
    {"district_code": "PLA-KLO", "name": "CS Kpime",           "code": "PLA-KLO-002"},
    # Ogou
    {"district_code": "PLA-OGO", "name": "CS Atakpame Nord",   "code": "PLA-OGO-001"},
    {"district_code": "PLA-OGO", "name": "CS Atakpame Sud",    "code": "PLA-OGO-002"},
    # Tchaoudjo
    {"district_code": "CEN-TCH", "name": "CS Sokode Centre",   "code": "CEN-TCH-001"},
    {"district_code": "CEN-TCH", "name": "CS Tchalo",          "code": "CEN-TCH-002"},
    # Kozah
    {"district_code": "KAR-KOZ", "name": "CS Kara Centre",     "code": "KAR-KOZ-001"},
    {"district_code": "KAR-KOZ", "name": "CS Lassa",           "code": "KAR-KOZ-002"},
    # Tone
    {"district_code": "SAV-TON", "name": "CS Dapaong Centre",  "code": "SAV-TON-001"},
    {"district_code": "SAV-TON", "name": "CS Nioukpourma",     "code": "SAV-TON-002"},
]


def seed_locations():
    created_total = 0

    # # Régions
    # region_map: dict[str, Region] = {}
    # for r in REGIONS_DATA:
    #     obj, created = _upsert(Region, {"code": r["code"]}, {"name": r["name"]})
    #     region_map[r["code"]] = obj
    #     if created:
    #         created_total += 1
    # _flush()

    # # Districts
    # district_map: dict[str, District] = {}
    # for d in DISTRICTS_DATA:
    #     region = region_map.get(d["region_code"])
    #     if not region:
    #         continue
    #     obj, created = _upsert(
    #         District,
    #         {"code": d["code"]},
    #         {"name": d["name"], "region_id": region.id},
    #     )
    #     district_map[d["code"]] = obj
    #     if created:
    #         created_total += 1
    # _flush()

    # # Sites
    # for s in SITES_DATA:
    #     district = district_map.get(s["district_code"])
    #     if not district:
    #         continue
    #     _, created = _upsert(
    #         Site,
    #         {"code": s["code"]},
    #         {"name": s["name"], "district_id": district.id},
    #     )
    #     if created:
    #         created_total += 1
    # _commit()

    # logger.info(f"[seed_locations] {created_total} enregistrements créés")
    return created_total


# ─────────────────────────────────────────────────────────────────────────────
# DEPARTMENTS  (hiérarchiques)
# ─────────────────────────────────────────────────────────────────────────────

DEPARTMENTS_DATA = [
    # (code, name, parent_code)
    ("DG",       "Direction Générale",           None),
    ("PROG",     "Département Programme",         "DG"),
    ("LOG",      "Département Logistique",        "DG"),
    ("FIN",      "Département Finance",           "DG"),
    ("RH",       "Département Ressources Humaines","DG"),
    ("ESANTE",   "Département eSanté",            "DG"),
    ("SUIVI",    "Département Suivi-Évaluation",  "DG"),
    ("COMM",     "Département Communication",     "DG"),
]


# ─────────────────────────────────────────────────────────────────────────────
# POSITIONS  (hiérarchiques, liées aux départements)
# ─────────────────────────────────────────────────────────────────────────────

POSITIONS_DATA = [
    # (code, name, dept_code, parent_code, is_zone_assignable)
    ("DIR-PROG",  "Directeur de Programme",            "PROG",   None,         False),
    ("COORD-PROG","Coordinateur Programme",             "PROG",   "DIR-PROG",   False),
    ("SUP-PROG",  "Superviseur de Zone Programme",      "PROG",   "COORD-PROG", False),
    ("AGT-PROG",  "Agent de Programme",                 "PROG",   "SUP-PROG",   False),

    ("DIR-LOG",   "Directeur Logistique",               "LOG",    None,         False),
    ("COORD-LOG", "Coordinateur Logistique",            "LOG",    "DIR-LOG",    False),
    ("GEST-EQ",   "Gestionnaire Équipements",           "LOG",    "COORD-LOG",  False),
    ("TECH-LOG",  "Technicien Logistique",              "LOG",    "COORD-LOG",  False),
    ("CHAUF",     "Chauffeur",                          "LOG",    "COORD-LOG",  False),

    ("DIR-FIN",   "Directeur Financier",                "FIN",    None,         False),
    ("COMPTA",    "Comptable",                          "FIN",    "DIR-FIN",    False),

    ("DIR-RH",    "Directeur des Ressources Humaines",  "RH",     None,         False),
    ("CHG-RH",    "Chargé RH",                         "RH",     "DIR-RH",     False),

    ("DIR-ES",    "Directeur eSanté",                   "ESANTE", None,         False),
    ("COORD-ES",  "Coordinateur eSanté",                "ESANTE", "DIR-ES",     False),
    ("SUP-ES",    "Superviseur eSanté",                 "ESANTE", "COORD-ES",   True),   # assignable à une zone
    ("AGT-ES",    "Agent eSanté / ASC",                 "ESANTE", "SUP-ES",     True),   # assignable à une zone

    ("DIR-SE",    "Directeur Suivi-Évaluation",         "SUIVI",  None,         False),
    ("CHG-SE",    "Chargé Suivi-Évaluation",            "SUIVI",  "DIR-SE",     False),
]


def seed_positions():
    from backend.src.app.models.f_employee import Position

    # Charger les départements existants
    created_total = 0
    pos_map: dict[str, Position] = {}

    for code, name, dept_code, parent_code, is_zone_assignable in POSITIONS_DATA:

        parent = pos_map.get(parent_code) if parent_code else None
        obj, created = _upsert(
            Position,
            {"code": code},
            {
                "name": name,
                "parent_id": parent.id if parent else None,
                "is_zone_assignable": is_zone_assignable,
                "is_active": True,
            },
        )
        # Mettre à jour les enregistrements existants également
        obj.is_zone_assignable = is_zone_assignable
        pos_map[code] = obj
        _flush()
        if created:
            created_total += 1

    _commit()
    logger.info(f"[seed_positions] {created_total} enregistrements créés")
    return created_total


# ─────────────────────────────────────────────────────────────────────────────
# EQUIPMENT CATEGORY GROUPS + CATEGORIES
# ─────────────────────────────────────────────────────────────────────────────

CATEGORY_GROUPS_DATA = [
    ("ELECTRONIQUE", "Électronique",       "Appareils électroniques et informatiques"),
    ("VEHICULE",     "Véhicule",           "Moyens de déplacement motorisés"),
    ("MOBILIER",     "Mobilier de bureau", "Meubles et aménagement"),
    ("MATERIEL",     "Matériel divers",    "Matériel et équipements non électroniques"),
]

CATEGORIES_DATA = [
    # (group_code, code, name, description)
    # Électronique
    ("ELECTRONIQUE", "TEL",  "Téléphone mobile",    "Smartphone ou téléphone basique"),
    ("ELECTRONIQUE", "TAB",  "Tablette",            "Tablette Android ou iOS"),
    ("ELECTRONIQUE", "LAP",  "Ordinateur portable", "Laptop / Notebook"),
    ("ELECTRONIQUE", "PC",   "Ordinateur fixe",     "Desktop / Unité centrale + écran"),
    ("ELECTRONIQUE", "IMP",  "Imprimante",          "Imprimante laser ou jet d'encre"),
    ("ELECTRONIQUE", "NET",  "Routeur / Modem",     "Équipement réseau et connectivité"),
    ("ELECTRONIQUE", "CAM",  "Appareil photo",      "Caméra ou appareil photo numérique"),
    ("ELECTRONIQUE", "GPS",  "GPS",                 "Appareil de géolocalisation"),
    ("ELECTRONIQUE", "UPS",  "Onduleur (UPS)",      "Alimentation sans interruption"),
    # Véhicule
    ("VEHICULE",     "MOTO", "Moto",                "Moto ou motocyclette"),
    ("VEHICULE",     "VOI",  "Véhicule 4 roues",    "Voiture, 4x4, pickup"),
    ("VEHICULE",     "VELO", "Vélo",                "Bicyclette"),
    # Mobilier
    ("MOBILIER",     "BUR",  "Bureau",              "Table de travail ou bureau"),
    ("MOBILIER",     "CHA",  "Chaise",              "Siège et chaise de bureau"),
    ("MOBILIER",     "ARM",  "Armoire / Étagère",   "Rangement et archivage"),
    ("MOBILIER",     "CLI",  "Climatiseur",         "Appareil de climatisation"),
    # Matériel
    ("MATERIEL",     "GEN",  "Groupe électrogène",  "Générateur électrique"),
    ("MATERIEL",     "PROJ", "Vidéoprojecteur",     "Projecteur multimédia"),
    ("MATERIEL",     "STAB", "Stabilisateur",       "Régulateur de tension"),
]


def seed_categories():
    from backend.src.modules.equipments.models.equipment import EquipmentCategoryGroup, EquipmentCategory

    created_total = 0
    group_map: dict[str, EquipmentCategoryGroup] = {}

    # Groups
    for code, name, description in CATEGORY_GROUPS_DATA:
        obj, created = _upsert(
            EquipmentCategoryGroup,
            {"code": code},
            {"name": name, "description": description, "is_active": True},
        )
        group_map[code] = obj
        if created:
            created_total += 1
    _flush()

    # Categories
    for group_code, code, name, description in CATEGORIES_DATA:
        group = group_map.get(group_code)
        if not group:
            continue
        _, created = _upsert(
            EquipmentCategory,
            {"code": code},
            {
                "name": name,
                "description": description,
                "category_group_id": group.id,
                "is_active": True,
            },
        )
        if created:
            created_total += 1
    _commit()

    logger.info(f"[seed_categories] {created_total} enregistrements créés")
    return created_total


# ─────────────────────────────────────────────────────────────────────────────
# EQUIPMENT BRANDS
# ─────────────────────────────────────────────────────────────────────────────

BRANDS_DATA = [
    # (code, name, description)
    ("SAMSUNG",  "Samsung",   "Électronique coréen"),
    ("APPLE",    "Apple",     "Électronique américain"),
    ("HUAWEI",   "Huawei",    "Électronique chinois"),
    ("LENOVO",   "Lenovo",    "Informatique chinois"),
    ("HP",       "HP",        "Hewlett-Packard"),
    ("DELL",     "Dell",      "Informatique américain"),
    ("ASUS",     "Asus",      "Informatique taïwanais"),
    ("ACER",     "Acer",      "Informatique taïwanais"),
    ("TECNO",    "Tecno",     "Smartphones Afrique"),
    ("ITEL",     "Itel",      "Téléphones entrée de gamme"),
    ("INFINIX",  "Infinix",   "Smartphones milieu de gamme"),
    ("TPLINK",   "TP-Link",   "Équipements réseau"),
    ("EPSON",    "Epson",     "Imprimantes et scanners"),
    ("CANON",    "Canon",     "Imprimantes et appareils photo"),
    ("YAMAHA",   "Yamaha",    "Motos"),
    ("HONDA",    "Honda",     "Motos et véhicules"),
    ("TVS",      "TVS",       "Motos abordables"),
    ("SUZUKI",   "Suzuki",    "Motos et véhicules"),
    ("TOYOTA",   "Toyota",    "Véhicules 4x4"),
    ("NISSAN",   "Nissan",    "Véhicules tout-terrain"),
    ("APC",      "APC",       "Onduleurs et UPS"),
    ("EATON",    "Eaton",     "Onduleurs industriels"),
    ("AUTRE",    "Autre",     "Marque non listée"),
]


def seed_brands():
    from backend.src.modules.equipments.models.equipment import EquipmentBrand

    created_total = 0
    for code, name, description in BRANDS_DATA:
        _, created = _upsert(
            EquipmentBrand,
            {"code": code},
            {"name": name, "description": description, "is_active": True},
        )
        if created:
            created_total += 1
    _commit()

    logger.info(f"[seed_brands] {created_total} enregistrements créés")
    return created_total


# ─────────────────────────────────────────────────────────────────────────────
# PROBLEM TYPES
# ─────────────────────────────────────────────────────────────────────────────

PROBLEM_TYPES_DATA = [
    # (code, name, category, display_order)
    # ── HARDWARE ──────────────────────────────────────────────────────────────
    ("ECRAN_CASSE",      "Écran cassé / fissuré",              "HARDWARE",  1),
    ("NO_POWER",         "Ne s'allume pas / ne démarre pas",   "HARDWARE",  2),
    ("BATT_DEF",         "Batterie défaillante / ne tient pas","HARDWARE",  3),
    ("PORT_CHARGE",      "Port de charge défaillant",          "HARDWARE",  4),
    ("CLAVIER_BTN",      "Clavier / boutons défaillants",      "HARDWARE",  5),
    ("CAMERA_DEF",       "Caméra défaillante",                 "HARDWARE",  6),
    ("AUDIO_DEF",        "Haut-parleur / micro défaillant",    "HARDWARE",  7),
    ("CONNECTEUR",       "Connecteur / prise défaillant(e)",   "HARDWARE",  8),
    ("SURCHAUFFE",       "Surchauffe",                         "HARDWARE",  9),
    ("CHARGEUR_DEF",     "Chargeur / alimentation défaillant", "HARDWARE", 10),
    ("PNEU_CREVAISON",   "Pneu crevé / dégonflé",             "HARDWARE", 11),
    ("MOTEUR",           "Problème moteur / mécanique",        "HARDWARE", 12),
    ("FREIN",            "Problème de freins",                 "HARDWARE", 13),
    ("DOMMAGE_PHYSIQUE", "Dommage physique (chute, choc)",     "HARDWARE", 14),
    # ── SOFTWARE ──────────────────────────────────────────────────────────────
    ("OS_CORROMPU",      "Système d'exploitation corrompu",    "SOFTWARE", 20),
    ("APP_BUG",          "Application ne fonctionne pas",      "SOFTWARE", 21),
    ("CONNECTIVITE",     "Problème de connectivité / réseau",  "SOFTWARE", 22),
    ("VIRUS",            "Virus / malware détecté",            "SOFTWARE", 23),
    ("LENTEUR",          "Appareil lent / gelé",               "SOFTWARE", 24),
    ("CONFIG_ERROR",     "Erreur de configuration",            "SOFTWARE", 25),
    # ── OTHER ─────────────────────────────────────────────────────────────────
    ("PERTE",            "Perte",                              "OTHER",    30),
    ("VOL",              "Vol",                                "OTHER",    31),
    ("DEGAT_EAU",        "Dégât des eaux",                     "OTHER",    32),
    ("DEGAT_FEU",        "Dégât du feu",                       "OTHER",    33),
    ("GARANTIE",         "Défaut sous garantie constructeur",  "OTHER",    34),
    ("AUTRE",            "Autre problème",                     "OTHER",    35),
]


def seed_problem_types():
    created_total = 0
    for code, name, category, order in PROBLEM_TYPES_DATA:
        _, created = _upsert(
            ProblemType,
            {"code": code},
            {"name": name, "category": category, "display_order": order, "is_active": True},
        )
        if created:
            created_total += 1
    _commit()

    logger.info(f"[seed_problem_types] {created_total} enregistrements créés")
    return created_total


# ─────────────────────────────────────────────────────────────────────────────
# ALERT CONFIG  (1 seule config active)
# ─────────────────────────────────────────────────────────────────────────────

def seed_alert_config():
    existing = AlertConfig.query.filter_by(is_active=True).first()
    if existing:
        logger.info("[seed_alert_config] Config active déjà présente, skip")
        return 0

    config = AlertConfig(
        warning_days=7,
        escalation_days=14,
        frequency_hours=24,
        is_active=True,
    )
    from backend.src.app.configs.extensions import db
    db.session.add(config)
    _commit()
    logger.info("[seed_alert_config] AlertConfig créée (7j warning / 14j escalade / 24h fréquence)")
    return 1


# ─────────────────────────────────────────────────────────────────────────────
# EMPLOYEES  (ASCs, superviseurs, coordinateurs, directeurs, gestionnaires)
# ─────────────────────────────────────────────────────────────────────────────

EMPLOYEES_DATA = [
    # (code, first_name, last_name, gender, phone, email, position_code, hire_date)
    ("EMP-001", "Komi",    "Agbodjan",   "M", "+22890111001", "k.agbodjan@integh.org",   "AGT-ES",    "2020-03-15"),
    ("EMP-002", "Ama",     "Mensah",     "F", "+22890111002", "a.mensah@integh.org",     "AGT-ES",    "2020-03-15"),
    ("EMP-003", "Kossi",   "Dotse",      "M", "+22890111003", "k.dotse@integh.org",      "AGT-ES",    "2021-01-10"),
    ("EMP-004", "Yawa",    "Klutse",     "F", "+22890111004", "y.klutse@integh.org",     "AGT-ES",    "2021-01-10"),
    ("EMP-005", "Kofi",    "Tossa",      "M", "+22890111005", "k.tossa@integh.org",      "AGT-ES",    "2021-06-01"),
    ("EMP-006", "Dzifa",   "Kangni",     "F", "+22890111006", "d.kangni@integh.org",     "AGT-ES",    "2022-02-20"),
    ("EMP-007", "Edem",    "Goka",       "M", "+22890111007", "e.goka@integh.org",       "AGT-ES",    "2022-02-20"),
    ("EMP-008", "Kafui",   "Lawson",     "F", "+22890111008", "k.lawson@integh.org",     "AGT-ES",    "2022-07-05"),
    ("EMP-009", "Mawuli",  "Agossou",    "M", "+22890111009", "m.agossou@integh.org",    "SUP-ES",    "2019-05-20"),
    ("EMP-010", "Sena",    "Amouzou",    "F", "+22890111010", "s.amouzou@integh.org",    "SUP-ES",    "2019-08-15"),
    ("EMP-011", "Kokou",   "Boevi",      "M", "+22890111011", "k.boevi@integh.org",      "SUP-ES",    "2020-01-08"),
    ("EMP-012", "Afi",     "Gameli",     "F", "+22890111012", "a.gameli@integh.org",     "SUP-ES",    "2020-04-12"),
    ("EMP-013", "Koku",    "Soglo",      "M", "+22890111013", "djakpo.gado@gmail.com",      "COORD-ES",  "2018-09-01"),
    ("EMP-014", "Dela",    "Attisso",    "F", "+22890111014", "d.attisso@integh.org",    "COORD-ES",  "2018-11-20"),
    ("EMP-015", "Kodzo",   "Apevon",     "M", "+22890111015", "k.apevon@integh.org",     "DIR-ES",    "2017-03-01"),
    ("EMP-016", "Teko",    "Dandjinou",  "M", "+22890111016", "t.dandjinou@integh.org",  "GEST-EQ",   "2019-06-15"),
    ("EMP-017", "Nana",    "Foli",       "F", "+22890111017", "n.foli@integh.org",       "GEST-EQ",   "2020-09-01"),
    ("EMP-018", "Lom",     "Ayeva",      "M", "+22890111018", "l.ayeva@integh.org",      "TECH-LOG",  "2021-03-10"),
    ("EMP-019", "Kuete",   "Amewona",    "M", "+22890111019", "k.amewona@integh.org",    "COORD-PROG","2018-01-15"),
    ("EMP-020", "Kassah",  "Tamekloe",   "M", "+22890111020", "k.tamekloe@integh.org",   "DIR-PROG",  "2016-07-01"),
]

# (supervisor_code, [subordinate_codes])
SUPERVISOR_RELATIONS = [
    ("EMP-009", ["EMP-001", "EMP-002", "EMP-003", "EMP-004"]),
    ("EMP-010", ["EMP-005", "EMP-006", "EMP-007", "EMP-008"]),
    ("EMP-013", ["EMP-009", "EMP-010", "EMP-011", "EMP-012"]),
    ("EMP-015", ["EMP-013", "EMP-014"]),
]


def seed_employees():
    from backend.src.app.models.f_employee import Position, Employee
    from backend.src.app.configs.extensions import db
    from datetime import date

    pos_map = {p.code: p for p in Position.query.all()}
    created_total = 0
    emp_map: dict[str, Employee] = {}

    for code, first, last, gender, phone, email, pos_code, hire_date_str in EMPLOYEES_DATA:
        pos = pos_map.get(pos_code)
        obj, created = _upsert(
            Employee,
            {"employee_id_code": code},
            {
                "first_name": first,
                "last_name": last,
                "gender": gender,
                "phone": phone,
                "email": email,
                "position_id": pos.id if pos else None,
                "hire_date": date.fromisoformat(hire_date_str),
                "is_active": True,
            },
        )
        emp_map[code] = obj
        _flush()
        if created:
            created_total += 1

    # Reload map with persisted IDs for profile creation
    emp_map = {e.employee_id_code: e for e in Employee.query.all() if e.employee_id_code}

    for supervisor_code, subordinate_codes in SUPERVISOR_RELATIONS:
        supervisor = emp_map.get(supervisor_code)
        if not supervisor:
            continue
        for sub_code in subordinate_codes:
            sub = emp_map.get(sub_code)
            if not sub:
                continue
            # profile = EmployeeProfile.query.filter_by(employee_id=sub.id).first()
            # if not profile:
            #     db.session.add(EmployeeProfile(
            #         employee_id=sub.id,
            #         supervisor_employee_id=supervisor.id,
            #     ))
            # elif profile.supervisor_employee_id is None:
            #     profile.supervisor_employee_id = supervisor.id

    _commit()
    logger.info(f"[seed_employees] {created_total} enregistrements créés")
    return created_total


# ─────────────────────────────────────────────────────────────────────────────
# EQUIPMENT  (téléphones, tablettes, laptops, motos)
# ─────────────────────────────────────────────────────────────────────────────

EQUIPMENT_DATA = [
    # (code, category_code, brand_code, model_name, status, has_sim, is_unique, employee_code, owner_code)
    ("EQ-TEL-001", "TEL",  "SAMSUNG",  "Galaxy A32",     "FUNCTIONAL",   True,  True, "EMP-001", "EMP-001"),
    ("EQ-TEL-002", "TEL",  "TECNO",    "Spark 10 Pro",   "FUNCTIONAL",   True,  True, "EMP-002", "EMP-002"),
    ("EQ-TEL-003", "TEL",  "INFINIX",  "Hot 30i",        "FUNCTIONAL",   True,  True, "EMP-003", "EMP-003"),
    ("EQ-TEL-004", "TEL",  "TECNO",    "Camon 20",       "FAULTY",       True,  True, "EMP-004", "EMP-004"),
    ("EQ-TEL-005", "TEL",  "SAMSUNG",  "Galaxy A14",     "FUNCTIONAL",   True,  True, "EMP-005", "EMP-005"),
    ("EQ-TEL-006", "TEL",  "TECNO",    "Spark 9",        "UNDER_REPAIR", True,  True, "EMP-006", "EMP-006"),
    ("EQ-TEL-007", "TEL",  "INFINIX",  "Note 30",        "FUNCTIONAL",   True,  True, "EMP-007", "EMP-007"),
    ("EQ-TEL-008", "TEL",  "SAMSUNG",  "Galaxy A05s",    "FUNCTIONAL",   True,  True, "EMP-008", "EMP-008"),
    ("EQ-TAB-001", "TAB",  "SAMSUNG",  "Galaxy Tab A8",  "FUNCTIONAL",   True,  True, "EMP-009", "EMP-009"),
    ("EQ-TAB-002", "TAB",  "LENOVO",   "Tab M10 Plus",   "FAULTY",       False, True, "EMP-010", "EMP-010"),
    ("EQ-LAP-001", "LAP",  "LENOVO",   "IdeaPad 3 15",   "FAULTY",       False, True, "EMP-015", "EMP-015"),
    ("EQ-LAP-002", "LAP",  "HP",       "ProBook 450 G8", "FAULTY",       False, True, "EMP-016", "EMP-016"),
    ("EQ-MOTO-001","MOTO", "YAMAHA",   "FZ-S V3",        "FUNCTIONAL",   False, True, "EMP-011", "EMP-011"),
    ("EQ-MOTO-002","MOTO", "HONDA",    "CB Shine 125",   "UNDER_REPAIR", False, True, "EMP-012", "EMP-012"),
    ("EQ-MOTO-003","MOTO", "HONDA",    "CG 125",         "UNDER_REPAIR", False, True, "EMP-013", "EMP-013"),
]


def seed_equipment():
    from backend.src.modules.equipments.models.equipment import Equipment, EquipmentCategory, EquipmentBrand
    from backend.src.app.models.f_employee import Employee
    from datetime import date

    cat_map   = {c.code: c for c in EquipmentCategory.query.all()}
    brand_map = {b.code: b for b in EquipmentBrand.query.all()}
    emp_map   = {e.employee_id_code: e for e in Employee.query.all() if e.employee_id_code}

    created_total = 0
    for code, cat_code, brand_code, model_name, status, has_sim, is_unique, emp_code, owner_code in EQUIPMENT_DATA:
        cat   = cat_map.get(cat_code)
        brand = brand_map.get(brand_code)
        emp   = emp_map.get(emp_code)
        owner = emp_map.get(owner_code)
        _, created = _upsert(
            Equipment,
            {"equipment_code": code},
            {
                "category_id":      cat.id if cat else None,
                "brand_id":         brand.id if brand else None,
                "brand":            brand.name if brand else "",
                "model_name":       model_name,
                "status":           status,
                "has_sim":          has_sim,
                "is_unique":        is_unique,
                "employee_id":      emp.id if emp else None,
                "owner_id":         owner.id if owner else None,
                "acquisition_date": date(2022, 6, 1),
            },
        )
        if created:
            created_total += 1

    _commit()
    logger.info(f"[seed_equipment] {created_total} enregistrements créés")
    return created_total


# ─────────────────────────────────────────────────────────────────────────────
# TICKETS  (repair tickets à différents stades du workflow)
# ─────────────────────────────────────────────────────────────────────────────

# events: list of (event_type, from_role, to_role, day_delta_from_creation)
TICKETS_DATA = [
    # ── OPEN ──────────────────────────────────────────────────────────────────
    {
        "number":       "TK-2024-001",
        "equipment":    "EQ-TEL-004",
        "employee":     "EMP-004",
        "status":       "OPEN",
        "stage":        "SUPERVISOR",
        "description":  "Ecran fissure suite a une chute lors d'une visite terrain",
        "problems":     ["ECRAN_CASSE"],
        "days_ago":     3,
        "events":       [("SENT", "", "SUPERVISOR", 0)],
    },
    {
        "number":       "TK-2024-002",
        "equipment":    "EQ-TAB-002",
        "employee":     "EMP-010",
        "status":       "OPEN",
        "stage":        "SUPERVISOR",
        "description":  "La tablette ne charge plus, port micro-USB endommage",
        "problems":     ["PORT_CHARGE"],
        "days_ago":     5,
        "events":       [("SENT", "", "SUPERVISOR", 0)],
    },
    # ── IN_PROGRESS ────────────────────────────────────────────────────────────
    {
        "number":       "TK-2024-003",
        "equipment":    "EQ-TEL-006",
        "employee":     "EMP-006",
        "status":       "IN_PROGRESS",
        "stage":        "LOGISTICS",
        "description":  "Telephone lent et gele frequemment. Application CommCare ne s'ouvre plus.",
        "problems":     ["LENTEUR", "APP_BUG"],
        "days_ago":     12,
        "events": [
            ("SENT",     "",             "SUPERVISOR", 0),
            ("RECEIVED", "",             "SUPERVISOR", 1),
            ("SENT",     "SUPERVISOR",   "PROGRAM",    2),
            ("RECEIVED", "SUPERVISOR",   "PROGRAM",    3),
            ("SENT",     "PROGRAM",      "LOGISTICS",  4),
        ],
    },
    {
        "number":       "TK-2024-004",
        "equipment":    "EQ-MOTO-002",
        "employee":     "EMP-012",
        "status":       "IN_PROGRESS",
        "stage":        "REPAIRER",
        "description":  "Probleme de demarrage moteur. Bruit anormal a l'acceleration.",
        "problems":     ["MOTEUR"],
        "days_ago":     20,
        "events": [
            ("SENT",     "",             "SUPERVISOR", 0),
            ("RECEIVED", "",             "SUPERVISOR", 1),
            ("SENT",     "SUPERVISOR",   "PROGRAM",    2),
            ("RECEIVED", "SUPERVISOR",   "PROGRAM",    3),
            ("SENT",     "PROGRAM",      "LOGISTICS",  5),
            ("RECEIVED", "PROGRAM",      "LOGISTICS",  6),
            ("SENT",     "LOGISTICS",    "REPAIRER",   7),
        ],
    },
    {
        "number":       "TK-2024-005",
        "equipment":    "EQ-MOTO-003",
        "employee":     "EMP-013",
        "status":       "IN_PROGRESS",
        "stage":        "PROGRAM",
        "description":  "Freins defaillants, pneu arriere creve lors d'une visite",
        "problems":     ["FREIN", "PNEU_CREVAISON"],
        "days_ago":     8,
        "events": [
            ("SENT",     "",             "SUPERVISOR", 0),
            ("RECEIVED", "",             "SUPERVISOR", 1),
            ("SENT",     "SUPERVISOR",   "PROGRAM",    2),
        ],
    },
    {
        "number":       "TK-2024-006",
        "equipment":    "EQ-LAP-002",
        "employee":     "EMP-016",
        "status":       "IN_PROGRESS",
        "stage":        "ESANTE",
        "description":  "Systeme Windows corrompu. Impossible de demarrer normalement.",
        "problems":     ["OS_CORROMPU"],
        "days_ago":     15,
        "events": [
            ("SENT",     "",             "SUPERVISOR", 0),
            ("RECEIVED", "",             "SUPERVISOR", 1),
            ("SENT",     "SUPERVISOR",   "PROGRAM",    2),
            ("RECEIVED", "SUPERVISOR",   "PROGRAM",    3),
            ("SENT",     "PROGRAM",      "LOGISTICS",  4),
            ("RECEIVED", "PROGRAM",      "LOGISTICS",  5),
            ("SENT",     "LOGISTICS",    "REPAIRER",   6),
            ("RECEIVED", "LOGISTICS",    "REPAIRER",   8),
            ("SENT",     "REPAIRER",     "ESANTE",    10),
        ],
    },
    {
        "number":       "TK-2024-007",
        "equipment":    "EQ-LAP-001",
        "employee":     "EMP-015",
        "status":       "IN_PROGRESS",
        "stage":        "LOGISTICS",
        "description":  "Port USB defaillant et clavier partiellement non fonctionnel",
        "problems":     ["CONNECTEUR", "CLAVIER_BTN"],
        "days_ago":     10,
        "events": [
            ("SENT",     "",             "SUPERVISOR", 0),
            ("RECEIVED", "",             "SUPERVISOR", 1),
            ("SENT",     "SUPERVISOR",   "PROGRAM",    2),
            ("RECEIVED", "SUPERVISOR",   "PROGRAM",    3),
            ("SENT",     "PROGRAM",      "LOGISTICS",  4),
        ],
    },
    # ── RETURNING ──────────────────────────────────────────────────────────────
    {
        "number":       "TK-2024-008",
        "equipment":    "EQ-TEL-008",
        "employee":     "EMP-008",
        "status":       "RETURNING",
        "stage":        "RETURNING_LOGISTICS",
        "description":  "Ecran fissure apres chute lors d'une visite de routine",
        "problems":     ["ECRAN_CASSE"],
        "days_ago":     30,
        "resolution_notes": "Remplacement ecran effectue. Appareil teste et valide fonctionnel.",
        "events": [
            ("SENT",     "",                     "SUPERVISOR",           0),
            ("RECEIVED", "",                     "SUPERVISOR",           1),
            ("SENT",     "SUPERVISOR",            "PROGRAM",              2),
            ("RECEIVED", "SUPERVISOR",            "PROGRAM",              3),
            ("SENT",     "PROGRAM",               "LOGISTICS",            4),
            ("RECEIVED", "PROGRAM",               "LOGISTICS",            5),
            ("SENT",     "LOGISTICS",             "REPAIRER",             6),
            ("RECEIVED", "LOGISTICS",             "REPAIRER",             8),
            ("SENT",     "REPAIRER",              "ESANTE",              15),
            ("RECEIVED", "REPAIRER",              "ESANTE",              16),
            ("SENT",     "ESANTE",                "RETURNING_LOGISTICS", 17),
        ],
    },
    # ── CLOSED ─────────────────────────────────────────────────────────────────
    {
        "number":       "TK-2023-001",
        "equipment":    "EQ-TEL-001",
        "employee":     "EMP-001",
        "status":       "CLOSED",
        "stage":        "RETURNED_ASC",
        "description":  "Batterie ne tenait plus la charge apres 1 an d'utilisation",
        "problems":     ["BATT_DEF"],
        "days_ago":     120,
        "resolution_notes": "Remplacement batterie effectue. Equipement retourne a l'agent.",
        "events": [
            ("SENT",     "",                      "SUPERVISOR",           0),
            ("RECEIVED", "",                      "SUPERVISOR",           1),
            ("SENT",     "SUPERVISOR",             "PROGRAM",              2),
            ("RECEIVED", "SUPERVISOR",             "PROGRAM",              3),
            ("SENT",     "PROGRAM",                "LOGISTICS",            4),
            ("RECEIVED", "PROGRAM",                "LOGISTICS",            5),
            ("SENT",     "LOGISTICS",              "REPAIRER",             6),
            ("RECEIVED", "LOGISTICS",              "REPAIRER",             8),
            ("SENT",     "REPAIRER",               "ESANTE",              14),
            ("RECEIVED", "REPAIRER",               "ESANTE",              15),
            ("SENT",     "ESANTE",                 "RETURNING_LOGISTICS", 16),
            ("RECEIVED", "ESANTE",                 "RETURNING_LOGISTICS", 17),
            ("SENT",     "RETURNING_LOGISTICS",    "RETURNING_PROGRAM",   18),
            ("RECEIVED", "RETURNING_LOGISTICS",    "RETURNING_PROGRAM",   19),
            ("SENT",     "RETURNING_PROGRAM",      "RETURNING_SUPERVISOR",20),
            ("RECEIVED", "RETURNING_PROGRAM",      "RETURNING_SUPERVISOR",21),
            ("SENT",     "RETURNING_SUPERVISOR",   "RETURNED_ASC",        22),
        ],
    },
    {
        "number":       "TK-2023-002",
        "equipment":    "EQ-TAB-001",
        "employee":     "EMP-009",
        "status":       "CLOSED",
        "stage":        "RETURNED_ASC",
        "description":  "Ecran tactile non reactif, impossible d'utiliser l'application",
        "problems":     ["ECRAN_CASSE"],
        "days_ago":     90,
        "resolution_notes": "Remplacement ecran tactile effectue. Teste fonctionnel.",
        "events": [
            ("SENT",     "",                      "SUPERVISOR",           0),
            ("RECEIVED", "",                      "SUPERVISOR",           1),
            ("SENT",     "SUPERVISOR",             "PROGRAM",              2),
            ("RECEIVED", "SUPERVISOR",             "PROGRAM",              3),
            ("SENT",     "PROGRAM",                "LOGISTICS",            4),
            ("RECEIVED", "PROGRAM",                "LOGISTICS",            5),
            ("SENT",     "LOGISTICS",              "REPAIRER",             6),
            ("RECEIVED", "LOGISTICS",              "REPAIRER",             8),
            ("SENT",     "REPAIRER",               "ESANTE",              13),
            ("RECEIVED", "REPAIRER",               "ESANTE",              14),
            ("SENT",     "ESANTE",                 "RETURNING_LOGISTICS", 15),
            ("RECEIVED", "ESANTE",                 "RETURNING_LOGISTICS", 16),
            ("SENT",     "RETURNING_LOGISTICS",    "RETURNING_PROGRAM",   17),
            ("RECEIVED", "RETURNING_LOGISTICS",    "RETURNING_PROGRAM",   18),
            ("SENT",     "RETURNING_PROGRAM",      "RETURNING_SUPERVISOR",19),
            ("RECEIVED", "RETURNING_PROGRAM",      "RETURNING_SUPERVISOR",20),
            ("SENT",     "RETURNING_SUPERVISOR",   "RETURNED_ASC",        21),
        ],
    },
    {
        "number":       "TK-2023-003",
        "equipment":    "EQ-MOTO-001",
        "employee":     "EMP-011",
        "status":       "CLOSED",
        "stage":        "RETURNED_ASC",
        "description":  "Moto ne demarre plus, batterie completement decharge, bougies usees",
        "problems":     ["NO_POWER"],
        "days_ago":     60,
        "resolution_notes": "Remplacement batterie et bougies. Moto retournee et fonctionnelle.",
        "events": [
            ("SENT",     "",                      "SUPERVISOR",           0),
            ("RECEIVED", "",                      "SUPERVISOR",           1),
            ("SENT",     "SUPERVISOR",             "PROGRAM",              2),
            ("RECEIVED", "SUPERVISOR",             "PROGRAM",              3),
            ("SENT",     "PROGRAM",                "LOGISTICS",            4),
            ("RECEIVED", "PROGRAM",                "LOGISTICS",            5),
            ("SENT",     "LOGISTICS",              "REPAIRER",             6),
            ("RECEIVED", "LOGISTICS",              "REPAIRER",             8),
            ("SENT",     "REPAIRER",               "ESANTE",              13),
            ("RECEIVED", "REPAIRER",               "ESANTE",              14),
            ("SENT",     "ESANTE",                 "RETURNING_LOGISTICS", 15),
            ("RECEIVED", "ESANTE",                 "RETURNING_LOGISTICS", 16),
            ("SENT",     "RETURNING_LOGISTICS",    "RETURNING_PROGRAM",   17),
            ("RECEIVED", "RETURNING_LOGISTICS",    "RETURNING_PROGRAM",   18),
            ("SENT",     "RETURNING_PROGRAM",      "RETURNING_SUPERVISOR",19),
            ("RECEIVED", "RETURNING_PROGRAM",      "RETURNING_SUPERVISOR",20),
            ("SENT",     "RETURNING_SUPERVISOR",   "RETURNED_ASC",        21),
        ],
    },
    # ── CANCELLED ──────────────────────────────────────────────────────────────
    {
        "number":       "TK-2024-009",
        "equipment":    "EQ-TEL-005",
        "employee":     "EMP-005",
        "status":       "CANCELLED",
        "stage":        "SUPERVISOR",
        "description":  "Telephone signale lent mais finalement fonctionnel apres redemarrage",
        "problems":     ["LENTEUR"],
        "days_ago":     7,
        "cancellation_reason": "Telephone fonctionne normalement apres redemarrage force.",
        "events": [
            ("SENT",      "", "SUPERVISOR", 0),
            ("CANCELLED", "", "SUPERVISOR", 1),
        ],
    },
]


def seed_tickets():
    from backend.src.modules.equipments.models.equipment import Equipment
    from backend.src.app.models.f_employee import Employee
    from backend.src.app.configs.extensions import db
    from datetime import timedelta

    eq_map  = {e.equipment_code: e for e in Equipment.query.all() if e.equipment_code}
    emp_map = {e.employee_id_code: e for e in Employee.query.all() if e.employee_id_code}
    pt_map  = {p.code: p for p in ProblemType.query.all()}

    created_total = 0
    for t in TICKETS_DATA:
        if RepairTicket.query.filter_by(ticket_number=t["number"]).first():
            continue

        eq  = eq_map.get(t["equipment"])
        emp = emp_map.get(t["employee"])
        if not eq or not emp:
            logger.warning(f"[seed_tickets] skip {t['number']}: equipment ou employee introuvable")
            continue

        base_ts = datetime.now(timezone.utc) - timedelta(days=t["days_ago"])

        ticket = RepairTicket(
            ticket_number=t["number"],
            equipment_id=eq.id,
            employee_id=emp.id,
            status=t["status"],
            current_stage=t["stage"],
            initial_problem_description=t["description"],
            initial_send_date=base_ts,
            resolution_notes=t.get("resolution_notes", ""),
            cancellation_reason=t.get("cancellation_reason", ""),
        )
        if t["status"] == "CLOSED":
            ticket.closed_date = base_ts + timedelta(days=22)
            ticket.repair_completed_date = base_ts + timedelta(days=14)
        if t["status"] in ("RETURNING", "REPAIRED"):
            ticket.repair_completed_date = base_ts + timedelta(days=15)
        if t["status"] == "CANCELLED":
            ticket.cancelled_date = base_ts + timedelta(days=1)

        db.session.add(ticket)
        _flush()

        for pcode in t.get("problems", []):
            pt = pt_map.get(pcode)
            if pt:
                db.session.add(Issue(ticket_id=ticket.id, problem_type_id=pt.id))

        for event_type, from_role, to_role, day_delta in t.get("events", []):
            db.session.add(TicketEvent(
                ticket_id=ticket.id,
                event_type=event_type,
                from_role=from_role,
                to_role=to_role,
                timestamp=base_ts + timedelta(days=day_delta),
            ))

        _flush()
        created_total += 1

    _commit()
    logger.info(f"[seed_tickets] {created_total} enregistrements créés")
    return created_total


# ─────────────────────────────────────────────────────────────────────────────
# ORCHESTRATEUR
# ─────────────────────────────────────────────────────────────────────────────

SEEDERS = {
    "locations":     seed_locations,
    "positions":     seed_positions,
    "categories":    seed_categories,
    "brands":        seed_brands,
    "problem-types": seed_problem_types,
    "alert-config":  seed_alert_config,
    "employees":     seed_employees,
    "equipment":     seed_equipment,
    "tickets":       seed_tickets,
}

# Ordre respectant les FK
SEED_ORDER = [
    "locations",
    "positions",
    "categories",
    "brands",
    "problem-types",
    "alert-config",
    "employees",
    "equipment",
    "tickets",
]


def seed_all():
    """Lance tous les seeders dans l'ordre correct."""
    total = 0
    for name in SEED_ORDER:
        fn = SEEDERS[name]
        logger.info(f"▶ Seeding [{name}]…")
        try:
            n = fn()
            total += n or 0
            logger.info(f"  ✓ [{name}] — {n} créés")
        except Exception as e:
            from backend.src.app.configs.extensions import db
            db.session.rollback()
            logger.error(f"  ✗ [{name}] ERREUR : {e}", exc_info=True)
            raise
    logger.info(f"✅ Seed terminé — {total} enregistrements créés au total")
    return total
