import { useState } from 'react';
import { ArrowRight, Check, KeyRound, Mail, Smartphone } from 'lucide-react';
import { useAuth } from '@/auth/useAuth';
import { showToast } from '@/components/toastStore';
import { normalizeAngolaPhone, isValidAngolaPhone } from '@/utils/phone';

type Props = {
  onClose: () => void;
  onSuccess: () => void;
  initialMode?: 'sign-in' | 'sign-up';
};

export function SignInSheet({ onClose, onSuccess, initialMode = 'sign-in' }: Props) {
  const auth = useAuth();
  const [method, setMethod] = useState<'phone' | 'email'>(initialMode === 'sign-up' ? 'email' : 'phone');
  const [accountMode, setAccountMode] = useState<'sign-in' | 'sign-up'>(initialMode);
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function sendCode() {
    setErrorMsg(null);
    const normalized = normalizeAngolaPhone(phone);
    if (!isValidAngolaPhone(normalized)) {
      setErrorMsg('Número inválido. Introduz um número válido de Angola (+244 9XX XXX XXX).');
      return;
    }
    setLoading(true);
    const result = await auth.signInWithPhone(normalized);
    setLoading(false);
    if (result.success) {
      setStep('code');
      showToast('Código de verificação enviado.');
    } else {
      setErrorMsg(result.error ?? 'Não foi possível enviar o código. Tenta novamente.');
    }
  }

  async function verify() {
    setErrorMsg(null);
    if (code.trim().length < 4) return;
    setLoading(true);
    const normalized = normalizeAngolaPhone(phone);
    const result = await auth.verifyOtp(normalized, code.trim());
    setLoading(false);
    if (result.success) {
      showToast('Sessão iniciada com sucesso. Bem-vindo/a ao Pedejá.');
      onSuccess();
    } else {
      setErrorMsg(result.error ?? 'Código incorreto. Tenta novamente.');
    }
  }

  async function handleEmailSignUp() {
    setErrorMsg(null);
    if (!email.trim() || !password) {
      setErrorMsg('Preenche o email e a palavra-passe.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('A palavra-passe deve ter pelo menos 6 caracteres.');
      return;
    }
    setLoading(true);
    const result = await auth.signUpWithEmail(email.trim(), password);
    setLoading(false);
    if (result.success) {
      if (result.error) {
        showToast(result.error);
        setAccountMode('sign-in');
        return;
      }
      showToast('Conta criada com sucesso.');
      onSuccess();
    } else {
      setErrorMsg(result.error ?? 'Não foi possível criar a conta.');
    }
  }

  async function handleEmailSignIn() {
    setErrorMsg(null);
    if (!email.trim() || !password) {
      setErrorMsg('Preenche o email e a palavra-passe.');
      return;
    }
    setLoading(true);
    const result = await auth.signInWithEmail(email.trim(), password);
    setLoading(false);
    if (result.success) {
      showToast('Sessão iniciada com sucesso.');
      onSuccess();
    } else {
      setErrorMsg(result.error ?? 'Credenciais inválidas.');
    }
  }

  return (
    <div className="sheet-content">
      {/* Auth Method Selector */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          type="button"
          className={`filter-chip ${method === 'phone' ? 'active' : ''}`}
          onClick={() => {
            setMethod('phone');
            setErrorMsg(null);
          }}
          style={{ flex: 1, padding: '10px 0', justifyContent: 'center' }}
        >
          <Smartphone size={16} /> Telemóvel
        </button>
        <button
          type="button"
          className={`filter-chip ${method === 'email' ? 'active' : ''}`}
          onClick={() => {
            setMethod('email');
            setErrorMsg(null);
          }}
          style={{ flex: 1, padding: '10px 0', justifyContent: 'center' }}
        >
          <Mail size={16} /> Email / Conta
        </button>
      </div>

      {errorMsg && (
        <div
          style={{
            padding: '10px 14px',
            backgroundColor: '#fee2e2',
            color: '#b91c1c',
            borderRadius: '10px',
            fontSize: '13px',
            marginBottom: '14px',
            lineHeight: 1.4,
          }}
        >
          {errorMsg}
        </div>
      )}

      {method === 'phone' ? (
        step === 'phone' ? (
          <>
            <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '12px' }}>
              Introduz o teu número de telemóvel para receberes um código de acesso por SMS.
            </p>
            <div className="input-group auth-input">
              <span className="input-icon">+244</span>
              <input
                type="tel"
                placeholder="923 000 000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoFocus
              />
            </div>
            <button className="btn-primary auth-submit" onClick={sendCode} disabled={loading}>
              {loading ? 'A enviar…' : 'Enviar código'} <ArrowRight size={18} />
            </button>
          </>
        ) : (
          <>
            <p className="auth-code-note">
              Enviámos o código para <strong>{phone}</strong>.{' '}
              <button
                className="link-button"
                onClick={() => {
                  setStep('phone');
                  setCode('');
                  setErrorMsg(null);
                }}
              >
                Mudar número
              </button>
            </p>
            <div className="input-group auth-input">
              <input
                type="text"
                inputMode="numeric"
                placeholder="Código de 4 dígitos"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                autoFocus
              />
            </div>
            <button
              className="btn-primary auth-submit"
              onClick={verify}
              disabled={loading || code.trim().length < 4}
            >
              {loading ? 'A verificar…' : 'Verificar e entrar'} <Check size={18} />
            </button>
          </>
        )
      ) : (
        <>
          <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '12px' }}>
            {accountMode === 'sign-up' ? 'Cria a tua conta Pedejá com email e palavra-passe.' : 'Inicia sessão com o teu email e palavra-passe registados.'}
          </p>
          <div className="input-group auth-input" style={{ marginBottom: '10px' }}>
            <span className="input-icon"><Mail size={18} /></span>
            <input
              type="email"
              placeholder="exemplo@pedeja.ao"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
          </div>
          <div className="input-group auth-input">
            <span className="input-icon"><KeyRound size={18} /></span>
            <input
              type="password"
              placeholder="Palavra-passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            className="btn-primary auth-submit"
            onClick={() => void (accountMode === 'sign-up' ? handleEmailSignUp() : handleEmailSignIn())}
            disabled={loading || !email || !password}
          >
            {loading ? 'A processar…' : accountMode === 'sign-up' ? 'Criar conta' : 'Entrar com Email'} <ArrowRight size={18} />
          </button>
        </>
      )}

      {method === 'email' && (
        <button
          className="guest-link"
          onClick={() => {
            setAccountMode((mode) => mode === 'sign-in' ? 'sign-up' : 'sign-in');
            setErrorMsg(null);
          }}
          style={{ marginTop: '12px' }}
        >
          {accountMode === 'sign-in' ? 'Ainda não tens conta? Criar conta' : 'Já tens conta? Entrar'}
        </button>
      )}

      <button className="guest-link" onClick={onClose} style={{ marginTop: '14px' }}>
        Voltar atrás
      </button>
    </div>
  );
}