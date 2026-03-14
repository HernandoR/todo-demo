import { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

const api = axios.create({
  baseURL: "/api",
  timeout: 5000, // 5秒超时
});

// 请求拦截器：处理通用错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 所有请求失败都标记为连接断开
    if (error.code === "ECONNABORTED" || !error.response) {
      window.appSetConnected(false); // 全局方法标记连接状态
    }
    alert(
      `请求失败：${error.response?.data?.detail || "网络错误/后端服务不可用"}`,
    );
    return Promise.reject(error);
  },
);

function App() {
  // 核心状态
  const [todos, setTodos] = useState([]);
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(true); // 后端连接状态

  // 把连接状态方法挂载到window，供拦截器调用
  useEffect(() => {
    window.appSetConnected = setIsConnected;
    return () => {
      delete window.appSetConnected;
    };
  }, []);

  // 初始化：先检测后端连接，再加载数据
  useEffect(() => {
    checkBackendConnection();
  }, []);

  // 检测后端连接可用性
  const checkBackendConnection = async () => {
    setLoading(true);
    setIsConnected(true);
    try {
      // 测试请求：获取Todo列表（也可以单独写个健康检查接口）
      await api.get("/todos");
      fetchTodos(); // 连接成功则加载数据
    } catch (error) {
      setIsConnected(false);
      console.error("后端连接失败:", error);
    } finally {
      setLoading(false);
    }
  };

  // 获取Todo列表
  const fetchTodos = async () => {
    try {
      const response = await api.get("/todos");
      setTodos(response.data);
    } catch (error) {
      console.error("加载Todo失败:", error);
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

  // 兜底页面：连接失败时显示
  const renderConnectionError = () => (
    <div className="connection-error">
      <div className="error-icon">❌</div>
      <h2>无法连接到后端服务</h2>
      <p>可能的原因：</p>
      <ul className="error-reasons">
        <li>后端服务未启动或已休眠（Render免费版15分钟无请求会休眠）</li>
        <li>网络连接问题</li>
        <li>后端地址配置错误</li>
      </ul>
      <button
        className="retry-btn"
        onClick={() => checkBackendConnection()}
        disabled={loading}
      >
        {loading ? "重试中..." : "重试连接"}
      </button>
      <p className="hint">提示：Render免费后端首次访问可能需要10秒左右唤醒</p>
    </div>
  );

  // 正常页面：连接成功时显示
  const renderNormalContent = () => (
    <>
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
    </>
  );

  return (
    <div className="app-container">
      {isConnected ? renderNormalContent() : renderConnectionError()}
    </div>
  );
}

export default App;
