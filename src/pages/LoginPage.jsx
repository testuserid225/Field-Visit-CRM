import React, { useState } from 'react';
import { 
  MapPin, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Compass, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  Smartphone,
  QrCode,
  Key,
  Copy,
  Check
} from 'lucide-react';
import { api } from '../services/api';

export default function LoginPage({ onLoginSuccess, currentTheme = 'emerald', onThemeChange }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [twoFactorState, setTwoFactorState] = useState(null); // { mode: 'setup' | 'verify', twoFactorToken, qrCodeUrl, secretKey, employeeName, email }
  const [totpCode, setTotpCode] = useState('');
  const [isVerifying2FA, setIsVerifying2FA] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);

  const themes = [
    { id: 'emerald', name: 'Emerald', color: '#10b981' },
    { id: 'obsidian', name: 'Dark', color: '#0f1715' },
    { id: 'violet', name: 'Violet', color: '#8b5cf6' },
    { id: 'sunset', name: 'Sunset', color: '#f59e0b' }
  ];

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: Authenticate credentials against Employee table
      const res = await api.login(email.trim(), password);

      if (res && res.success) {
        if (res.require2FASetup) {
          // Employee needs first-time Google Authenticator setup
          setTwoFactorState({
            mode: 'setup',
            twoFactorToken: res.twoFactorToken,
            qrCodeUrl: res.qrCodeUrl,
            secretKey: res.secretKey,
            liveCodeHint: res.liveCodeHint,
            employeeName: res.employeeName,
            email: res.email
          });
          setTotpCode('');
        } else if (res.require2FA) {
          // Employee already has 2FA enabled: prompt for 6-digit TOTP
          setTwoFactorState({
            mode: 'verify',
            twoFactorToken: res.twoFactorToken,
            employeeName: res.employeeName,
            email: res.email,
            secretKey: res.secretKey,
            liveCodeHint: res.liveCodeHint
          });
          setTotpCode('');
        } else if (res.user) {
          onLoginSuccess(res.user);
        }
      } else {
        setErrorMessage(res?.message || 'Invalid email or password. Please verify your employee credentials.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'An error occurred during authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify2FA = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    const cleanCode = totpCode.trim().replace(/\s+/g, '');
    if (!cleanCode || cleanCode.length !== 6) {
      setErrorMessage('Please enter a valid 6-digit verification code from Google Authenticator.');
      return;
    }

    setIsVerifying2FA(true);

    try {
      const res = await api.verify2FA(twoFactorState.twoFactorToken, cleanCode, twoFactorState.email);
      if (res && res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setErrorMessage(res?.message || 'Invalid 6-digit code. Please check your Google Authenticator app and try again.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Verification failed. Please try again.');
    } finally {
      setIsVerifying2FA(false);
    }
  };

  const handleCopyKey = () => {
    if (twoFactorState?.secretKey) {
      navigator.clipboard.writeText(twoFactorState.secretKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const handleCopyAccount = () => {
    if (twoFactorState?.email) {
      navigator.clipboard.writeText(`FieldVisitCRM (${twoFactorState.email})`);
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2000);
    }
  };

  const handleCancel2FA = () => {
    setTwoFactorState(null);
    setTotpCode('');
    setErrorMessage('');
  };

  const handleReset2FA = async () => {
    if (window.confirm('Reset Google Authenticator 2FA for this employee account? You will be able to setup a new key or login directly.')) {
      setIsVerifying2FA(true);
      try {
        const res = await api.reset2FA({
          email: twoFactorState?.email,
          twoFactorToken: twoFactorState?.twoFactorToken
        });
        if (res && res.success) {
          alert(res.message);
          setTwoFactorState(null);
          setTotpCode('');
        } else {
          setErrorMessage(res?.message || 'Failed to reset 2FA.');
        }
      } catch (err) {
        setErrorMessage(err.message || 'Error resetting 2FA.');
      } finally {
        setIsVerifying2FA(false);
      }
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      backgroundColor: '#051410',
      backgroundImage: 'radial-gradient(at 0% 0%, #064e3b 0px, transparent 50%), radial-gradient(at 100% 100%, #042f2e 0px, transparent 50%)',
      fontFamily: 'var(--font-main)',
      color: '#fff',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative background ambient glow */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        right: '10%',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, transparent 70%)',
        filter: 'blur(50px)',
        pointerEvents: 'none'
      }} />

      {/* Top Floating Theme Switcher */}
      {onThemeChange && (
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(6, 24, 20, 0.75)',
          backdropFilter: 'blur(10px)',
          padding: '6px 12px',
          borderRadius: 'var(--radius-full)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          zIndex: 100
        }}>
          <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>Theme:</span>
          {themes.map(t => (
            <button
              key={t.id}
              id={`login-theme-${t.id}`}
              onClick={() => onThemeChange(t.id)}
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                backgroundColor: t.color,
                border: currentTheme === t.id ? '2px solid #fff' : '2px solid transparent',
                cursor: 'pointer',
                transform: currentTheme === t.id ? 'scale(1.2)' : 'scale(1)',
                transition: 'all 0.15s ease'
              }}
              title={t.name}
            />
          ))}
        </div>
      )}

      {/* Main Container */}
      <div style={{
        display: 'flex',
        flex: 1,
        maxWidth: '1200px',
        margin: 'auto',
        padding: '30px 20px',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '48px',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Left Col: Brand Presentation & Value Props */}
        <div style={{ flex: 1, maxWidth: '520px', display: 'none', lg: 'block' }} className="login-hero-pane">
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            marginBottom: '20px'
          }}>
            <ShieldCheck size={16} color="#34d399" />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#6ee7b7' }}>
              Field Intelligence & Visit CRM
            </span>
          </div>

          <h1 style={{
            fontSize: '2.8rem',
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            marginBottom: '18px'
          }}>
            Manage Field Visits With <span style={{
              background: 'linear-gradient(135deg, #34d399 0%, #22d3ee 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>Complete Field Intelligence.</span>
          </h1>

          <p style={{
            fontSize: '1.05rem',
            color: '#94a3b8',
            lineHeight: 1.6,
            marginBottom: '32px'
          }}>
            Empower your sales executives, field engineers, and branch managers to plan itineraries, execute verified geo-fenced check-ins, and file visit reports effortlessly.
          </p>

          {/* Feature Highlights */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CheckCircle2 size={18} color="#34d399" />
              </div>
              <span style={{ fontSize: '0.92rem', color: '#e2e8f0', fontWeight: 500 }}>
                Instant Geo-Fence validation (under 50m radius)
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(6, 182, 212, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Compass size={18} color="#22d3ee" />
              </div>
              <span style={{ fontSize: '0.92rem', color: '#e2e8f0', fontWeight: 500 }}>
                Automated route optimization & travel km logs
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(245, 158, 11, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Smartphone size={18} color="#fbbf24" />
              </div>
              <span style={{ fontSize: '0.92rem', color: '#e2e8f0', fontWeight: 500 }}>
                Token-based authentication secured via Employee Table
              </span>
            </div>
          </div>
        </div>

        {/* Right Col: Login Card (Only Email and Password Fields) */}
        <div style={{
          flex: 1,
          maxWidth: '440px',
          width: '100%',
          background: 'rgba(6, 24, 20, 0.78)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(16, 185, 129, 0.22)',
          borderRadius: '24px',
          padding: '38px 32px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 25px rgba(16, 185, 129, 0.15)'
        }}>
          {/* Logo & Form Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #14b8a6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 20px rgba(16, 185, 129, 0.45)'
            }}>
              {twoFactorState ? (
                twoFactorState.mode === 'setup' ? <QrCode size={24} color="#ffffff" /> : <ShieldCheck size={26} color="#ffffff" />
              ) : (
                <MapPin size={26} color="#ffffff" />
              )}
            </div>
            <div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffffff' }}>
                FieldVisit<span style={{ color: '#34d399' }}>CRM</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                {twoFactorState 
                  ? (twoFactorState.mode === 'setup' ? 'Setup Google Authenticator (Free 2FA)' : 'Two-Factor Verification')
                  : 'Sign in with your employee credentials'
                }
              </div>
            </div>
          </div>

          {errorMessage && (
            <div style={{
              padding: '12px 14px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '10px',
              color: '#fca5a5',
              fontSize: '0.85rem',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>{errorMessage}</span>
            </div>
          )}

          {twoFactorState ? (
            /* ============================================================== */
            /* GOOGLE AUTHENTICATOR (TOTP) 2FA VIEW                           */
            /* ============================================================== */
            <div>
              {twoFactorState.mode === 'setup' ? (
                /* First-Time Setup View: Direct Setup Key (No QR Code Needed) */
                <div>
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid rgba(16, 185, 129, 0.28)',
                    marginBottom: '16px',
                    fontSize: '0.8rem',
                    color: '#a7f3d0',
                    lineHeight: 1.5
                  }}>
                    <div style={{ fontWeight: 700, color: '#34d399', marginBottom: '4px' }}>
                      📱 How to add in Google Authenticator (No Camera Needed):
                    </div>
                    1. Open <strong>Google Authenticator</strong> on your phone.<br />
                    2. Tap the <strong>"+" (Plus)</strong> button ➔ choose <strong>"Enter a setup key"</strong>.<br />
                    3. Fill in the 2 fields below and tap <strong>"Add"</strong>:
                  </div>

                  {/* Field 1: Account Name */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 600, marginBottom: '4px' }}>
                      1. Account Name:
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.12)'
                    }}>
                      <span style={{ fontSize: '0.82rem', color: '#e2e8f0', fontWeight: 600 }}>
                        FieldVisitCRM ({twoFactorState.email})
                      </span>
                      <button
                        type="button"
                        id="copy-account-name-btn"
                        onClick={handleCopyAccount}
                        style={{
                          background: copiedAccount ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          color: copiedAccount ? '#34d399' : '#e2e8f0',
                          cursor: 'pointer',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '0.74rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        {copiedAccount ? <Check size={12} color="#34d399" /> : <Copy size={12} />}
                        <span>{copiedAccount ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Field 2: Your Key (Setup Key) */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 600, marginBottom: '4px' }}>
                      2. Your Key (Setup Key):
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'rgba(16, 185, 129, 0.08)',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(16, 185, 129, 0.3)'
                    }}>
                      <code style={{ fontSize: '0.88rem', color: '#34d399', fontWeight: 700, letterSpacing: '0.08em', wordBreak: 'break-all' }}>
                        {twoFactorState.secretKey}
                      </code>
                      <button
                        type="button"
                        id="copy-secret-key-btn"
                        onClick={handleCopyKey}
                        style={{
                          background: copiedKey ? '#059669' : 'rgba(16, 185, 129, 0.25)',
                          border: '1px solid rgba(16, 185, 129, 0.4)',
                          color: '#fff',
                          cursor: 'pointer',
                          padding: '5px 10px',
                          borderRadius: '6px',
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          marginLeft: '8px',
                          flexShrink: 0
                        }}
                      >
                        {copiedKey ? <Check size={13} color="#fff" /> : <Copy size={13} />}
                        <span>{copiedKey ? 'Copied!' : 'Copy Key'}</span>
                      </button>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px' }}>
                      Type of key: <strong>Time-based</strong> (already selected by default)
                    </div>
                  </div>

                  {/* Optional QR code expander */}
                  <div style={{ marginBottom: '16px', textAlign: 'center' }}>
                    <button
                      type="button"
                      id="toggle-qr-code-btn"
                      onClick={() => setShowQRCode(!showQRCode)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#64748b',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                    >
                      {showQRCode ? 'Hide QR Code' : 'Prefer using camera? Click to show QR Code'}
                    </button>

                    {showQRCode && (
                      <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                        <div style={{
                          padding: '8px',
                          background: '#ffffff',
                          borderRadius: '12px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                          display: 'inline-block'
                        }}>
                          <img 
                            src={twoFactorState.qrCodeUrl} 
                            alt="Google Authenticator QR Code" 
                            style={{ width: '130px', height: '130px', display: 'block' }} 
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{
                    fontSize: '0.82rem',
                    color: '#e2e8f0',
                    marginBottom: '8px',
                    fontWeight: 600
                  }}>
                    3. Enter the 6-digit code shown in Google Authenticator:
                  </div>
                </div>
              ) : (
                /* Verification View: Returning User */
                <div style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  marginBottom: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#6ee7b7' }}>
                      Hello, {twoFactorState.employeeName}
                    </div>
                    {twoFactorState.secretKey && (
                      <button
                        type="button"
                        onClick={handleCopyKey}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: copiedKey ? '#34d399' : '#94a3b8',
                          fontSize: '0.72rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        title="Copy setup key to add in Google Authenticator"
                      >
                        <Key size={12} />
                        <span>{copiedKey ? 'Key Copied!' : 'Copy Key'}</span>
                      </button>
                    )}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                    Enter the 6-digit code for <strong>{twoFactorState.email}</strong> from Google Authenticator.
                  </div>
                </div>
              )}

              <form onSubmit={handleVerify2FA}>
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ position: 'relative' }}>
                    <Key size={18} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      id="totp-code-input"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={totpCode}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                        setTotpCode(val);
                      }}
                      placeholder="• • • • • •"
                      autoFocus
                      required
                      style={{
                        width: '100%',
                        padding: '12px 14px 12px 42px',
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        border: '2px solid rgba(16, 185, 129, 0.5)',
                        borderRadius: '12px',
                        color: '#34d399',
                        fontSize: '1.4rem',
                        fontWeight: 700,
                        letterSpacing: '0.35em',
                        textAlign: 'center',
                        outline: 'none',
                        transition: 'border-color 0.15s ease'
                      }}
                    />
                  </div>
                </div>

                <button
                  id="verify-2fa-submit-btn"
                  type="submit"
                  disabled={isVerifying2FA || totpCode.trim().length !== 6}
                  style={{
                    width: '100%',
                    padding: '13px',
                    borderRadius: '10px',
                    background: 'var(--primary-gradient)',
                    color: '#fff',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    border: 'none',
                    cursor: (isVerifying2FA || totpCode.trim().length !== 6) ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    opacity: (isVerifying2FA || totpCode.trim().length !== 6) ? 0.7 : 1,
                    marginBottom: '12px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {isVerifying2FA ? (
                    <span>Verifying Code...</span>
                  ) : (
                    <>
                      <span>{twoFactorState.mode === 'setup' ? 'Activate & Sign In' : 'Verify & Sign In'}</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    id="cancel-2fa-btn"
                    onClick={handleCancel2FA}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '10px',
                      background: 'none',
                      color: '#94a3b8',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <ArrowLeft size={16} />
                    <span>Back to Login</span>
                  </button>

                  <button
                    type="button"
                    id="reset-2fa-btn"
                    onClick={handleReset2FA}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: '#f87171',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    title="Lost or changed your phone? Reset 2FA"
                  >
                    Reset 2FA
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* ============================================================== */
            /* CREDENTIALS LOGIN VIEW                                         */
            /* ============================================================== */
            <form onSubmit={handleLogin}>
              {/* Email Address */}
              <div style={{ marginBottom: '20px' }}>
                <label 
                  htmlFor="login-email-input" 
                  style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '8px' }}
                >
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    id="login-email-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    autoComplete="username"
                    required
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '12px 14px 12px 42px',
                      backgroundColor: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '0.9rem',
                      outline: 'none',
                      transition: 'border-color 0.15s ease'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#10b981'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)'}
                  />
                </div>
              </div>

              {/* Password */}
              <div style={{ marginBottom: '26px' }}>
                <label 
                  htmlFor="login-password-input" 
                  style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '8px' }}
                >
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    id="login-password-input"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                    style={{
                      width: '100%',
                      padding: '12px 42px 12px 42px',
                      backgroundColor: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '0.9rem',
                      outline: 'none',
                      transition: 'border-color 0.15s ease'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#10b981'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)'}
                  />
                  <button
                    type="button"
                    id="toggle-password-visibility-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ 
                      position: 'absolute', 
                      right: '14px', 
                      top: '50%', 
                      transform: 'translateY(-50%)', 
                      color: '#94a3b8', 
                      cursor: 'pointer', 
                      background: 'none', 
                      border: 'none',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                id="login-submit-btn"
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '13px',
                  borderRadius: '10px',
                  background: 'var(--primary-gradient)',
                  color: '#fff',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  border: 'none',
                  cursor: isLoading ? 'wait' : 'pointer',
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease',
                  opacity: isLoading ? 0.75 : 1
                }}
              >
                {isLoading ? (
                  <span>Signing In...</span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
