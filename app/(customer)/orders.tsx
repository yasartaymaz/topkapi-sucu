import { useQuery } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomNav } from '@/components/BottomNav';
import { OrderList, type OrderRow } from '@/components/OrderList';
import { useAuth } from '@/lib/auth';
import { qk } from '@/lib/queries';
import { supabase } from '@/lib/supabase';

export default function CustomerOrders() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: qk.myCustomerOrders(userId),
    enabled: !!userId,
    queryFn: async (): Promise<OrderRow[]> => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, status, total, qty, product_name_snapshot, created_at, vendors!inner(shop_name)')
        .eq('customer_profile_id', userId!)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r: any) => ({
        id: r.id,
        status: r.status,
        total: r.total,
        qty: r.qty,
        product_name_snapshot: r.product_name_snapshot,
        created_at: r.created_at,
        primaryLabel: r.vendors?.shop_name ?? 'Sucu',
      }));
    },
  });

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="border-b border-slate-100 bg-white px-5 py-4">
        <Text className="text-xl font-bold text-slate-900">Siparişlerim</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0EA5E9" />
        </View>
      ) : (
        <OrderList
          orders={orders}
          role="customer"
          onRefresh={refetch}
        />
      )}
      <BottomNav role="customer" active="orders" />
    </SafeAreaView>
  );
}
