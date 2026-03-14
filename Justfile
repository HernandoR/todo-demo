start-backend:
    cd backend && uv run uvicorn main:app --reload

start-frontend:
    cd frontend/react-todo-frontend && npm run dev