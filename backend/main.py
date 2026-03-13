import os
from typing import List, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import Boolean, Column, Integer, String, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session, sessionmaker

# 加载环境变量
load_dotenv()

# --------------------------
# SQLAlchemy 配置
# --------------------------
# 从环境变量获取数据库URL（Render部署时用Internal URL，本地测试用External URL）
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/todo_db")

# 创建引擎（适配Render PostgreSQL）
engine = create_engine(
    DATABASE_URL,
    # 解决Render PostgreSQL连接问题的关键配置
    pool_pre_ping=True,
    pool_recycle=300,
)
# 创建会话
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
# 基类
Base = declarative_base()


# --------------------------
# 数据库模型（Todo表）
# --------------------------
class TodoDB(Base):
    __tablename__ = "todos"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String, nullable=False)
    completed = Column(Boolean, default=False)


# 创建表（首次运行自动创建）
Base.metadata.create_all(bind=engine)

# --------------------------
# FastAPI 配置
# --------------------------
app = FastAPI(title="Todo API (Render PostgreSQL + SQLAlchemy)", version="1.0")

# 跨域配置（替换为你的GitHub Pages地址）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://你的GitHub用户名.github.io"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------
# Pydantic 模型（前后端交互）
# --------------------------
class Todo(BaseModel):
    id: Optional[int] = None
    title: str
    completed: bool = False

    class Config:
        orm_mode = True


# --------------------------
# 数据库依赖（获取会话）
# --------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# --------------------------
# API 接口（CRUD）
# --------------------------
# 1. 获取所有Todo
@app.get("/api/todos", response_model=List[Todo])
def get_todos(db: Session = next(get_db())):
    todos = db.query(TodoDB).all()
    return todos


# 2. 添加新Todo
@app.post("/api/todos", response_model=Todo)
def create_todo(todo: Todo, db: Session = next(get_db())):
    db_todo = TodoDB(title=todo.title, completed=todo.completed)
    db.add(db_todo)
    db.commit()
    db.refresh(db_todo)
    return db_todo


# 3. 更新Todo状态
@app.put("/api/todos/{todo_id}", response_model=Todo)
def update_todo(todo_id: int, completed: bool, db: Session = next(get_db())):
    db_todo = db.query(TodoDB).filter(TodoDB.id == todo_id).first()
    if not db_todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    db_todo.completed = completed
    db.commit()
    db.refresh(db_todo)
    return db_todo


# 4. 删除Todo
@app.delete("/api/todos/{todo_id}")
def delete_todo(todo_id: int, db: Session = next(get_db())):
    db_todo = db.query(TodoDB).filter(TodoDB.id == todo_id).first()
    if not db_todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    db.delete(db_todo)
    db.commit()
    return {"message": "Todo deleted successfully"}
