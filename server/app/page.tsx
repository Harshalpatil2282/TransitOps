export default function Page() {
  return (
    <main style={{ fontFamily: "monospace", padding: "40px", background: "#0a0a0f", color: "#f59e0b", minHeight: "100vh" }}>
      <h1>🚛 TransitOps — Backend API Server</h1>
      <p style={{ color: "#9ca3af", marginTop: "8px" }}>
        This is the backend-only server. All endpoints are under <code>/api/</code>
      </p>
      <ul style={{ marginTop: "24px", color: "#d1d5db", lineHeight: "2" }}>
        <li>GET/POST <code>/api/vehicles</code></li>
        <li>GET/PATCH/DELETE <code>/api/vehicles/:id</code></li>
        <li>GET/POST <code>/api/drivers</code></li>
        <li>GET/PATCH/DELETE <code>/api/drivers/:id</code></li>
        <li>GET/POST <code>/api/trips</code></li>
        <li>GET/PATCH/DELETE <code>/api/trips/:id</code></li>
        <li>GET/POST <code>/api/maintenance</code></li>
        <li>GET/PATCH <code>/api/maintenance/:id</code></li>
        <li>GET/POST <code>/api/fuel</code> · DELETE <code>/api/fuel/:id</code></li>
        <li>GET/POST <code>/api/expenses</code> · DELETE <code>/api/expenses/:id</code></li>
        <li>GET <code>/api/dashboard</code></li>
        <li>GET <code>/api/analytics</code></li>
        <li>GET <code>/api/finance/summary</code></li>
        <li>GET <code>/api/users</code> · PATCH <code>/api/users/:id</code></li>
        <li>POST <code>/api/auth/signin</code></li>
      </ul>
    </main>
  );
}
