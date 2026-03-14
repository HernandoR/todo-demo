start-backend:
    cd backend && uv run uvicorn main:app --reload

start-frontend:
    cd frontend && npm run dev