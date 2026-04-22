import { useQuery } from '@tanstack/react-query';
import { Link, Stack, useRouter } from 'expo-router';
import { ChevronLeft, Package, ShoppingBag } from 'lucide-react-native';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/lib/auth';
import { formatTL, ORDER_STATUS_COLOR, ORDER_STATUS_LABEL } from '@/lib/format';
import { qk } from '@/lib/queries';
import { supabase } from '@/lib/supabase';

type OrderRow = {
  id: string;
  status: string;
  total: number;
  qty: number;
  product_name_snapshot: string;
  created_at: string;
  vendor_id: string;
  vendor_shop_name: string;
};

export default function CustomerOrders() {
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: qk.myCustomerOrders(userId),
    enabled: !!userId,
    queryFn: async (): Promise<OrderRow[]> => {
      const { data, error } = await supabase
        .from('orders_active' as any)
        .select(
          'id, status, total, qty, product_name_snapshot, created_at, vendor_id, vendors_active!inner(shop_name)'
        )
        .eq('customer_profile_id', userId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r: any) => ({
        id: r.id,
        status: r.status,
        total: r.total,
        qty: r.qty,
        product_name_snapshot: r.product_name_snapshot,
        created_at: r.created_at,
        vendor_id: r.vendor_id,
        vendor_shop_name: r.vendors_active?.shop_name ?? '',
      }));
    },
  });

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-row items-center border-b border-slate-100 bg-white px-3 py-3">
        <Pressable onPress={() => router.back()} className="p-1">
          <ChevronLeft size={24} color="#0F172A" />
        </Pressable>
        <Text className="ml-1 flex-1 text-lg font-bold text-slate-900">
          Siparişlerim
        </Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0EA5E9" />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => o.id}
          contentContainerStyle={{ padding: 20, gap: 10 }}
          ListEmptyComponent={
            <View className="items-center rounded-2xl bg-white p-8">
              <ShoppingBag size={28} color="#94A3B8" />
              <Text className="mt-2 text-base font-semibold text-slate-900">
                Sipariş yok
              </Text>
              <Text className="mt-1 text-center text-sm text-slate-500">
                İlk siparişini vermek için bir sucu seç.
              </Text>
            </View>
          }
          onRefresh={refetch}
          refreshing={false}
          renderItem={({ item }) => {
            const palette =
              ORDER_STATUS_COLOR[item.status] ?? ORDER_STATUS_COLOR.pending;
            return (
              <Link
                href={{ pathname: '/(customer)/order/[id]', params: { id: item.id } }}
                asChild
              >
                <Pressable className="rounded-2xl bg-white p-4 active:bg-slate-50">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-base font-bold text-slate-900" numberOfLines={1}>
                      {item.vendor_shop_name}
                    </Text>
                    <View className={`rounded-full px-2 py-0.5 ${palette.bg}`}>
                      <Text className={`text-[11px] font-semibold ${palette.text}`}>
                        {ORDER_STATUS_LABEL[item.status] ?? item.status}
                      </Text>
                    </View>
                  </View>
                  <View className="mt-2 flex-row items-center">
                    <Package size={14} color="#64748B" />
                    <Text className="ml-1 text-sm text-slate-700">
                      {item.product_name_snapshot} × {item.qty}
                    </Text>
                  </View>
                  <View className="mt-2 flex-row items-center justify-between">
                    <Text className="text-xs text-slate-500">
                      {new Date(item.created_at).toLocaleString('tr-TR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                    <Text className="text-sm font-bold text-slate-900">
                      {formatTL(item.total)}
                    </Text>
                  </View>
                </Pressable>
              </Link>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
