import { useLocalSearchParams, useRouter } from 'expo-router';
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

import { useAuth, type Role } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export default function Signup() {
  const router = useRouter();
  const { refreshProfile } = useAuth();
  const params = useLocalSearchParams<{ role?: string }>();
  const role = (params.role === 'vendor' ? 'vendor' : 'customer') as Role;

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!fullName.trim() || !email.trim() || !password) {
      Alert.alert('Eksik bilgi', 'Ad soyad, email ve şifre zorunlu.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Şifre kısa', 'Şifre en az 6 karakter olmalı.');
      return;
    }

    setSubmitting(true);
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });
    if (signUpError || !signUpData.user) {
      setSubmitting(false);
      Alert.alert(
        'Kayıt başarısız',
        signUpError?.message ?? 'Bilinmeyen bir hata oluştu.'
      );
      return;
    }

    // Profile satırı oluştur
    const { error: profileError } = await supabase.from('profiles').insert({
      id: signUpData.user.id,
      role,
      full_name: fullName.trim(),
      phone: phone.trim() || null,
    });

    if (profileError) {
      setSubmitting(false);
      Alert.alert('Profil oluşturulamadı', profileError.message);
      return;
    }

    await refreshProfile();
    setSubmitting(false);
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
              {roleLabel} kaydı
            </Text>
            <Text className="mt-1 text-sm text-slate-500">
              Birkaç bilgi girip hesap oluştur.
            </Text>

            <View className="mt-8 gap-4">
              <Field
                label="Ad Soyad"
                placeholder="Yaşar Taymaz"
                value={fullName}
                onChangeText={setFullName}
              />
              <Field
                label="Telefon (opsiyonel)"
                placeholder="+905551112233"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
              <Field
                label="Email"
                placeholder="ornek@mail.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <Field
                label="Şifre"
                placeholder="En az 6 karakter"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              <Pressable
                disabled={submitting}
                onPress={onSubmit}
                className="mt-4 h-14 items-center justify-center rounded-2xl bg-brand-500 active:bg-brand-600 disabled:opacity-60"
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-lg font-semibold text-white">
                    Kayıt ol
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type FieldProps = {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
};

function Field({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
}: FieldProps) {
  return (
    <View>
      <Text className="mb-1 text-sm font-medium text-slate-700">{label}</Text>
      <TextInput
        className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-base text-slate-900"
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? 'sentences'}
        autoCorrect={false}
      />
    </View>
  );
}
