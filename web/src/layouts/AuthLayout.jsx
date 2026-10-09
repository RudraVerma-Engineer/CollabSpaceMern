import { Outlet } from "react-router-dom";

/** Two-column shell shared by Login and Register. */
const AuthLayout = () => (
  <div className="auth-page">
    <section className="auth-brand">
      <h1>Build together, not alone.</h1>
      <p>
        Showcase what you build, find teammates with the right skills, and
        talk to them in real time.
      </p>
      <div className="auth-brand-flow" aria-hidden="true">
        <span>People</span>
        <span className="arrow">→</span>
        <span>Projects</span>
        <span className="arrow">→</span>
        <span>Collaboration</span>
        <span className="arrow">→</span>
        <span>Chat</span>
      </div>
    </section>

    <section className="auth-panel">
      <div className="auth-card">
        <Outlet />
      </div>
    </section>
  </div>
);

export default AuthLayout;
