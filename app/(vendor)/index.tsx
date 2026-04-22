import { useQuery } from '@tanstack/react-query';
import { Link, useRouter } from 'expo-router';
import {
  MapPin,
  Package,
  Settings,
  ShoppingBag,
  Store,
  User,
} from 'lucide-react-native';
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

type VendorRow = {
  id: string;
  shop_name: string;
};

type OrderRow = {
  id: string;
  status: string;
  total: number;
  qty: number;
  product_name_snapshot: string;
  customer_name_snapshot: string | null;
  created_at: string;
};

export default function VendorHome() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const userId = user?.id ?? null;

  const { data: vendor, isLoading: vendorLoading } = useQuery({
    queryKey: qk.myVendor(userId),
    enabled: !!userId,
    queryFn: async (): Promise<VendorRow | null> => {
      const { data, error } = await supabase
        .from('vendors_active' as any)
        .select('id, shop_name')
        .eq('profile_id', userId!)
        .maybeSingle();
      if (error) throw error;
      return data as VendorRow | null;
    },
  });

  const vendorId = vendor?.id ?? null;

  const { data: activeOrders = [], isLoading: ordersLoading, refetch } = useQuery({
    queryKey: qk.myVendorOrders(vendorId),
    enabled: !!vendorId,
    queryFn: async (): Promise<OrderRow[]> => {
      const { data, error } = await supabase
        .from('orders_active' as any)
        .select(
          'id, status, total, qty, product_name_snapshot, customer_name_snapshot, created_at'
        )
        .eq('vendor_id', vendorId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as OrderRow[];
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

  // Vendor row yoksa → onboarding
  if (!vendor) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
        <View className="flex-1 items-center justify-center px-6">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-brand-100">
            <Store size={36} color="#0369A1" />
          </View>
          <Text className="mt-4 text-2xl font-bold text-slate-900">
            Dükkanını kur
          </Text>
          <Text className="mt-2 text-center text-base text-slate-600">
            Müşterilerin seni bulabilmesi için dükkan bilgilerini gir.
          </Text>
          <Link href="/(vendor)/shop" asChild>
            <Pressable className="mt-6 h-14 items-center justify-center rounded-2xl bg-brand-500 px-8 active:bg-brand-600">
              <Text className="text-lg font-semibold text-white">
                Başla
              </Text>
            </Pressable>
          </Link>
        </View>
      </SafeAreaView>
    );
  }

  const pendingCount = activeOrders.filter((o) => o.status === 'pending').length;

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <View className="flex-row items-center justify-between bg-white px-5 py-4">
        <View className="flex-1 pr-3">
          <Text className="text-xs text-slate-500">Hoş geldin</Text>
          <Text className="text-lg font-bold text-slate-900" numberOfLines={1}>
            {vendor.shop_name}
          </Text>
        </View>
        <Link href="/(vendor)/profile" asChild>
          <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            <User size={20} color="#0F172A" />
          </Pressable>
        </Link>
      </View>

      <View className="flex-row flex-wrap gap-3 px-5 py-4">
        <ActionTile
          icon={<Package size={22} color="#0369A1" />}
          title="Ürünler"
          href="/(vendor)/products"
        />
        <ActionTile
          icon={<MapPin size={22} color="#0369A1" />}
          title="Hizmet bölgem"
          href="/(vendor)/service-areas"
        />
        <ActionTile
          icon={<Settings size={22} color="#0369A1" />}
          title="Dükkan ayarları"
          href="/(vendor)/shop"
        />
      </View>

      <View className="mt-2 flex-row items-center justify-between px-5">
        <Text className="text-lg font-bold text-slate-900">Siparişler</Text>
        {pendingCount > 0 && (
          <View className="rounded-full bg-amber-100 px-2 py-0.5">
            <Text className="text-xs font-semibold text-amber-800">
              {pendingCount} yeni
            </Text>
          </View>
        )}
      </View>

      <FlatList
        data={activeOrders}
        keyExtractor={(o) => o.id}
        contentContainerStyle={{ padding: 20, gap: 10 }}
        onRefresh={refetch}
        refreshing={false}
        ListEmptyComponent={
          <View className="items-center rounded-2xl bg-white p-8">
            <ShoppingBag size={28} color="#94A3B8" />
            <Text className="mt-2 text-base font-semibold text-slate-900">
              Henüz sipariş yok
            </Text>
            <Text className="mt-1 text-center text-sm text-slate-500">
              Müşteriler sipariş verdiğinde burada görünecek.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const palette = ORDER_STATUS_COLOR[item.status] ?? ORDER_STATUS_COLOR.pending;
          return (
            <Link
              href={{ pathname: '/(vendor)/order/[id]', params: { id: item.id } }}
              asChild
            >
              <Pressable className="rounded-2xl bg-white p-4 active:bg-slate-50">
                <View className="flex-row items-center justify-between">
                  <Text
                    className="flex-1 text-base font-bold text-slate-900"
                    numberOfLines={1}
                  >
                    {item.customer_name_snapshot ?? 'Müşteri'}
                  </Text>
                  <View className={`rounded-full px-2 py-0.5 ${palette.bg}`}>
                    <Text className={`text-[11px] font-semibold ${palette.text}`}>
                      {ORDER_STATUS_LABEL[item.status] ?? item.status}
                    </Text>
                  </View>
                </View>
                <Text className="mt-1 text-sm text-slate-700">
                  {item.product_name_snapshot} × {item.qty}
                </Text>
                <View className="mt-1 flex-row items-center justify-between">
                  <Text className="text-xs text-slate-500">
                    {new Date(item.created_at).toLocaleString('tr-TR', {
                      day: '2-digit',
                      month: '2-digit',
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
    </SafeAreaView>
  );
}

function ActionTile({
  icon,
  title,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  href: any;
}) {
  return (
    <Link href={href} asChild>
      <Pressable className="flex-1 basis-[30%] items-center rounded-2xl bg-white p-3 active:bg-slate-50">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-100">
          {icon}
        </View>
        <Text className="mt-2 text-center text-xs font-semibold text-slate-700">
          {title}
        </Text>
      </Pressable>
    </Link>
  );
}
