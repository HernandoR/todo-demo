function AddTodoForm({ form, handlers }) {
  const { value, loading } = form;
  const { onValueChange, onSubmit } = handlers;

  return (
    <form onSubmit={onSubmit} className="add-todo-form">
      <input
        type="text"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder="输入新的待办事项..."
        className="todo-input"
        disabled={loading}
      />
      <button
        type="submit"
        className="add-btn"
        disabled={loading || !value.trim()}
      >
        添加
      </button>
    </form>
  );
}

export default AddTodoForm;
