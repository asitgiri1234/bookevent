import { useState } from "react";
import { useNavigate, useLocation, Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Verify() {
  const { user, verify, resend } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Email + (dev) preview URL are passed from Register/Login via route state.
  const email = location.state?.email || "";
  const [previewUrl, setPreviewUrl] = useState(location.state?.previewUrl || "");

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  // Already logged in (e.g. just verified)? Go home.
  if (user) return <Navigate to="/" replace />;
  // No email in state means the user landed here directly.
  if (!email) return <Navigate to="/register" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (code.length !== 6) {
      setError("Enter the 6-digit code from your email");
      return;
    }
    setLoading(true);
    try {
      await verify(email, code);
      navigate("/"); // verified + logged in
    } catch (err) {
      setError(err.response?.data?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setInfo("");
    try {
      const data = await resend(email);
      setPreviewUrl(data.previewUrl || "");
      setInfo("A new code has been sent to your email.");
    } catch (err) {
      setError(err.response?.data?.message || "Could not resend code");
    }
  };

  return (
    <div className="auth-card">
      <h1>Verify your email</h1>
      <p className="muted">
        We sent a 6-digit code to <strong>{email}</strong>. Enter it below to
        finish creating your account.
      </p>

      {error && <div className="alert alert-error">{error}</div>}
      {info && <div className="alert alert-info">{info}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-control">
          <label htmlFor="code">Verification code</label>
          <input
            id="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            className="code-input"
            value={code}
            onChange={(e) =>
              setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            placeholder="000000"
            required
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-block"
          disabled={loading}
        >
          {loading ? "Verifying…" : "Verify & continue"}
        </button>
      </form>

      <p className="auth-switch">
        Didn't get it?{" "}
        <button type="button" className="link-button" onClick={handleResend}>
          Resend code
        </button>
      </p>

      {/* Dev convenience: Ethereal emails aren't really delivered, so we link
          straight to the preview so you can read the code. */}
      {previewUrl && (
        <p className="auth-switch">
          <a href={previewUrl} target="_blank" rel="noreferrer">
            🔗 Open the test email (dev)
          </a>
        </p>
      )}

      <p className="auth-switch">
        <Link to="/login">Back to login</Link>
      </p>
    </div>
  );
}
