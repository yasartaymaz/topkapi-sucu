import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    'EXPO_PUBLIC_SUPABASE_URL ve EXPO_PUBLIC_SUPABASE_ANON_KEY environment değişkenleri tanımlı olmalı. .env dosyasını kontrol edin.'
  );
}

// Not: Database tipi `types/database.ts`'de mevcut ama sorgularda `as any` cast'lar
// gereksiz zorluk yaratıyordu. Şimdilik gevşek tipte kullanıyoruz; ileride spesifik
// sorgular için yeniden sıkılaştırılabilir.
export const supabase = createClient(url, anonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// iOS focus değiştikçe token auto-refresh kontrolü — Supabase RN önerisi
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
