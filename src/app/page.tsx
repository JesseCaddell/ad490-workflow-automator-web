export default function HomePage() {
  return (
      <main style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
          Workflow Automator
        </h1>
        <p style={{ marginBottom: 16, opacity: 0.8 }}>
          Web shell scaffold. UI features coming in Epic 5.
        </p>

        <section style={{ border: "1px solid #3333", borderRadius: 8, padding: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
            Status
          </h2>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            <li>App boots locally</li>
            <li>Placeholder home page renders</li>
            <li>Repo structure established</li>
          </ul>
        </section>
      </main>
  );
}
