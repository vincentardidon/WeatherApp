# Weather Dashboard

## Run locally

Backend (terminal 1):

```powershell
cd backend
Copy-Item .env.example .env
npm install
npm run dev
```

Frontend (terminal 2):

```powershell
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5173
Backend health check: http://localhost:5000/api/health