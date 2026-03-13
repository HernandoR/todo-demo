import { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

// 配置axios：开发环境用代理，生产环境用Render后端地址
const api = axios.create({
  // 替换为你的Render后端地址（比如https://todo-backend.onrender.com）
  baseURL: import.meta.env.DEV ? "/api" : "https://你的Render后端地址/api",
});

// 请求拦截器：处理通用错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    alert(`请求失败：${error.response?.data?.detail || "网络错误"}`);
    return Promise.reject(error);
  },
);

function App() {
  // 状态管理
  const [todos, setTodos] = useState([]);
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [loading, setLoading] = useState(true);

  // 加载所有Todo
  useEffect(() => {
    fetchTodos();
  }, []);

  // 获取Todo列表
  const fetchTodos = async () => {
    setLoading(true);
    try {
      const response = await api.get("/todos");
      setTodos(response.data);
    } catch (error) {
      console.error("加载Todo失败:", error);
    } finally {
      setLoading(false);
    }
  };

  // 添加新Todo
  const addTodo = async (e) => {
    e.preventDefault();
    const title = newTodoTitle.trim();
    if (!title) return;

    try {
      const response = await api.post("/todos", { title, completed: false });
      setTodos([...todos, response.data]);
      setNewTodoTitle("");
    } catch (error) {
      console.error("添加Todo失败:", error);
    }
  };

  // 切换Todo完成状态
  const toggleTodo = async (id, completed) => {
    try {
      await api.put(`/todos/${id}`, { completed: !completed });
      setTodos(
        todos.map((todo) =>
          todo.id === id ? { ...todo, completed: !completed } : todo,
        ),
      );
    } catch (error) {
      console.error("更新Todo失败:", error);
    }
  };

  // 删除Todo
  const deleteTodo = async (id) => {
    if (!window.confirm("确定要删除这个待办吗？")) return;

    try {
      await api.delete(`/todos/${id}`);
      setTodos(todos.filter((todo) => todo.id !== id));
    } catch (error) {
      console.error("删除Todo失败:", error);
    }
  };

  return (
    <div className="app-container">
      <h1>📝 个人待办事项管理</h1>

      {/* 添加Todo表单 */}
      <form onSubmit={addTodo} className="add-todo-form">
        <input
          type="text"
          value={newTodoTitle}
          onChange={(e) => setNewTodoTitle(e.target.value)}
          placeholder="输入新的待办事项..."
          className="todo-input"
          disabled={loading}
        />
        <button
          type="submit"
          className="add-btn"
          disabled={loading || !newTodoTitle.trim()}
        >
          添加
        </button>
      </form>

      {/* Todo列表 */}
      <div className="todo-list">
        {loading ? (
          <p className="loading">加载中...</p>
        ) : todos.length === 0 ? (
          <p className="empty-tip">暂无待办事项，添加一个开始吧！</p>
        ) : (
          todos.map((todo) => (
            <div
              key={todo.id}
              className={`todo-item ${todo.completed ? "completed" : ""}`}
            >
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleTodo(todo.id, todo.completed)}
                disabled={loading}
              />
              <span>{todo.title}</span>
              <button
                onClick={() => deleteTodo(todo.id)}
                className="delete-btn"
                disabled={loading}
              >
                删除
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default App;
