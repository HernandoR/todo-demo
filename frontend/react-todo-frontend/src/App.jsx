import { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";
import AddTodoForm from "./components/AddTodoForm";
import ConnectionError from "./components/ConnectionError";
import TodoList from "./components/TodoList";

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
  const [editingTodoId, setEditingTodoId] = useState(null);
  const [editingTodoTitle, setEditingTodoTitle] = useState("");
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
      await fetchTodos(); // 连接成功则加载数据
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
      const response = await api.put(`/todos/${id}`, { completed: !completed });
      setTodos(todos.map((todo) => (todo.id === id ? response.data : todo)));
    } catch (error) {
      console.error("更新Todo失败:", error);
    }
  };

  // 进入编辑模式
  const startEditingTodo = (todo) => {
    setEditingTodoId(todo.id);
    setEditingTodoTitle(todo.title);
  };

  // 取消编辑
  const cancelEditingTodo = () => {
    setEditingTodoId(null);
    setEditingTodoTitle("");
  };

  // 保存Todo标题
  const saveTodoTitle = async (id) => {
    const currentTodo = todos.find((todo) => todo.id === id);
    if (!currentTodo) return;

    const title = editingTodoTitle.trim();
    if (!title) return;
    if (title === currentTodo.title.trim()) {
      cancelEditingTodo();
      return;
    }

    try {
      const response = await api.put(`/todos/${id}`, { title });
      setTodos(todos.map((todo) => (todo.id === id ? response.data : todo)));
      cancelEditingTodo();
    } catch (error) {
      console.error("编辑Todo失败:", error);
    }
  };

  // 删除Todo
  const deleteTodo = async (id) => {
    if (!window.confirm("确定要删除这个待办吗？")) return;

    try {
      await api.delete(`/todos/${id}`);
      setTodos(todos.filter((todo) => todo.id !== id));
      if (editingTodoId === id) {
        cancelEditingTodo();
      }
    } catch (error) {
      console.error("删除Todo失败:", error);
    }
  };

  const addTodoForm = {
    value: newTodoTitle,
    loading,
  };

  const addTodoHandlers = {
    onValueChange: setNewTodoTitle,
    onSubmit: addTodo,
  };

  const todoListState = {
    loading,
    todos,
    editingTodoId,
    editingTodoTitle,
  };

  const todoListHandlers = {
    onEditingTitleChange: setEditingTodoTitle,
    onToggle: toggleTodo,
    onStartEdit: startEditingTodo,
    onSave: saveTodoTitle,
    onCancel: cancelEditingTodo,
    onDelete: deleteTodo,
  };

  return (
    <div className="app-container">
      {isConnected ? (
        <>
          <h1>📝 个人待办事项管理</h1>
          <AddTodoForm form={addTodoForm} handlers={addTodoHandlers} />
          <TodoList state={todoListState} handlers={todoListHandlers} />
        </>
      ) : (
        <ConnectionError loading={loading} onRetry={checkBackendConnection} />
      )}
    </div>
  );
}

export default App;
