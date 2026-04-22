import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, Stack, useRouter } from 'expo-router';
import { ChevronLeft, Home, Plus, Star } from 'lucide-react-native';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/lib/auth';
import { qk } from '@/lib/queries';
import { supabase } from '@/lib/supabase';

type Address = {
  id: string;
  label: string;
  full_address: string;
  is_default: boolean;
  neighborhood_id: string;
  neighborhood_name: string;
  district_name: string;
};

export default function Addresses() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const { data: addresses = [], isLoading, refetch } = useQuery({
    queryKey: qk.myAddresses(userId),
    enabled: !!userId,
    queryFn: async (): Promise<Address[]> => {
      const { data, error } = await supabase
        .from('customer_addresses_active' as any)
        .select(
          'id, label, full_address, is_default, neighborhood_id, neighborhoods_active!inner(name, districts_active!inner(name))'
        )
        .eq('customer_profile_id', userId!)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((row: any) => ({
        id: row.id,
        label: row.label,
        full_address: row.full_address,
        is_default: row.is_default,
        neighborhood_id: row.neighborhood_id,
        neighborhood_name: row.neighborhoods_active?.name ?? '',
        district_name: row.neighborhoods_active?.districts_active?.name ?? '',
      }));
    },
  });

  const setDefault = async (id: string) => {
    // Önce tüm adresleri default değil yap, sonra seçileni default yap
    const { error: clearErr } = await supabase
      .from('customer_addresses')
      .update({ is_default: false })
      .eq('customer_profile_id', userId!)
      .eq('is_default', true);
    if (clearErr) {
      Alert.alert('Hata', clearErr.message);
      return;
    }
    const { error } = await supabase
      .from('customer_addresses')
      .update({ is_default: true })
      .eq('id', id);
    if (error) {
      Alert.alert('Hata', error.message);
      return;
    }
    queryClient.invalidateQueries({ queryKey: qk.myAddresses(userId) });
    queryClient.invalidateQueries({ queryKey: qk.defaultAddress(userId) });
  };

  const remove = (id: string, label: string) => {
    Alert.alert('Adres silinsin mi?', `"${label}" silinecek.`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase
            .from('customer_addresses')
            .update({ deleted_at: new Date().toISOString(), is_default: false })
            .eq('id', id);
          if (error) {
            Alert.alert('Hata', error.message);
            return;
          }
          queryClient.invalidateQueries({ queryKey: qk.myAddresses(userId) });
          queryClient.invalidateQueries({ queryKey: qk.defaultAddress(userId) });
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-row items-center border-b border-slate-100 bg-white px-3 py-3">
        <Pressable onPress={() => router.back()} className="p-1">
          <ChevronLeft size={24} color="#0F172A" />
        </Pressable>
        <Text className="ml-1 flex-1 text-lg font-bold text-slate-900">
          Adreslerim
        </Text>
        <Link href="/(customer)/address-edit" asChild>
          <Pressable className="h-9 flex-row items-center rounded-full bg-brand-500 px-3 active:bg-brand-600">
            <Plus size={16} color="#fff" />
            <Text className="ml-1 text-sm font-semibold text-white">Yeni</Text>
          </Pressable>
        </Link>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0EA5E9" />
        </View>
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={(a) => a.id}
          contentContainerStyle={{ padding: 20, gap: 12 }}
          ListEmptyComponent={
            <View className="items-center rounded-2xl bg-white p-8">
              <View className="h-14 w-14 items-center justify-center rounded-full bg-brand-100">
                <Home size={24} color="#0369A1" />
              </View>
              <Text className="mt-3 text-center text-base font-semibold text-slate-900">
                Henüz adres yok
              </Text>
              <Text className="mt-1 text-center text-sm text-slate-500">
                Sipariş verebilmek için en az bir adres ekle.
              </Text>
              <Link href="/(customer)/address-edit" asChild>
                <Pressable className="mt-4 h-11 flex-row items-center rounded-xl bg-brand-500 px-4 active:bg-brand-600">
                  <Plus size={16} color="#fff" />
                  <Text className="ml-1 text-sm font-semibold text-white">
                    Adres ekle
                  </Text>
                </Pressable>
              </Link>
            </View>
          }
          renderItem={({ item }) => (
            <View className="rounded-2xl bg-white p-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Text className="text-base font-bold text-slate-900">
                    {item.label}
                  </Text>
                  {item.is_default && (
                    <View className="ml-2 flex-row items-center rounded-full bg-brand-100 px-2 py-0.5">
                      <Star size={10} color="#0369A1" />
                      <Text className="ml-1 text-[10px] font-semibold text-brand-700">
                        Varsayılan
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              <Text className="mt-1 text-sm text-slate-700">
                {item.neighborhood_name} / {item.district_name}
              </Text>
              <Text className="mt-0.5 text-sm text-slate-500" numberOfLines={2}>
                {item.full_address}
              </Text>

              <View className="mt-3 flex-row gap-2">
                {!item.is_default && (
                  <Pressable
                    onPress={() => setDefault(item.id)}
                    className="h-9 flex-row items-center rounded-lg bg-slate-100 px-3 active:bg-slate-200"
                  >
                    <Text className="text-xs font-semibold text-slate-700">
                      Varsayılan yap
                    </Text>
                  </Pressable>
                )}
                <Link
                  href={{
                    pathname: '/(customer)/address-edit',
                    params: { id: item.id },
                  }}
                  asChild
                >
                  <Pressable className="h-9 flex-row items-center rounded-lg bg-slate-100 px-3 active:bg-slate-200">
                    <Text className="text-xs font-semibold text-slate-700">
                      Düzenle
                    </Text>
                  </Pressable>
                </Link>
                <Pressable
                  onPress={() => remove(item.id, item.label)}
                  className="h-9 flex-row items-center rounded-lg bg-red-50 px-3 active:bg-red-100"
                >
                  <Text className="text-xs font-semibold text-red-700">Sil</Text>
                </Pressable>
              </View>
            </View>
          )}
          onRefresh={refetch}
          refreshing={false}
        />
      )}
    </SafeAreaView>
  );
}
