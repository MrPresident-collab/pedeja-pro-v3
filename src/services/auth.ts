import { getSupabase, isDemoModeEnabled, isSupabaseConfigured } from './supabase';
import type { ID } from '@/types';
import type { Identity } from '@/types/domain';
import { normalizeAngolaPhone, isValidAngolaPhone } from '@/utils/phone';

export type AuthMode = 'mock' | 'supabase';

export type AuthUser = {
  id: ID;
  phone?: string;
  email?: string;
};

export type AuthSession = {
  user: AuthUser;
  mode: AuthMode;
  identity: Identity | null;
};

export interface AuthResult {
  success: boolean;
  error?: string;
}

const SESSION_STORAGE_KEY = 'pedeja:auth:session:v2';
const OTP_STORAGE_KEY = 'pedeja:auth:pending_otp:v2';

const listeners = new Set<(session: AuthSession | null) => void>();
let currentSession: AuthSession | null = null;

// OTP Expiration & Security Settings
const OTP_EXPIRES_MS = 5 * 60 * 1000; // 5 minutes
const OTP_COOLDOWN_MS = 30 * 1000;    // 30 seconds between resends
const OTP_MAX_ATTEMPTS = 3;

type PendingOtp = {
  phone: string;
  code: string;
  expiresAt: number;
  attempts: number;
  requestedAt: number;
};

