import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';
import { Check, ChevronDown, ChevronLeft, MapPin, X } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/lib/auth';
import { qk } from '@/lib/queries';
import { supabase } from '@/lib/supabase';

type District = { id: string; name: string };
type Neighborhood = { id: string; name: string; district_id: string; district_name: string };

export default function ServiceAreas() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [selected, setSelected] = useState<string[]>([]);
  const [selectedDistrictId, setSelectedDistrictId] = useState<string | null>(null);
  const [districtModalOpen, setDistrictModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Vendor
  const { data: vendor } = useQuery({
    queryKey: qk.myVendor(userId),
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendors')
        .select('id')
        .eq('profile_id', userId!)
        .is('deleted_at', null)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });
  const vendorId = vendor?.id ?? null;

  // Mevcut hizmet bölgeleri
  const { data: existing, isLoading: existingLoading } = useQuery({
    queryKey: qk.myServiceAreas(vendorId),
    enabled: !!vendorId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendor_service_areas')
        .select('id, neighborhood_id')
        .eq('vendor_id', vendorId!)
        .is('deleted_at', null);
      if (error) throw error;
      return (data ?? []) as { id: string; neighborhood_id: string }[];
    },
  });

  useEffect(() => {
    if (existing) setSelected(existing.map((r) => r.neighborhood_id));
  }, [existing]);

  // Tüm mahalleler + ilçe bilgisi
  const { data: allNeighborhoods = [], isLoading: neighborhoodsLoading } = useQuery({
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

  // Seçili ilçeye ait mahalleler
  const neighborhoodsInDistrict = useMemo<Neighborhood[]>(() => {
    if (!selectedDistrictId) return [];
    return allNeighborhoods.filter((n) => n.district_id === selectedDistrictId);
  }, [allNeighborhoods, selectedDistrictId]);

  // Seçili mahallelerin tam bilgisi
  const selectedNeighborhoods = useMemo<Neighborhood[]>(() => {
    const set = new Set(selected);
    return allNeighborhoods.filter((n) => set.has(n.id));
  }, [allNeighborhoods, selected]);

  const selectedDistrict = districts.find((d) => d.id === selectedDistrictId);

  const toggleNeighborhood = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const removeNeighborhood = (id: string) => {
    setSelected((prev) => prev.filter((x) => x !== id));
  };

  const onSave = async () => {
    if (!vendorId) return;
    setSubmitting(true);

    const current = new Set(existing?.map((r) => r.neighborhood_id) ?? []);
    const next = new Set(selected);

    const toAdd = selected.filter((id) => !current.has(id));
    const toRemove = existing?.filter((r) => !next.has(r.neighborhood_id)) ?? [];

    if (toRemove.length > 0) {
      const ids = toRemove.map((r) => r.id);
      const { error } = await supabase
        .from('vendor_service_areas')
        .update({ deleted_at: new Date().toISOString() })
        .in('id', ids);
      if (error) {
        setSubmitting(false);
        Alert.alert('Hata', error.message);
        return;
      }
    }
    if (toAdd.length > 0) {
      const rows = toAdd.map((neighborhood_id) => ({
        vendor_id: vendorId,
        neighborhood_id,
        deleted_at: null,
      }));
      const { error } = await supabase
        .from('vendor_service_areas')
        .upsert(rows, { onConflict: 'vendor_id,neighborhood_id' });
      if (error) {
        setSubmitting(false);
        Alert.alert('Hata', error.message);
        return;
      }
    }

    queryClient.invalidateQueries({ queryKey: qk.myServiceAreas(vendorId) });
    setSubmitting(false);
    Alert.alert('Kaydedildi', 'Hizmet bölgelerin güncellendi.');
    router.back();
  };

  const isLoading = existingLoading || neighborhoodsLoading;

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View className="flex-row items-center border-b border-slate-100 bg-white px-3 py-3">
        <Pressable onPress={() => router.back()} className="p-1">
          <ChevronLeft size={24} color="#0F172A" />
        </Pressable>
        <Text className="ml-1 flex-1 text-lg font-bold text-slate-900">Hizmet bölgem</Text>
        <Pressable onPress={onSave} disabled={submitting} className="px-2 py-1">
          {submitting ? (
            <ActivityIndicator color="#0369A1" />
          ) : (
            <Text className="text-base font-semibold text-brand-700">Kaydet</Text>
          )}
        </Pressable>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0EA5E9" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} keyboardShouldPersistTaps="handled">

          {/* İlçe seç */}
          <View>
            <Text className="mb-2 text-sm font-semibold text-slate-700">İlçe</Text>
            <Pressable
              onPress={() => setDistrictModalOpen(true)}
              className="h-12 flex-row items-center rounded-xl border border-slate-200 bg-white px-4"
            >
              <Text
                className={`flex-1 text-base ${selectedDistrict ? 'text-slate-900' : 'text-slate-400'}`}
              >
                {selectedDistrict?.name ?? 'İlçe seç'}
              </Text>
              <ChevronDown size={18} color="#94A3B8" />
            </Pressable>
          </View>

          {/* Mahalle listesi */}
          {selectedDistrictId && (
            <View>
              <Text className="mb-2 text-sm font-semibold text-slate-700">
                {selectedDistrict?.name} mahalleleri
              </Text>
              <View className="overflow-hidden rounded-2xl bg-white">
                {neighborhoodsInDistrict.map((n, i) => {
                  const isSelected = selected.includes(n.id);
                  return (
                    <Pressable
                      key={n.id}
                      onPress={() => toggleNeighborhood(n.id)}
                      className={`flex-row items-center px-4 py-3 active:bg-slate-50 ${
                        i < neighborhoodsInDistrict.length - 1 ? 'border-b border-slate-100' : ''
                      } ${isSelected ? 'bg-brand-50' : 'bg-white'}`}
                    >
                      <Text className="flex-1 text-base text-slate-900">{n.name}</Text>
                      {isSelected && <Check size={18} color="#0369A1" />}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* Seçili mahalleler */}
          {selectedNeighborhoods.length > 0 && (
            <View>
              <View className="mb-2 flex-row items-center gap-2">
                <MapPin size={15} color="#0369A1" />
                <Text className="text-sm font-semibold text-slate-700">
                  Seçili mahalleler ({selectedNeighborhoods.length})
                </Text>
              </View>
              <View className="overflow-hidden rounded-2xl bg-white">
                {selectedNeighborhoods.map((n, i) => (
                  <View
                    key={n.id}
                    className={`flex-row items-center px-4 py-3 ${
                      i < selectedNeighborhoods.length - 1 ? 'border-b border-slate-100' : ''
                    }`}
                  >
                    <View className="flex-1">
                      <Text className="text-base text-slate-900">{n.name}</Text>
                      <Text className="text-xs text-slate-500">{n.district_name}</Text>
                    </View>
                    <Pressable
                      onPress={() => removeNeighborhood(n.id)}
                      hitSlop={8}
                      className="p-1"
                    >
                      <X size={16} color="#94A3B8" />
                    </Pressable>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      )}

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
              const isActive = item.id === selectedDistrictId;
              return (
                <Pressable
                  onPress={() => {
                    setSelectedDistrictId(item.id);
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
    </SafeAreaView>
  );
}
