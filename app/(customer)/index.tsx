import { useQuery } from '@tanstack/react-query';
import { Link, useRouter } from 'expo-router';
import { MapPin, Package, ShoppingBag, Store, User } from 'lucide-react-native';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/lib/auth';
import { formatTL, formatTime } from '@/lib/format';
import { qk } from '@/lib/queries';
import { supabase } from '@/lib/supabase';

type Address = {
  id: string;
  label: string;
  full_address: string;
  neighborhood_id: string;
  neighborhood_name: string;
  district_name: string;
};

type Vendor = {
  id: string;
  shop_name: string;
  phone: string | null;
  logo_path: string | null;
  delivery_fee: number;
  opens_at: string;
  closes_at: string;
};

export default function CustomerHome() {
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const { data: address, isLoading: addressLoading } = useQuery({
    queryKey: qk.defaultAddress(userId),
    enabled: !!userId,
    queryFn: async (): Promise<Address | null> => {
      const { data, error } = await supabase
        .from('customer_addresses_active' as any)
        .select(
          'id, label, full_address, neighborhood_id, neighborhoods_active!inner(name, districts_active!inner(name))'
        )
        .eq('customer_profile_id', userId!)
        .eq('is_default', true)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const row: any = data;
      return {
        id: row.id,
        label: row.label,
        full_address: row.full_address,
        neighborhood_id: row.neighborhood_id,
        neighborhood_name: row.neighborhoods_active?.name ?? '',
        district_name: row.neighborhoods_active?.districts_active?.name ?? '',
      };
    },
  });

  const neighborhoodId = address?.neighborhood_id ?? null;

  const { data: vendors = [], isLoading: vendorsLoading } = useQuery({
    queryKey: qk.vendorsByNeighborhood(neighborhoodId),
    enabled: !!neighborhoodId,
    queryFn: async (): Promise<Vendor[]> => {
      const { data, error } = await supabase
        .from('vendor_service_areas_active' as any)
        .select(
          'vendors_active!inner(id, shop_name, phone, logo_path, delivery_fee, opens_at, closes_at)'
        )
        .eq('neighborhood_id', neighborhoodId!);
      if (error) throw error;
      const seen = new Set<string>();
      const out: Vendor[] = [];
      for (const row of data ?? []) {
        const v: any = (row as any).vendors_active;
        if (!v || seen.has(v.id)) continue;
        seen.add(v.id);
        out.push(v);
      }
      return out;
    },
  });

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <View className="flex-row items-center justify-between px-5 pb-4 pt-2">
        <View>
          <Text className="text-xs text-slate-500">Hoş geldin</Text>
          <Text className="text-xl font-bold text-slate-900">Sucular</Text>
        </View>
        <View className="flex-row items-center gap-2">
          <Link href="/(customer)/orders" asChild>
            <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-white">
              <ShoppingBag size={20} color="#0F172A" />
            </Pressable>
          </Link>
          <Link href="/(customer)/profile" asChild>
            <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-white">
              <User size={20} color="#0F172A" />
            </Pressable>
          </Link>
        </View>
      </View>

      <View className="px-5">
        <Pressable
          onPress={() => router.push('/(customer)/addresses')}
          className="flex-row items-center rounded-2xl bg-white p-4 shadow-sm"
        >
          <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-100">
            <MapPin size={18} color="#0369A1" />
          </View>
          <View className="ml-3 flex-1">
            {addressLoading ? (
              <Text className="text-sm text-slate-500">Adres yükleniyor…</Text>
            ) : address ? (
              <>
                <Text className="text-xs font-semibold uppercase text-brand-700">
                  {address.label}
                </Text>
                <Text
                  className="mt-0.5 text-sm font-medium text-slate-900"
                  numberOfLines={1}
                >
                  {address.neighborhood_name} / {address.district_name}
                </Text>
              </>
            ) : (
              <>
                <Text className="text-sm font-semibold text-slate-900">
                  Adresini ekle
                </Text>
                <Text className="mt-0.5 text-xs text-slate-500">
                  Mahallendeki sucuları görmek için bir adres ekle.
                </Text>
              </>
            )}
          </View>
          <Text className="text-sm font-semibold text-brand-700">
            {address ? 'Değiştir' : 'Ekle'}
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={vendors}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20, gap: 12 }}
        ListEmptyComponent={
          <View className="items-center rounded-2xl bg-white p-8">
            {!address ? (
              <>
                <View className="h-14 w-14 items-center justify-center rounded-full bg-brand-100">
                  <MapPin size={24} color="#0369A1" />
                </View>
                <Text className="mt-3 text-center text-base font-semibold text-slate-900">
                  Önce adresini ekle
                </Text>
                <Text className="mt-1 text-center text-sm text-slate-500">
                  Mahallendeki sucuları burada göreceksin.
                </Text>
              </>
            ) : vendorsLoading ? (
              <ActivityIndicator color="#0EA5E9" />
            ) : (
              <>
                <View className="h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                  <Store size={24} color="#64748B" />
                </View>
                <Text className="mt-3 text-center text-base font-semibold text-slate-900">
                  Mahallenize hizmet veren sucu yok
                </Text>
                <Text className="mt-1 text-center text-sm text-slate-500">
                  Kısa süre içinde eklenecek.
                </Text>
              </>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <Link href={{ pathname: '/(customer)/vendor/[id]', params: { id: item.id } }} asChild>
            <Pressable className="flex-row items-center rounded-2xl bg-white p-4 active:bg-slate-50">
              <View className="h-14 w-14 items-center justify-center rounded-full bg-brand-100">
                <Store size={24} color="#0369A1" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-base font-semibold text-slate-900" numberOfLines={1}>
                  {item.shop_name}
                </Text>
                <Text className="text-xs text-slate-500">
                  {formatTime(item.opens_at)}–{formatTime(item.closes_at)} •{' '}
                  {Number(item.delivery_fee) > 0
                    ? `Teslim ${formatTL(item.delivery_fee)}`
                    : 'Ücretsiz teslim'}
                </Text>
              </View>
              <Package size={18} color="#94A3B8" />
            </Pressable>
          </Link>
        )}
      />
    </SafeAreaView>
  );
}
