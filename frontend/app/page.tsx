import Link from "next/link";

export default function Home() {
  return (
    <div className="entry-page">
      <header className="entry-header">
        <Link className="brand" href="/">
          <span className="brand-mark">IM</span>
          <span>IMPRESSOR</span>
        </Link>
      </header>
      <main className="entry-main">
        <div className="intro">
          <p className="eyebrow">Enterprise operations</p>
          <h1>A clearer way to work together.</h1>
          <p className="lead">
            Bring your people, suppliers and purchasing into one organized
            workspace.
          </p>
          <div className="actions">
            <Link href="/login" className="button primary">
              Sign in
            </Link>
            <Link href="/register" className="button secondary">
              Register an organization
            </Link>
          </div>
          <p className="hint">
            Staff accounts are created by their company administrator.
          </p>
        </div>
      </main>
      <footer className="entry-footer">
        Built for teams that keep business moving.
      </footer>
    </div>
  );
}
