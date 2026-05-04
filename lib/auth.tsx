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
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, role, full_name, phone, expo_push_token')
        .eq('id', userId)
        .is('deleted_at', null)
        .maybeSingle();
      if (myToken !== fetchTokenRef.current) return;
      if (error) {
        setProfile(null);
        return;
      }
      setProfile((data as Profile | null) ?? null);
    } catch {
      // Ağ hatası / bozuk session: profili temizle, app role-select'e yönlenir
      if (myToken === fetchTokenRef.current) setProfile(null);
    }
  };

  useEffect(() => {
    let active = true;

    // Watchdog: ağ tamamen ölü olsa bile 8sn sonra spinner'dan çık,
    // kullanıcı role-select'e düşsün, sonsuz beyaz ekran olmasın.
    const watchdog = setTimeout(() => {
      if (active) setLoading(false);
    }, 8000);

    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!active) return;
        setSession(data.session);
        await loadProfile(data.session?.user.id ?? null);
        if (data.session?.user.id) {
          registerForPushAsync(data.session.user.id).catch(() => {});
        }
      } catch {
        // getSession reject ederse (AsyncStorage bozuksa vs.) sessiz geç
      } finally {
        if (active) {
          clearTimeout(watchdog);
          setLoading(false);
        }
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s);
      try {
        await loadProfile(s?.user.id ?? null);
      } catch {
        setProfile(null);
      }
      if (s?.user.id) {
        registerForPushAsync(s.user.id).catch(() => {});
      }
    });

    return () => {
      active = false;
      clearTimeout(watchdog);
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
