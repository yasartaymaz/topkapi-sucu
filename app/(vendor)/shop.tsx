import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, Stack, useRouter } from 'expo-router';
import { ChevronLeft, MapPin } from 'lucide-react-native';
import { useEffect, useState } from 'react';
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

import { useAuth } from '@/lib/auth';
import { qk } from '@/lib/queries';
import { supabase } from '@/lib/supabase';

export default function VendorShop() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [shopName, setShopName] = useState('');
  const [phone, setPhone] = useState('');
  const [opensAt, setOpensAt] = useState('09:00');
  const [closesAt, setClosesAt] = useState('21:00');
  const [deliveryFee, setDeliveryFee] = useState('0');
  const [submitting, setSubmitting] = useState(false);

  const { data: existing } = useQuery({
    queryKey: qk.myVendor(userId),
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('profile_id', userId!)
        .is('deleted_at', null)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });

  useEffect(() => {
    if (existing) {
      setShopName(existing.shop_name ?? '');
      setPhone(existing.phone ?? '');
      setOpensAt((existing.opens_at ?? '09:00:00').slice(0, 5));
      setClosesAt((existing.closes_at ?? '21:00:00').slice(0, 5));
      setDeliveryFee(String(existing.delivery_fee ?? 0));
    }
  }, [existing]);

  const onSubmit = async () => {
    if (!shopName.trim()) {
      Alert.alert('Eksik', 'Dükkan adı gerekli.');
      return;
    }
    if (!/^\d{2}:\d{2}$/.test(opensAt) || !/^\d{2}:\d{2}$/.test(closesAt)) {
      Alert.alert('Saat formatı', 'Saatler HH:MM formatında olmalı (ör: 09:00).');
      return;
    }
    const fee = parseFloat(deliveryFee.replace(',', '.'));
    if (!Number.isFinite(fee) || fee < 0) {
      Alert.alert('Teslim ücreti', 'Geçerli bir ücret gir (0 veya üstü).');
      return;
    }

    setSubmitting(true);
    if (existing) {
      const { error } = await supabase
        .from('vendors')
        .update({
          shop_name: shopName.trim(),
          phone: phone.trim() || null,
          opens_at: opensAt,
          closes_at: closesAt,
          delivery_fee: fee,
        })
        .eq('id', existing.id);
      if (error) {
        setSubmitting(false);
        Alert.alert('Hata', error.message);
        return;
      }
    } else {
      const { error } = await supabase.from('vendors').insert({
        profile_id: userId!,
        shop_name: shopName.trim(),
        phone: phone.trim() || null,
        opens_at: opensAt,
        closes_at: closesAt,
        delivery_fee: fee,
      });
      if (error) {
        setSubmitting(false);
        Alert.alert('Hata', error.message);
        return;
      }
    }

    queryClient.invalidateQueries({ queryKey: qk.myVendor(userId) });
    setSubmitting(false);

    if (!existing) {
      // İlk kurulumsa hizmet bölgesi seçimine yönlendir
      router.replace('/(vendor)/service-areas');
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-row items-center border-b border-slate-100 px-3 py-3">
        <Pressable onPress={() => router.back()} className="p-1">
          <ChevronLeft size={24} color="#0F172A" />
        </Pressable>
        <Text className="ml-1 flex-1 text-lg font-bold text-slate-900">
          Dükkan ayarları
        </Text>
        <Pressable onPress={onSubmit} disabled={submitting} className="px-2 py-1">
          {submitting ? (
            <ActivityIndicator color="#0369A1" />
          ) : (
            <Text className="text-base font-semibold text-brand-700">Kaydet</Text>
          )}
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
          <Field
            label="Dükkan adı"
            placeholder="Örn: Yaşar Su"
            value={shopName}
            onChangeText={setShopName}
          />
          <Field
            label="Telefon"
            placeholder="+905551112233"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Field
                label="Açılış"
                placeholder="09:00"
                value={opensAt}
                onChangeText={setOpensAt}
              />
            </View>
            <View className="flex-1">
              <Field
                label="Kapanış"
                placeholder="21:00"
                value={closesAt}
                onChangeText={setClosesAt}
              />
            </View>
          </View>

          <Field
            label="Teslim ücreti (₺)"
            placeholder="0"
            value={deliveryFee}
            onChangeText={setDeliveryFee}
            keyboardType="decimal-pad"
          />

          <Text className="text-xs text-slate-500">
            Teslim ücretini 0 bırakırsan ücretsiz teslim olarak gözükür.
          </Text>

          <Link href="/(vendor)/service-areas" asChild>
            <Pressable className="flex-row items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 active:bg-slate-100">
              <MapPin size={18} color="#0369A1" />
              <Text className="flex-1 text-sm font-semibold text-brand-700">
                Hizmet bölgelerini düzenle
              </Text>
            </Pressable>
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: 'default' | 'phone-pad' | 'decimal-pad';
}) {
  return (
    <View>
      <Text className="mb-1 text-sm font-medium text-slate-700">{label}</Text>
      <TextInput
        className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-base text-slate-900"
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCorrect={false}
      />
    </View>
  );
}