function loadPendingOtp(): PendingOtp | null {
  try {
    const raw = sessionStorage.getItem(OTP_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function savePendingOtp(otp: PendingOtp | null): void {
  try {
    if (otp) {
      sessionStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(otp));
    } else {
      sessionStorage.removeItem(OTP_STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

function persistSession(session: AuthSession | null): void {
  try {
    if (session) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

function loadPersistedSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function notifyListeners(): void {
  listeners.forEach((listener) => {
    try {
      listener(currentSession);
    } catch {
      // safe notify
    }
  });
}

export function getAuthMode(): AuthMode {
  return isSupabaseConfigured() ? 'supabase' : 'mock';
}

function requireDemoMode(): boolean {
  return isDemoModeEnabled() && !isSupabaseConfigured();
}

function toAuthSession(session: {
  user: { id: string; phone?: string | null; email?: string | null };
}): AuthSession {
  return {
    user: { id: session.user.id, phone: session.user.phone ?? undefined, email: session.user.email ?? undefined },
    mode: 'supabase',
    identity: {
      id: session.user.id,
      status: 'active',
      capabilities: [
        { capability: 'customer', approval: 'approved', approvedAt: new Date().toISOString() },
      ],
      internal: null,
    },
  };
}

export async function getCurrentSession(): Promise<AuthSession | null> {
  if (currentSession) return currentSession;

  if (isSupabaseConfigured()) {
    const sb = getSupabase();
    if (sb) {
      const { data } = await sb.auth.getSession();
      if (data.session) {
        currentSession = toAuthSession(data.session);
        return currentSession;
      }
    }
    return null;
  }

  const persisted = loadPersistedSession();
  if (persisted) {
    currentSession = persisted;
    return currentSession;
  }

  return null;
}

export const getSession = getCurrentSession;

export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await getCurrentSession();
  return session?.user ?? null;
}

export async function signInWithPhone(rawPhone: string): Promise<AuthResult> {
  const normalized = normalizeAngolaPhone(rawPhone);
  if (!isValidAngolaPhone(normalized)) {
    return {
      success: false,
      error: 'Número de telefone inválido. Introduz um número de Angola (+244 9XX XXX XXX).',
    };
  }

  const existingOtp = loadPendingOtp();
  if (existingOtp && Date.now() - existingOtp.requestedAt < OTP_COOLDOWN_MS) {
    const remaining = Math.ceil((OTP_COOLDOWN_MS - (Date.now() - existingOtp.requestedAt)) / 1000);
    return {
      success: false,
      error: `Por favor aguarda ${remaining}s antes de pedir um novo código.`,
    };
  }

  const sb = getSupabase();
  if (sb) {
    try {
      const { error } = await sb.auth.signInWithOtp({ phone: normalized });
      if (error) return { success: false, error: 'Não foi possível enviar o código. Tenta novamente.' };
      savePendingOtp({
        phone: normalized,
        code: '',
        expiresAt: Date.now() + OTP_EXPIRES_MS,
        attempts: 0,
        requestedAt: Date.now(),
      });
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Não foi possível enviar o código.' };
    }
  }

  if (!requireDemoMode()) {
    return { success: false, error: 'O serviço de autenticação não está disponível. Tenta novamente mais tarde.' };
  }

  savePendingOtp({
    phone: normalized,
    code: '1234',
    expiresAt: Date.now() + OTP_EXPIRES_MS,
    attempts: 0,
    requestedAt: Date.now(),
  });
  return { success: true };
}

export async function verifyOtp(rawPhone: string, token: string): Promise<AuthResult> {
  const normalized = normalizeAngolaPhone(rawPhone);
  const pending = loadPendingOtp();

  if (!pending || pending.phone !== normalized) {
    return { success: false, error: 'Sessão de verificação expirada. Pede um novo código.' };
  }

  if (Date.now() > pending.expiresAt) {
    savePendingOtp(null);
    return { success: false, error: 'Código expirado. Pede um novo código.' };
  }

  if (pending.attempts >= OTP_MAX_ATTEMPTS) {
    savePendingOtp(null);
    return { success: false, error: 'Demasiadas tentativas incorretas. Pede um novo código.' };
  }

  const sb = getSupabase();
  if (sb && pending.code === '') {
    try {
      const { data, error } = await sb.auth.verifyOtp({
        phone: normalized,
        token: token.trim(),
        type: 'sms',
      });
      if (error) {
        pending.attempts += 1;
        savePendingOtp(pending);
        return { success: false, error: 'Código incorreto. Tenta novamente.' };
      }
      if (data.session) {
        currentSession = toAuthSession(data.session);
        persistSession(currentSession);
        savePendingOtp(null);
        notifyListeners();
        return { success: true };
      }
      return { success: false, error: 'Não foi possível iniciar a sessão.' };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Não foi possível verificar o código.' };
    }
  }

  if (!requireDemoMode()) {
    savePendingOtp(null);
    return { success: false, error: 'A sessão de autenticação não está disponível.' };
  }

  if (token.trim() !== pending.code) {
    pending.attempts += 1;
    savePendingOtp(pending);
    return {
      success: false,
      error: `Código incorreto. Restam ${OTP_MAX_ATTEMPTS - pending.attempts} tentativa(s).`,
    };
  }

  savePendingOtp(null);
  const userId = `usr-${normalized.slice(-9)}`;
  currentSession = {
    user: { id: userId, phone: normalized },
    mode: isSupabaseConfigured() ? 'supabase' : 'mock',
    identity: {
      id: userId,
      status: 'active',
      capabilities: [
        { capability: 'customer', approval: 'approved', approvedAt: new Date().toISOString() },
      ],
      internal: null,
    },
  };

  persistSession(currentSession);
  notifyListeners();
  return { success: true };
}

export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  const cleanEmail = email.trim().toLowerCase();

  const sb = getSupabase();
  if (!sb) return { success: false, error: 'Supabase não configurado' };

  try {
    const { data, error } = await sb.auth.signInWithPassword({ email: cleanEmail, password });
    if (error) {
      if (error.message.includes('Email not confirmed')) {
        return {
          success: false,
          error: 'Email ainda não confirmado. Por favor verifica a tua caixa de entrada.',
        };
      }
      return { success: false, error: 'Credenciais inválidas. Verifica o email e a palavra-passe.' };
    }
    if (data.session) {
      currentSession = toAuthSession(data.session);
      persistSession(currentSession);
      notifyListeners();
      return { success: true };
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro na autenticação.';
    return { success: false, error: message };
  }

  return { success: false, error: 'Não foi possível iniciar sessão.' };
}

export async function signUpWithEmail(email: string, password: string): Promise<AuthResult> {
  const sb = getSupabase();
  if (!sb) return { success: false, error: 'Supabase não configurado' };

  try {
    const { data, error } = await sb.auth.signUp({ email: email.trim().toLowerCase(), password });
    if (error) return { success: false, error: error.message };
    if (data.session) {
      currentSession = toAuthSession(data.session);
      persistSession(currentSession);
      notifyListeners();
      return { success: true };
    }
    return {
      success: true,
      error: 'Registo concluído! Enviámos uma mensagem de confirmação para o teu email.',
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao criar conta.';
    return { success: false, error: message };
  }
}

export async function resetPassword(email: string): Promise<AuthResult> {
  const sb = getSupabase();
  if (!sb) return { success: false, error: 'O serviço de autenticação não está disponível.' };
  const { error } = await sb.auth.resetPasswordForEmail(email.trim().toLowerCase());
  return error ? { success: false, error: error.message } : { success: true };
}

export async function signOut(): Promise<void> {
  const sb = getSupabase();
  if (sb) {
    try {
      await sb.auth.signOut();
    } catch {
      // ignore
    }
  }
  currentSession = null;
  persistSession(null);
  savePendingOtp(null);
  notifyListeners();
}

export function onAuthStateChange(callback: (session: AuthSession | null) => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}