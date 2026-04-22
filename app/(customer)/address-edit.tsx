import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NeighborhoodPicker } from '@/components/NeighborhoodPicker';
import { useAuth } from '@/lib/auth';
import { qk } from '@/lib/queries';
import { supabase } from '@/lib/supabase';

export default function AddressEdit() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const params = useLocalSearchParams<{ id?: string }>();
  const editingId = params.id ?? null;
  const isEdit = !!editingId;

  const [label, setLabel] = useState('Ev');
  const [neighborhoodId, setNeighborhoodId] = useState<string | null>(null);
  const [fullAddress, setFullAddress] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { data: existing } = useQuery({
    queryKey: ['address-edit', editingId],
    enabled: isEdit,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_addresses_active' as any)
        .select('*')
        .eq('id', editingId!)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });

  useEffect(() => {
    if (existing) {
      setLabel(existing.label);
      setNeighborhoodId(existing.neighborhood_id);
      setFullAddress(existing.full_address);
      setIsDefault(existing.is_default);
    }
  }, [existing]);

  const onSubmit = async () => {
    if (!label.trim() || !neighborhoodId || !fullAddress.trim()) {
      Alert.alert('Eksik bilgi', 'Etiket, mahalle ve adres girmelisin.');
      return;
    }
    setSubmitting(true);
    if (isDefault) {
      // Başka default adres varsa kaldır
      await supabase
        .from('customer_addresses')
        .update({ is_default: false })
        .eq('customer_profile_id', userId!)
        .eq('is_default', true)
        .neq('id', editingId ?? '00000000-0000-0000-0000-000000000000');
    }
    if (isEdit) {
      const { error } = await supabase
        .from('customer_addresses')
        .update({
          label: label.trim(),
          neighborhood_id: neighborhoodId,
          full_address: fullAddress.trim(),
          is_default: isDefault,
        })
        .eq('id', editingId!);
      if (error) {
        setSubmitting(false);
        Alert.alert('Hata', error.message);
        return;
      }
    } else {
      const { error } = await supabase.from('customer_addresses').insert({
        customer_profile_id: userId!,
        label: label.trim(),
        neighborhood_id: neighborhoodId,
        full_address: fullAddress.trim(),
        is_default: isDefault,
      });
      if (error) {
        setSubmitting(false);
        Alert.alert('Hata', error.message);
        return;
      }
    }
    queryClient.invalidateQueries({ queryKey: qk.myAddresses(userId) });
    queryClient.invalidateQueries({ queryKey: qk.defaultAddress(userId) });
    setSubmitting(false);
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View className="flex-row items-center border-b border-slate-100 px-4 py-3">
          <Pressable onPress={() => router.back()} className="px-2 py-1">
            <Text className="text-base text-slate-600">Vazgeç</Text>
          </Pressable>
          <Text className="flex-1 text-center text-lg font-bold text-slate-900">
            {isEdit ? 'Adresi düzenle' : 'Yeni adres'}
          </Text>
          <Pressable
            onPress={onSubmit}
            disabled={submitting}
            className="px-2 py-1"
          >
            {submitting ? (
              <ActivityIndicator color="#0369A1" />
            ) : (
              <Text className="text-base font-semibold text-brand-700">
                Kaydet
              </Text>
            )}
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
          <Field label="Etiket" placeholder="Ev, İş…" value={label} onChangeText={setLabel} />

          <View>
            <Text className="mb-1 text-sm font-medium text-slate-700">
              Mahalle
            </Text>
            <NeighborhoodPicker
              value={neighborhoodId}
              onChange={setNeighborhoodId}
              placeholder="Mahalle seç"
            />
          </View>

          <View>
            <Text className="mb-1 text-sm font-medium text-slate-700">
              Açık adres (sokak, bina, daire no)
            </Text>
            <TextInput
              className="min-h-24 rounded-xl border border-slate-200 bg-slate-50 p-4 text-base text-slate-900"
              placeholder="Örn: 1234. Sokak No:5 D:8"
              placeholderTextColor="#94A3B8"
              value={fullAddress}
              onChangeText={setFullAddress}
              multiline
              textAlignVertical="top"
            />
          </View>

          <View className="flex-row items-center justify-between rounded-xl bg-slate-50 p-4">
            <View className="flex-1 pr-3">
              <Text className="text-sm font-semibold text-slate-900">
                Varsayılan adres
              </Text>
              <Text className="text-xs text-slate-500">
                Sipariş verirken bu adres otomatik seçilir.
              </Text>
            </View>
            <Switch value={isDefault} onValueChange={setIsDefault} />
          </View>
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
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
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
        autoCorrect={false}
      />
    </View>
  );
}
