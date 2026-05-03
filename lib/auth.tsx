import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { registerForPushAsync } from './notifications';

export type Role = 'customer' | 'vendor';

export type Profile = {
  id: string;
  role: Role;
  full_name: string | null;
  phone: string | null;
  expo_push_token: string | null;
};

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  // Birden fazla loadProfile çağrısı çakışırsa en son başlayan kazansın
  const fetchTokenRef = useRef(0);

  const loadProfile = async (userId: string | null) => {
    const myToken = ++fetchTokenRef.current;
    if (!userId) {
      setProfile(null);
      return;
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('id, role, full_name, phone, expo_push_token')
      .eq('id', userId)
      .is('deleted_at', null)
      .maybeSingle();
    if (myToken !== fetchTokenRef.current) return;
    if (error) {
      // Tablo henüz yoksa veya okuma izni yoksa sessiz geç — kullanıcı role-select'e yönlenir
      setProfile(null);
      return;
    }
    setProfile((data as Profile | null) ?? null);
  };

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      await loadProfile(data.session?.user.id ?? null);
      setLoading(false);
      if (data.session?.user.id) {
        registerForPushAsync(data.session.user.id).catch(() => {});
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s);
      await loadProfile(s?.user.id ?? null);
      if (s?.user.id) {
        registerForPushAsync(s.user.id).catch(() => {});
      }
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value: AuthContextValue = {
    session,
    user: session?.user ?? null,
    profile,
    loading,
    refreshProfile: async () => {
      // session state stale olabilir (signup'tan hemen sonra closure güncellenmemiş olabilir).
      // Her seferinde supabase'den taze user id'sini al.
      const { data } = await supabase.auth.getSession();
      await loadProfile(data.session?.user.id ?? null);
    },
    signOut: async () => {
      await supabase.auth.signOut();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth AuthProvider içinde kullanılmalı.');
  }
  return ctx;
}
