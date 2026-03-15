import TodoItem from "./TodoItem";

function TodoList({ state, handlers }) {
  const { loading, todos, editingTodoId, editingTodoTitle } = state;

  if (loading) {
    return <p className="loading">加载中...</p>;
  }

  if (todos.length === 0) {
    return <p className="empty-tip">暂无待办事项，添加一个开始吧！</p>;
  }

  return (
    <div className="todo-list">
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          state={{
            loading,
            isEditing: editingTodoId === todo.id,
            editingTitle: editingTodoTitle,
          }}
          handlers={handlers}
        />
      ))}
    </div>
  );
}

export default TodoList;
