# Bar-Abrechnung

Web-App zur einfachen Schicht- und Kassenabrechnung einer Bar.

## Struktur

```text
bar-abrechnung/
├── frontend/
├── backend/
├── README.md
└── .gitignore
```

## Frontend starten

```bash
cd frontend
npm install
npm run dev
```

Das Frontend laeuft standardmaessig unter `http://localhost:5173`.

## Frontend auf Vercel deployen

Vercel ist fuer `frontend` als Root Directory konfiguriert. Dadurch wird nur das Frontend gebaut:

- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: `dist`

## Backend

Ein FastAPI-Grundgeruest ist vorhanden, wird fuer die aktuelle Version aber nicht benoetigt. Alle Berechnungen laufen im Frontend.

Falls du das Backend trotzdem starten moechtest:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Das Backend laeuft standardmaessig unter `http://127.0.0.1:8000`.

## Aktueller Funktionsumfang

- Eingabe des abzugebenden Betrags
- Eingabe des Umsatzes als Bargeldbestand nach der Schicht
- 2 bis 6 Mitarbeiter
- automatische Arbeitszeitberechnung inklusive Schichten ueber Mitternacht
- optionale Barlohnauszahlung pro Mitarbeiter
- automatische Trinkgeldberechnung nach Arbeitsstunden
- Warnungen bei fehlenden Zeiten, fehlenden Arbeitsstunden und zu hoher Barlohnsumme
