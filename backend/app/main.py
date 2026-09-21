from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import DATABASE_URL


app = FastAPI(title="Bar-Abrechnung API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root() -> dict[str, str]:
    return {
        "name": "Bar-Abrechnung API",
        "status": "running",
        "database": DATABASE_URL,
    }


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}
