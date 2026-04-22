import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '@/lib/supabase';
import type { Role } from '@/lib/auth';

export default function Login() {
  const router = useRouter();
  const params = useLocalSearchParams<{ role?: string }>();
  const role = (params.role === 'vendor' ? 'vendor' : 'customer') as Role;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Eksik bilgi', 'Email ve şifreyi gir.');
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setSubmitting(false);
    if (error) {
      Alert.alert('Giriş başarısız', error.message);
      return;
    }
    router.replace('/');
  };

  const roleLabel = role === 'vendor' ? 'Sucu' : 'Müşteri';

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 px-6 py-8">
            <Text className="text-2xl font-bold text-brand-700">
              {roleLabel} girişi
            </Text>
            <Text className="mt-1 text-sm text-slate-500">
              Hesabın varsa email ve şifreni gir.
            </Text>

            <View className="mt-8 gap-4">
              <View>
                <Text className="mb-1 text-sm font-medium text-slate-700">
                  Email
                </Text>
                <TextInput
                  className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-base text-slate-900"
                  placeholder="ornek@mail.com"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <View>
                <Text className="mb-1 text-sm font-medium text-slate-700">
                  Şifre
                </Text>
                <TextInput
                  className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-base text-slate-900"
                  placeholder="••••••"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>

              <Pressable
                disabled={submitting}
                onPress={onSubmit}
                className="mt-4 h-14 items-center justify-center rounded-2xl bg-brand-500 active:bg-brand-600 disabled:opacity-60"
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-lg font-semibold text-white">
                    Giriş yap
                  </Text>
                )}
              </Pressable>

              <Link href={{ pathname: '/(auth)/signup', params: { role } }} asChild>
                <Pressable className="h-14 items-center justify-center rounded-2xl border border-slate-200 bg-white active:bg-slate-50">
                  <Text className="text-base font-semibold text-slate-700">
                    Hesabım yok, kayıt ol
                  </Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
