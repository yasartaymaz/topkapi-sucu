import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';
import { ChevronLeft, MapPin } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NeighborhoodPicker } from '@/components/NeighborhoodPicker';
import { useAuth } from '@/lib/auth';
import { qk } from '@/lib/queries';
import { supabase } from '@/lib/supabase';

export default function ServiceAreas() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [selected, setSelected] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const { data: vendor } = useQuery({
    queryKey: qk.myVendor(userId),
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendors_active' as any)
        .select('id, shop_name')
        .eq('profile_id', userId!)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });
  const vendorId = vendor?.id ?? null;

  const { data: existing, isLoading } = useQuery({
    queryKey: qk.myServiceAreas(vendorId),
    enabled: !!vendorId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendor_service_areas_active' as any)
        .select('id, neighborhood_id')
        .eq('vendor_id', vendorId!);
      if (error) throw error;
      return (data ?? []) as { id: string; neighborhood_id: string }[];
    },
  });

  useEffect(() => {
    if (existing) setSelected(existing.map((r) => r.neighborhood_id));
  }, [existing]);

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
      }));
      const { error } = await supabase.from('vendor_service_areas').insert(rows);
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

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-row items-center border-b border-slate-100 bg-white px-3 py-3">
        <Pressable onPress={() => router.back()} className="p-1">
          <ChevronLeft size={24} color="#0F172A" />
        </Pressable>
        <Text className="ml-1 flex-1 text-lg font-bold text-slate-900">
          Hizmet bölgem
        </Text>
        <Pressable onPress={onSave} disabled={submitting} className="px-2 py-1">
          {submitting ? (
            <ActivityIndicator color="#0369A1" />
          ) : (
            <Text className="text-base font-semibold text-brand-700">Kaydet</Text>
          )}
        </Pressable>
      </View>

      <View className="p-5">
        <View className="flex-row items-start rounded-2xl bg-white p-4">
          <View className="mt-0.5 h-10 w-10 items-center justify-center rounded-full bg-brand-100">
            <MapPin size={18} color="#0369A1" />
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-sm font-semibold text-slate-900">
              Hangi mahallelere teslim ediyorsun?
            </Text>
            <Text className="mt-1 text-xs text-slate-500">
              Seçtiğin mahallelerdeki müşteriler dükkanını görebilecek.
            </Text>
          </View>
        </View>

        <View className="mt-4">
          {isLoading ? (
            <ActivityIndicator color="#0EA5E9" />
          ) : (
            <NeighborhoodPicker
              multi
              value={selected}
              onChange={setSelected}
              placeholder="Mahalle seç"
            />
          )}
          <Text className="mt-2 text-xs text-slate-500">
            {selected.length} mahalle seçili.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
