import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Check, ChevronDown, X } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/lib/auth';
import { qk } from '@/lib/queries';
import { supabase } from '@/lib/supabase';

type District = { id: string; name: string };
type Neighborhood = { id: string; name: string; district_id: string; district_name: string };

export default function AddressEdit() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const params = useLocalSearchParams<{ id?: string }>();
  const editingId = params.id ?? null;
  const isEdit = !!editingId;

  const [label, setLabel] = useState('Ev');
  const [districtId, setDistrictId] = useState<string | null>(null);
  const [neighborhoodId, setNeighborhoodId] = useState<string | null>(null);
  const [fullAddress, setFullAddress] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [districtModalOpen, setDistrictModalOpen] = useState(false);
  const [neighborhoodModalOpen, setNeighborhoodModalOpen] = useState(false);

  // Tüm mahalleler + ilçe bilgisi
  const { data: allNeighborhoods = [] } = useQuery({
    queryKey: ['neighborhoods-with-district'],
    queryFn: async (): Promise<Neighborhood[]> => {
      const { data, error } = await supabase
        .from('neighborhoods')
        .select('id, name, district_id, districts!inner(name)')
        .order('name');
      if (error) throw error;
      return (data ?? []).map((n: any) => ({
        id: n.id,
        name: n.name,
        district_id: n.district_id,
        district_name: n.districts?.name ?? '',
      }));
    },
    staleTime: 1000 * 60 * 60,
  });

  // Benzersiz ilçeler
  const districts = useMemo<District[]>(() => {
    const map = new Map<string, string>();
    for (const n of allNeighborhoods) {
      if (!map.has(n.district_id)) map.set(n.district_id, n.district_name);
    }
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'tr'));
  }, [allNeighborhoods]);

  // Seçili ilçenin mahalleleri
  const neighborhoodsInDistrict = useMemo<Neighborhood[]>(
    () => (districtId ? allNeighborhoods.filter((n) => n.district_id === districtId) : []),
    [allNeighborhoods, districtId]
  );

  const selectedDistrict = districts.find((d) => d.id === districtId);
  const selectedNeighborhood = allNeighborhoods.find((n) => n.id === neighborhoodId);

  // Mevcut adres (edit modu)
  const { data: existing } = useQuery({
    queryKey: ['address-edit', editingId],
    enabled: isEdit,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_addresses')
        .select('*')
        .eq('id', editingId!)
        .is('deleted_at', null)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });

  useEffect(() => {
    if (existing && allNeighborhoods.length > 0) {
      setLabel(existing.label);
      setNeighborhoodId(existing.neighborhood_id);
      setFullAddress(existing.full_address);
      setIsDefault(existing.is_default);
      // İlçeyi otomatik bul
      const n = allNeighborhoods.find((n) => n.id === existing.neighborhood_id);
      if (n) setDistrictId(n.district_id);
    }
  }, [existing, allNeighborhoods]);

  const onSubmit = async () => {
    if (!label.trim() || !neighborhoodId || !fullAddress.trim()) {
      Alert.alert('Eksik bilgi', 'Etiket, mahalle ve adres girmelisin.');
      return;
    }
    setSubmitting(true);

    // İlk adresse otomatik default yap
    let shouldBeDefault = isDefault;
    if (!isEdit && !isDefault) {
      const { count } = await supabase
        .from('customer_addresses')
        .select('id', { count: 'exact', head: true })
        .eq('customer_profile_id', userId!)
        .is('deleted_at', null);
      if ((count ?? 0) === 0) shouldBeDefault = true;
    }

    if (shouldBeDefault) {
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
        is_default: shouldBeDefault,
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
        {/* Header */}
        <View className="flex-row items-center border-b border-slate-100 px-4 py-3">
          <Pressable onPress={() => router.back()} className="px-2 py-1">
            <Text className="text-base text-slate-600">Vazgeç</Text>
          </Pressable>
          <Text className="flex-1 text-center text-lg font-bold text-slate-900">
            {isEdit ? 'Adresi düzenle' : 'Yeni adres'}
          </Text>
          <Pressable onPress={onSubmit} disabled={submitting} className="px-2 py-1">
            {submitting ? (
              <ActivityIndicator color="#0369A1" />
            ) : (
              <Text className="text-base font-semibold text-brand-700">Kaydet</Text>
            )}
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} keyboardShouldPersistTaps="handled">
          {/* Etiket */}
          <View>
            <Text className="mb-1 text-sm font-medium text-slate-700">Etiket</Text>
            <TextInput
              className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-base text-slate-900"
              placeholder="Ev, İş…"
              placeholderTextColor="#94A3B8"
              value={label}
              onChangeText={setLabel}
              autoCorrect={false}
            />
          </View>

          {/* İlçe seç */}
          <View>
            <Text className="mb-1 text-sm font-medium text-slate-700">İlçe</Text>
            <Pressable
              onPress={() => setDistrictModalOpen(true)}
              className="h-12 flex-row items-center rounded-xl border border-slate-200 bg-slate-50 px-4"
            >
              <Text
                className={`flex-1 text-base ${selectedDistrict ? 'text-slate-900' : 'text-slate-400'}`}
              >
                {selectedDistrict?.name ?? 'İlçe seç'}
              </Text>
              <ChevronDown size={18} color="#94A3B8" />
            </Pressable>
          </View>

          {/* Mahalle seç — sadece ilçe seçildikten sonra */}
          {districtId && (
            <View>
              <Text className="mb-1 text-sm font-medium text-slate-700">Mahalle</Text>
              <Pressable
                onPress={() => setNeighborhoodModalOpen(true)}
                className="h-12 flex-row items-center rounded-xl border border-slate-200 bg-slate-50 px-4"
              >
                <Text
                  className={`flex-1 text-base ${selectedNeighborhood ? 'text-slate-900' : 'text-slate-400'}`}
                >
                  {selectedNeighborhood?.name ?? 'Mahalle seç'}
                </Text>
                <ChevronDown size={18} color="#94A3B8" />
              </Pressable>
            </View>
          )}

          {/* Açık adres — sadece mahalle seçildikten sonra */}
          {neighborhoodId && (
            <>
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
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* İlçe Modal */}
      <Modal
        visible={districtModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setDistrictModalOpen(false)}
      >
        <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
          <View className="flex-row items-center border-b border-slate-100 px-4 py-3">
            <Text className="flex-1 text-lg font-bold text-slate-900">İlçe seç</Text>
            <Pressable onPress={() => setDistrictModalOpen(false)} className="p-1">
              <X size={24} color="#0F172A" />
            </Pressable>
          </View>
          <FlatList
            data={districts}
            keyExtractor={(d) => d.id}
            renderItem={({ item }) => {
              const isActive = item.id === districtId;
              return (
                <Pressable
                  onPress={() => {
                    if (item.id !== districtId) {
                      setDistrictId(item.id);
                      setNeighborhoodId(null); // ilçe değişince mahalleyi sıfırla
                    }
                    setDistrictModalOpen(false);
                  }}
                  className={`flex-row items-center justify-between border-b border-slate-100 px-5 py-4 active:bg-slate-50 ${isActive ? 'bg-brand-50' : 'bg-white'}`}
                >
                  <Text className={`text-base ${isActive ? 'font-semibold text-brand-700' : 'text-slate-900'}`}>
                    {item.name}
                  </Text>
                  {isActive && <Check size={18} color="#0369A1" />}
                </Pressable>
              );
            }}
          />
        </SafeAreaView>
      </Modal>

      {/* Mahalle Modal */}
      <Modal
        visible={neighborhoodModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setNeighborhoodModalOpen(false)}
      >
        <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
          <View className="flex-row items-center border-b border-slate-100 px-4 py-3">
            <Text className="flex-1 text-lg font-bold text-slate-900">
              {selectedDistrict?.name} — Mahalle seç
            </Text>
            <Pressable onPress={() => setNeighborhoodModalOpen(false)} className="p-1">
              <X size={24} color="#0F172A" />
            </Pressable>
          </View>
          <FlatList
            data={neighborhoodsInDistrict}
            keyExtractor={(n) => n.id}
            renderItem={({ item }) => {
              const isActive = item.id === neighborhoodId;
              return (
                <Pressable
                  onPress={() => {
                    setNeighborhoodId(item.id);
                    setNeighborhoodModalOpen(false);
                  }}
                  className={`flex-row items-center justify-between border-b border-slate-100 px-5 py-4 active:bg-slate-50 ${isActive ? 'bg-brand-50' : 'bg-white'}`}
                >
                  <Text className={`text-base ${isActive ? 'font-semibold text-brand-700' : 'text-slate-900'}`}>
                    {item.name}
                  </Text>
                  {isActive && <Check size={18} color="#0369A1" />}
                </Pressable>
              );
            }}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
