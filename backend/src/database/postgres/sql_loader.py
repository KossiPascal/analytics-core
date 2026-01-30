import os


BASE_SQL_FOLDER = os.path.dirname(__file__)

def get_sql_file_content(view_name: str, folder: str | None = None) -> str:

    if not view_name or not isinstance(view_name, str):
        raise ValueError("Nom de fichier SQL invalide")

    folder = "./" if not folder else folder

    view_name = view_name.strip("/\\")
    folder = folder.strip("/\\")

    # base = BASE_SQL_FOLDER / "postgres"
    base = BASE_SQL_FOLDER
    folder_path = os.path.join(base, folder) if folder else base
    file_path = os.path.join(folder_path, f"{view_name}.sql")

    if not os.path.exists(file_path):
        raise FileNotFoundError(f"SQL file not found: {file_path}")
    
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()
    except Exception as e:
        raise FileNotFoundError(f"Erreur lors de la lecture du fichier SQL '{file_path}': ${e}")

