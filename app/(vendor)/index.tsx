import { useQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { MapPin, Package, Settings, Store } from 'lucide-react-native';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomNav } from '@/components/BottomNav';
import { OrderList, type OrderRow } from '@/components/OrderList';
import { useAuth } from '@/lib/auth';
import { qk } from '@/lib/queries';
import { supabase } from '@/lib/supabase';

type VendorRow = {
  id: string;
  shop_name: string;
};

export default function VendorHome() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const { data: vendor, isLoading: vendorLoading } = useQuery({
    queryKey: qk.myVendor(userId),
    enabled: !!userId,
    queryFn: async (): Promise<VendorRow | null> => {
      const { data, error } = await supabase
        .from('vendors')
        .select('id, shop_name')
        .eq('profile_id', userId!)
        .is('deleted_at', null)
        .maybeSingle();
      if (error) throw error;
      return data as VendorRow | null;
    },
  });

  const vendorId = vendor?.id ?? null;

  const { data: orders = [], isLoading: ordersLoading, refetch } = useQuery({
    queryKey: qk.myVendorOrders(vendorId),
    enabled: !!vendorId,
    queryFn: async (): Promise<OrderRow[]> => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, status, total, qty, product_name_snapshot, customer_name_snapshot, created_at')
        .eq('vendor_id', vendorId!)
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
        primaryLabel: r.customer_name_snapshot ?? 'Müşteri',
      }));
    },
    refetchInterval: 10_000,
  });

  if (vendorLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#0EA5E9" />
      </SafeAreaView>
    );
  }

  if (!vendor) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
        {/* Header */}
        <View className="bg-white px-5 py-4">
          <Text className="text-xl font-bold text-slate-900" numberOfLines={1}>
            Sucu paneli
          </Text>
        </View>

        <View className="flex-1 px-5 py-6">
          <View className="rounded-2xl bg-white p-5">
            <View className="h-14 w-14 items-center justify-center rounded-full bg-brand-100">
              <Store size={28} color="#0369A1" />
            </View>
            <Text className="mt-3 text-xl font-bold text-slate-900">Dükkanını kur</Text>
            <Text className="mt-1 text-sm text-slate-600">
              Müşterilerin seni bulabilmesi için dükkan bilgilerini gir. Birkaç dakika sürer.
            </Text>
            <Link href="/(vendor)/shop" asChild>
              <Pressable className="mt-4 h-12 items-center justify-center rounded-xl bg-brand-500 active:bg-brand-600">
                <Text className="text-base font-semibold text-white">Dükkan kur</Text>
              </Pressable>
            </Link>
          </View>
        </View>

        <BottomNav role="vendor" active="home" />
      </SafeAreaView>
    );
  }

  const pendingCount = orders.filter((o) => o.status === 'pending').length;

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      {/* Header */}
      <View className="bg-white px-5 py-4">
        <Text className="text-xl font-bold text-slate-900" numberOfLines={1}>
          {vendor.shop_name}
        </Text>
      </View>

      {/* Hızlı erişim tile'ları */}
      <View className="flex-row flex-wrap gap-3 px-5 py-4">
        <ActionTile icon={<Package size={22} color="#0369A1" />} title="Ürünler" href="/(vendor)/products" />
        <ActionTile icon={<MapPin size={22} color="#0369A1" />} title="Hizmet bölgem" href="/(vendor)/service-areas" />
        <ActionTile icon={<Settings size={22} color="#0369A1" />} title="Dükkan ayarları" href="/(vendor)/shop" />
      </View>

      {/* Siparişler başlığı */}
      <View className="flex-row items-center justify-between px-5">
        <Text className="text-lg font-bold text-slate-900">Siparişler</Text>
        {pendingCount > 0 && (
          <View className="rounded-full bg-amber-100 px-2 py-0.5">
            <Text className="text-xs font-semibold text-amber-800">{pendingCount} yeni</Text>
          </View>
        )}
      </View>

      {ordersLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#0EA5E9" />
        </View>
      ) : (
        <OrderList
          orders={orders}
          role="vendor"
          onRefresh={refetch}
        />
      )}

      <BottomNav role="vendor" active="home" />
    </SafeAreaView>
  );
}

function ActionTile({ icon, title, href }: { icon: import('react').ReactNode; title: string; href: any }) {
  return (
    <Link href={href} asChild>
      <Pressable className="flex-1 basis-[30%] items-center rounded-2xl bg-white p-3 active:bg-slate-50">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-100">
          {icon}
        </View>
        <Text className="mt-2 text-center text-xs font-semibold text-slate-700">{title}</Text>
      </Pressable>
    </Link>
  );
}

