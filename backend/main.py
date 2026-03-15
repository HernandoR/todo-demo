import os
import sys
from contextlib import asynccontextmanager
from typing import Annotated, Generator, List, Optional

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException
from loguru import logger
from pydantic import BaseModel, ConfigDict
from sqlalchemy import Boolean, Column, Integer, String, create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session, sessionmaker

# 加载环境变量
load_dotenv()

LOG_LEVEL = os.getenv("LOG_LEVEL", "DEBUG").upper()
logger.remove()
logger.add(
    sys.stderr,
    level=LOG_LEVEL,
    format="{time:YYYY-MM-DD HH:mm:ss.SSS} | {level} | {message}",
    enqueue=True,
)

# --------------------------
# SQLAlchemy 配置
# --------------------------
# 从环境变量获取数据库URL（Render部署时用Internal URL，本地测试用External URL）
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/todo_db")

# 连接池配置（复用后端连接，避免每次请求都重新建立TCP连接）
DB_POOL_SIZE = int(os.getenv("DB_POOL_SIZE", "5"))
DB_MAX_OVERFLOW = int(os.getenv("DB_MAX_OVERFLOW", "10"))
DB_POOL_TIMEOUT = int(os.getenv("DB_POOL_TIMEOUT", "30"))
DB_POOL_RECYCLE = int(os.getenv("DB_POOL_RECYCLE", "300"))

engine_kwargs = {
    "pool_pre_ping": True,
    "pool_recycle": DB_POOL_RECYCLE,
    "pool_size": DB_POOL_SIZE,
    "max_overflow": DB_MAX_OVERFLOW,
    "pool_timeout": DB_POOL_TIMEOUT,
    "pool_use_lifo": True,
}

if DATABASE_URL.startswith("postgresql"):
    # Keepalive减少空闲连接被网络中间层断开的概率
    engine_kwargs["connect_args"] = {
        "keepalives": 1,
        "keepalives_idle": 30,
        "keepalives_interval": 10,
        "keepalives_count": 5,
    }

# 创建引擎（适配Render PostgreSQL）
engine = create_engine(DATABASE_URL, **engine_kwargs)
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
@asynccontextmanager
async def lifespan(_app: FastAPI):
    # 服务启动时预热连接，并把连接放回连接池
    logger.info(
        "Starting backend with DB pool config: size={}, max_overflow={}, timeout={}, recycle={}",
        DB_POOL_SIZE,
        DB_MAX_OVERFLOW,
        DB_POOL_TIMEOUT,
        DB_POOL_RECYCLE,
    )
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    logger.debug("Database warmup query finished")

    try:
        yield
    finally:
        logger.info("Shutting down backend and disposing database engine")
        engine.dispose()


app = FastAPI(
    title="Todo API (Render PostgreSQL + SQLAlchemy)",
    version="1.0",
    lifespan=lifespan,
)

# # 跨域配置（替换为你的GitHub Pages地址）
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["https://你的GitHub用户名.github.io"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )


# --------------------------
# Pydantic 模型（前后端交互）
# --------------------------
class Todo(BaseModel):
    id: Optional[int] = None
    title: str
    completed: bool = False

    model_config = ConfigDict(from_attributes=True)


class TodoUpdate(BaseModel):
    title: Optional[str] = None
    completed: Optional[bool] = None


# --------------------------
# 数据库依赖（获取会话）
# --------------------------
def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    logger.debug("Created DB session: {}", id(db))
    try:
        yield db
    finally:
        db.close()
        logger.debug("Closed DB session: {}", id(db))


# --------------------------
# API 接口（CRUD）
# --------------------------
# 1. 获取所有Todo
@app.get("/api/todos", response_model=List[Todo])
def get_todos(
    db: Annotated[Session, Depends(get_db)],
):
    logger.debug("Handling GET /api/todos")
    todos = db.query(TodoDB).all()
    logger.debug("Fetched {} todos", len(todos))
    return todos


# 2. 添加新Todo
@app.post("/api/todos", response_model=Todo)
def create_todo(
    db: Annotated[Session, Depends(get_db)],
    todo: Todo,
):
    logger.debug("Handling POST /api/todos with title='{}'", todo.title)
    db_todo = TodoDB(title=todo.title, completed=todo.completed)
    db.add(db_todo)
    db.commit()
    db.refresh(db_todo)
    logger.debug("Created todo id={}", db_todo.id)
    return db_todo


# 3. 更新Todo内容/状态
@app.put("/api/todos/{todo_id}", response_model=Todo)
def update_todo(
    todo_id: int,
    db: Annotated[Session, Depends(get_db)],
    todo_update: TodoUpdate,
):
    logger.debug("Handling PUT /api/todos/{}", todo_id)
    db_todo = db.query(TodoDB).filter(TodoDB.id == todo_id).first()
    if not db_todo:
        logger.warning("Todo not found for update: id={}", todo_id)
        raise HTTPException(status_code=404, detail="Todo not found")

    if todo_update.title is None and todo_update.completed is None:
        raise HTTPException(
            status_code=400,
            detail="No fields to update. Provide title and/or completed.",
        )

    if todo_update.title is not None:
        title = todo_update.title.strip()
        if not title:
            logger.warning("Empty title provided for todo update: id={}", todo_id)
            raise HTTPException(status_code=400, detail="Title cannot be empty")
        db_todo.title = title

    if todo_update.completed is not None:
        db_todo.completed = todo_update.completed

    db.commit()
    db.refresh(db_todo)
    logger.debug("Updated todo id={} completed={}", db_todo.id, db_todo.completed)
    return db_todo


# 4. 删除Todo
@app.delete("/api/todos/{todo_id}")
def delete_todo(
    todo_id: int,
    db: Annotated[Session, Depends(get_db)],
):
    logger.debug("Handling DELETE /api/todos/{}", todo_id)
    db_todo = db.query(TodoDB).filter(TodoDB.id == todo_id).first()
    if not db_todo:
        logger.warning("Todo not found for delete: id={}", todo_id)
        raise HTTPException(status_code=404, detail="Todo not found")
    db.delete(db_todo)
    db.commit()
    logger.debug("Deleted todo id={}", todo_id)
    return {"message": "Todo deleted successfully"}
