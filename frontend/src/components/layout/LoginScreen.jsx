import React from "react";

export function LoginScreen({
  email,
  password,
  onEmailChange,
  onPasswordChange,
  onLogin
}) {
  return (
    <div id="login-screen" style={{ display: "flex", minHeight: "100vh" }}>
      <div className="login-form-side">
        <div>
          <div className="login-logo">
            <div className="login-logo-conteiner">
              <div className="login-logo-icon">
                <svg viewBox="0 0 24 24"><path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 008 20C19 20 22 3 22 3c-1 2-8 2-8 2s1.5-3.5 5-3.5S17 8 17 8z" /></svg>
              </div>
              <div className="login-logo-text">
                Poder Verde
              </div>
            </div>
            <div>
              <div className="login-title">
                Inicio de Sesión
              </div>
            </div>
          </div>
        </div>
        
        <div className="login-subtitle">Bienvenido al sistema de gestión de personal.</div>
        <div className="form-group">
          <label className="form-label">Correo Institucional</label>
          <div className="input-row">
            <input className="form-input" type="email" required value={email} onChange={(e) => onEmailChange(e.target.value)} placeholder="nombre@poderverde.com" />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Clave de Seguridad</label>
          <div className="input-row">
            <input className="form-input" type="password" required value={password} onChange={(e) => onPasswordChange(e.target.value)} placeholder="********"/>
          </div>
        </div>
        <button type="button" className="login-btn" onClick={onLogin}>
          Iniciar Sesión
        </button>
        <div className="login-footer">© 2026 Poder Verde. Gestión Sostenible de Talento.</div>
      </div>
      <div className="login-hero">
        <div className="login-hero-bg" />
        <div className="login-hero-title">Gestionando el futuro con <span>conciencia ambiental.</span></div>
        <div className="login-hero-desc">Unificamos la eficiencia corporativa con el respeto por los recursos naturales.</div>
      </div>
    </div>
  );
}
