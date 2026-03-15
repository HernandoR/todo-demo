function ConnectionError({ loading, onRetry }) {
  return (
    <div className="connection-error">
      <div className="error-icon">❌</div>
      <h2>无法连接到后端服务</h2>
      <p>可能的原因：</p>
      <ul className="error-reasons">
        <li>后端服务未启动或已休眠（Render免费版15分钟无请求会休眠）</li>
        <li>网络连接问题</li>
        <li>后端地址配置错误</li>
      </ul>
      <button className="retry-btn" onClick={onRetry} disabled={loading}>
        {loading ? "重试中..." : "重试连接"}
      </button>
      <p className="hint">提示：Render免费后端休眠后需要 2 min 左右 重新唤醒</p>
    </div>
  );
}

export default ConnectionError;
