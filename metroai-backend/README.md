# MetroAI — Production Backend

Production-ready backend for **MetroAI (Delhi Metro Passenger Crowd Prediction System)** built with **FastAPI**, **PostgreSQL (SQLAlchemy)**, **Bcrypt & JWT (HTTP-Only cookies)**, and pre-trained **XGBoost** residual prediction models.

---

## 📁 Architecture & Folder Structure

```
metroai-backend/
├── app/
│   ├── core/
│   │   ├── config.py           # Pydantic environment settings & secrets
│   │   ├── database.py         # SQLAlchemy engine, sessionmaker, and Base
│   │   └── security.py         # Bcrypt hashing, JWT generation, HTTP-Only cookie dependencies
│   ├── models/                 # SQLAlchemy ORM database models
│   │   ├── user.py             # User (id, email, password_hash, role, created_at)
│   │   ├── station.py          # Station (station_id, name, lat, lon, line, gates, lifts...)
│   │   └── alert_log.py        # AlertLog (id, station_id, risk_level, predicted_inflow, timestamp)
│   ├── schemas/                # Pydantic v2 strict request & response models
│   │   ├── user.py             # UserCreate, UserLogin, UserOut, TokenOut
│   │   ├── station.py          # StationOut
│   │   ├── forecast.py         # PassengerForecastRequest, PassengerForecastResponse...
│   │   └── dashboard.py        # DashboardResponse, NetworkSummaryKPI, PriorityAlertItem...
│   ├── ml/
│   │   └── ml_service.py       # XGBoost residual model loader & inference engine
│   ├── routers/
│   │   ├── auth.py             # /auth/register, /auth/login (HTTP-Only Cookie), /auth/me, /auth/logout
│   │   ├── passenger.py        # /api/stations, /api/passenger/forecast/{id}, /api/forecast
│   │   └── admin.py            # /api/admin/dashboard (Protected), /api/stations/{id}/forecast, /api/stations/{id}/explanation
│   ├── services/
│   │   └── station_service.py  # GTFS clean_stops.csv loader and database seeder
│   └── main.py                 # FastAPI application, lifespan startup, CORS, and global 500 error handler
├── models_weights/             # Pre-trained XGBoost model JSON files
│   ├── xgb_residual_target_10m.json
│   ├── xgb_residual_target_20m.json
│   ├── xgb_residual_target_30m.json
│   └── xgb_features.json
├── requirements.txt            # Python dependencies
├── seed.py                     # Standalone database population script
└── .env.example                # Environment variable configuration template
```

---

## 🚀 Quickstart

### 1. Create Virtual Environment & Install Dependencies

```bash
cd metroai-backend
python -m venv venv

# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
```

### 2. Configure Environment

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

To use PostgreSQL, set:
```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/metroai_db
```
*(If no PostgreSQL database is running, it automatically defaults to `sqlite:///./metroai.db` for instant local testing without setup).*

### 3. Seed Database & Start Server

```bash
# Seed 262 stations and default admin:
python seed.py

# Start FastAPI server:
uvicorn app.main:app --reload --port 8000
```

Interactive API documentation available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

---

## 🔒 Security Implementation Details

1. **HTTP-Only Cookies for JWT**:
   - The `/auth/login` endpoint issues an `access_token` stored inside an HTTP-Only cookie (`SameSite=Lax`, `Secure` in production).
   - The token cannot be accessed by client-side JavaScript (`document.cookie`), preventing XSS credential theft.
2. **Role-Based Protection (`get_current_admin`)**:
   - `/api/admin/*` endpoints strictly require an active authenticated operator session (`role="admin"` or `role="operator"`).
3. **Safe Error Handling**:
   - A global exception handler intercepts all unhandled errors, logs the full stack trace to the server logs, and responds with a sanitized `{"detail": "Internal server error. Please contact support."}` without leaking database schemas or internal paths.
