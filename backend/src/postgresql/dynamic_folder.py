import os
from pathlib import Path
import shutil


use_rollback_case_one = True


def dynamic_folder(folder_name: str, count: int, interval: int) -> None:
    """
    Crée un dossier principal dans le même répertoire que ce fichier,
    avec des sous-dossiers espacés par `interval`.
    :param folder_name: Nom du dossier principal
    :param count: Nombre de sous-dossiers
    :param interval: Intervalle numérique
    """

    if not isinstance(folder_name, str) or not folder_name.strip():
        raise ValueError("folder_name must be a non-empty string")

    if not isinstance(count, int) or count <= 0:
        raise ValueError("count must be a positive integer")

    if not isinstance(interval, int) or interval <= 0:
        raise ValueError("interval must be a positive integer")

    # 📌 Dossier où se trouve ce fichier Python
    current_dir = Path(__file__).resolve().parent

    base_path = current_dir / folder_name.strip()

    try:

        # 🔴 Si le dossier principal existe → on arrête tout
        if not base_path.exists():
            # Création du dossier principal
            base_path.mkdir(parents=True, exist_ok=False)
            print(f"✔ Successfully created '{folder_name}'.")
        else:
            # raise FileExistsError(f"Folder '{folder_name}' already exists.")
            pass

        created = 0
        # Création des sous-dossiers
        for i in range(1, count + 1):
            subfolder_value = i * interval
            subfolder_path = base_path / str(subfolder_value)
            if not subfolder_path.exists():
                subfolder_path.mkdir(exist_ok=False)
                created+=1
            else:
                # raise FileExistsError(f"Subfolder '{subfolder_value}' already exists.")
                pass
        
        if created > 0:
            print(f"✔ Successfully created '{folder_name}' with {count} subfolders.")

    except Exception as e:
        # Rollback si erreur → supprime le dossier principal créé partiellement
        # if base_path.exists():
        #     if use_rollback_case_one:
        #         shutil.rmtree(base_path)
        #     else:
        #         for child in base_path.iterdir():
        #             if child.is_dir():
        #                 child.rmdir()
        #         base_path.rmdir()
        print(str(e))
        raise


dynamic_folder("kendeya",10,52)