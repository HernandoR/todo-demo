function TodoItem({ todo, state, handlers }) {
  const { loading, isEditing, editingTitle } = state;
  const {
    onEditingTitleChange,
    onToggle,
    onStartEdit,
    onSave,
    onCancel,
    onDelete,
  } = handlers;

  const isSameTitle = editingTitle.trim() === todo.title.trim();

  return (
    <div className={`todo-item ${todo.completed ? "completed" : ""}`}>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id, todo.completed)}
        disabled={loading || isEditing}
      />
      {isEditing ? (
        <input
          type="text"
          value={editingTitle}
          onChange={(e) => onEditingTitleChange(e.target.value)}
          className="edit-input"
          disabled={loading}
        />
      ) : (
        <span className="todo-title">{todo.title}</span>
      )}
      <div className="todo-actions">
        {isEditing ? (
          <>
            <button
              onClick={() => onSave(todo.id)}
              className="edit-btn save-btn"
              disabled={loading || !editingTitle.trim() || isSameTitle}
            >
              保存
            </button>
            <button
              onClick={onCancel}
              className="edit-btn cancel-btn"
              disabled={loading}
            >
              取消
            </button>
          </>
        ) : (
          <button
            onClick={() => onStartEdit(todo)}
            className="edit-btn"
            disabled={loading}
          >
            编辑
          </button>
        )}
        <button
          onClick={() => onDelete(todo.id)}
          className="delete-btn"
          disabled={loading}
        >
          删除
        </button>
      </div>
    </div>
  );
}

export default TodoItem;
