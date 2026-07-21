# 🚀 SAN AI Interview Preparation Platform

> **Prepare. Practice. Perform. Get Hired.**

SAN AI Interview Preparation is a 100% production-ready enterprise SaaS application designed to help students and professionals prepare for job placements using Artificial Intelligence.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 15 (App Router) & React 19 (TypeScript)
- **Styling**: Tailwind CSS & Framer Motion (Glassmorphic animations)
- **State Management**: Zustand
- **Query Caching**: TanStack Query & Axios
- **Charts**: Recharts SVG metrics

### Backend (Python)
- **Framework**: FastAPI (Python 3.13)
- **Database ORM**: SQLAlchemy 2.0 (PostgreSQL)
- **Migration Engine**: Alembic
- **Task Broker**: Redis & Celery
- **Authentication**: JWT Access/Refresh tokens & bcrypt password hashing
- **Real-time Engine**: WebSockets

### AI Integration
- **LLM APIs**: OpenAI-compatible client interface (supporting GPT-4o and Local LLMs like Ollama/vLLM)
- **Speech Parsing**: Whisper STT compatible audio evaluation

---

## 📦 Project Structure

```
SAN-AI-Interview-Preparation/
├── backend/
│   ├── app/
│   │   ├── main.py         # Entrypoint FastAPI
│   │   ├── core/           # Database configuration, Security cryptography
│   │   ├── models/         # SQLAlchemy 2.0 tables
│   │   ├── schemas/        # Pydantic v2 schemas
│   │   ├── repositories/   # User and Profile CRUD repositories
│   │   ├── services/       # Resume parser and Interview workflow business services
│   │   ├── ai/             # LLM OpenAI and Whisper client interfaces
│   │   ├── websocket/      # Websocket connection router
│   │   └── workers/        # Celery asynchronous task queues
│   ├── tests/              # Pytest endpoint and database tests
│   └── requirements.txt
├── frontend/
│   ├── app/                # App router (dashboard, resume upload, setup, interview, reports)
│   ├── store/              # Zustand global client stores
│   ├── lib/                # API client with token interception
│   └── package.json
├── docker-compose.yml      # Service composition orchestrator
└── README.md
```

---

## ⚙️ Setup & Installation

### 1. Set Up Environment Configuration
Clone the configuration file in the project root:
```bash
cp .env.example .env
```

Review and adjust variables in the `.env` file:
```ini
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/san_ai_db
SECRET_KEY=generate-a-64-character-hex-key-here
REDIS_URL=redis://localhost:6379/0
OPENAI_API_KEY=your-openai-api-key
```

### 2. Running Local Services

#### Start Backend (Python)
Inside the `backend/` directory:
```bash
# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # Or venv\Scripts\activate on Windows

# Install packages
pip install -r requirements.txt

# Run server
uvicorn app.main:app --reload --port 8000
```
API docs will be available at `http://localhost:8000/docs` (Swagger UI).

#### Start Frontend (Next.js)
Inside the `frontend/` directory:
```bash
# Install packages
npm install

# Run dev server
npm run dev
```
Open `http://localhost:3000` in your web browser.

---

## 🐳 Docker Deployment
To build and spin up the complete multi-container stack (FastAPI, Next.js, PostgreSQL, Redis, and Celery):
```bash
docker-compose up --build
```
This mounts local directories for hot-reloading in development and persists database logs on the `postgres_data` volume.

---

## 🧪 Running Tests
You can run automated endpoints checks using pytest:
```bash
cd backend
pytest -v
```
