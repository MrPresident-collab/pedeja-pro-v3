import { getSupabase } from '@/services/supabase';
import { getCurrentUser } from '@/services/auth';
import type { Profile } from '@/types';
import type { Identity } from '@/types/domain';
import type { AccountDeletionRequest, PhoneChangeOutcome, PhoneVerifyOutcome } from './types';

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((n) => n[0]).join('').toUpperCase() || 'P';
}
function memberSince(iso: string) {
  return new Intl.DateTimeFormat('pt-PT', { month: 'long', year: 'numeric' }).format(new Date(iso));
}

export function createSupabaseProfileRepository() {
  const sb = getSupabase();
  let profile: Profile = { name: '', phone: '', email: '', memberSince: '', initials: 'P' };
  let userId = '';

  return {
    async initialize() {
      if (!sb) throw new Error('Supabase não configurado.');
      const user = await getCurrentUser();
      if (!user) throw new Error('Sessão necessária.');
      userId = user.id;
      const { data, error } = await sb.from('profiles').select('id,full_name,phone,avatar_url,created_at').eq('id', user.id).single();
      if (error) throw error;
      const name = data.full_name?.trim() || 'Utilizador Pedejá';
      profile = { name, phone: data.phone ?? user.phone ?? '', email: user.email ?? '', memberSince: memberSince(data.created_at), initials: initials(name) };
    },
    getProfile() { return { ...profile }; },
    getIdentity(): Identity { return { id: userId, status: 'active', capabilities: [{ capability: 'customer', approval: 'approved' }], internal: null }; },
    async updateName(name: string) {
      if (!sb || !userId) throw new Error('Sessão necessária.');
      const { error } = await sb.from('profiles').update({ full_name: name.trim() }).eq('id', userId);
      if (error) throw error;
      profile = { ...profile, name: name.trim(), initials: initials(name) };
      return { ...profile };
    },
    isPhoneVerified() { return Boolean(profile.phone); },
    async requestPhoneChange(phone: string): Promise<PhoneChangeOutcome> {
      if (!sb) return { success: false, error: 'Supabase não configurado.' };
      const { error } = await sb.auth.updateUser({ phone });
      if (error) return { success: false, error: 'Não foi possível enviar o código de verificação.' };
      return { success: true };
    },
    async verifyPhoneChange(phone: string, code: string): Promise<PhoneVerifyOutcome> {
      if (!sb) return { success: false, error: 'Supabase não configurado.' };
      const { error } = await sb.auth.verifyOtp({ phone, token: code, type: 'phone_change' });
      if (error) return { success: false, error: 'Código incorreto ou expirado.' };
      await this.initialize();
      return { success: true };
    },
    async setEmail(email: string) {
      if (!sb) throw new Error('Supabase não configurado.');
      const { error } = await sb.auth.updateUser({ email: email.trim() });
      if (error) throw error;
      profile = { ...profile, email: email.trim() };
      return { ...profile };
    },
    getDeletionRequest(): AccountDeletionRequest { return { state: 'none' }; },
    async requestAccountDeletion(): Promise<PhoneChangeOutcome> { return { success: false, error: 'Contacta o suporte para solicitar a eliminação da conta.' }; },
  };
}
