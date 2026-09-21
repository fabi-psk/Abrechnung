from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent
DATABASE_PATH = BASE_DIR / "bar_abrechnung.sqlite3"
DATABASE_URL = f"sqlite:///{DATABASE_PATH}"
