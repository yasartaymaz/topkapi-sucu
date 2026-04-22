import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  Check,
  ChevronLeft,
  MapPin,
  Package,
  Phone,
  User as UserIcon,
} from 'lucide-react-native';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/lib/auth';
import { formatTL, ORDER_STATUS_COLOR, ORDER_STATUS_LABEL } from '@/lib/format';
import { sendOrderEvent } from '@/lib/orderEvents';
import { qk } from '@/lib/queries';
import { supabase } from '@/lib/supabase';

// Sipariş durumu geçişleri:
// pending → accepted → preparing → delivering → delivered
// Herhangi bir aşamada → canceled
const STATUS_TRANSITIONS: Record<string, { label: string; next: string }[]> = {
  pending: [
    { label: 'Onayla', next: 'accepted' },
    { label: 'Reddet', next: 'canceled' },
  ],
  accepted: [
    { label: 'Hazırlamaya başla', next: 'preparing' },
    { label: 'İptal et', next: 'canceled' },
  ],
  preparing: [
    { label: 'Yola çıkar', next: 'delivering' },
    { label: 'İptal et', next: 'canceled' },
  ],
  delivering: [
    { label: 'Teslim edildi', next: 'delivered' },
    { label: 'İptal et', next: 'canceled' },
  ],
  delivered: [],
  canceled: [],
};

export default function VendorOrderDetail() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const { id } = useLocalSearchParams<{ id: string }>();
  const orderId = id ?? null;

  const { data: order, isLoading } = useQuery({
    queryKey: qk.order(orderId),
    enabled: !!orderId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders_active' as any)
        .select('*')
        .eq('id', orderId!)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
    refetchInterval: 15_000,
  });

  const { data: history = [] } = useQuery({
    queryKey: qk.orderStatusHistory(orderId),
    enabled: !!orderId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_status_history')
        .select('id, status, created_at')
        .eq('order_id', orderId!)
        .order('created_at');
      if (error) throw error;
      return data ?? [];
    },
  });

  const updateStatus = async (next: string, label: string) => {
    Alert.alert(`${label}?`, 'Sipariş durumunu güncellemek istediğine emin misin?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: label,
        style: next === 'canceled' ? 'destructive' : 'default',
        onPress: async () => {
          const patch: any = { status: next };
          if (next === 'canceled') patch.canceled_reason = 'Sucu iptal etti';
          const { error } = await supabase
            .from('orders')
            .update(patch)
            .eq('id', orderId!);
          if (error) {
            Alert.alert('Hata', error.message);
            return;
          }
          await supabase.from('order_status_history').insert({
            order_id: orderId,
            status: next,
            changed_by: userId,
          });
          if (orderId) sendOrderEvent(orderId, 'status_changed');
          queryClient.invalidateQueries({ queryKey: qk.order(orderId) });
          queryClient.invalidateQueries({ queryKey: qk.orderStatusHistory(orderId) });
          queryClient.invalidateQueries({
            queryKey: qk.myVendorOrders(order?.vendor_id ?? null),
          });
        },
      },
    ]);
  };

  if (isLoading || !order) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color="#0EA5E9" />
      </SafeAreaView>
    );
  }

  const palette = ORDER_STATUS_COLOR[order.status] ?? ORDER_STATUS_COLOR.pending;
  const transitions = STATUS_TRANSITIONS[order.status] ?? [];
  const addr = order.address_snapshot as any;

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-row items-center border-b border-slate-100 bg-white px-3 py-3">
        <Pressable onPress={() => router.back()} className="p-1">
          <ChevronLeft size={24} color="#0F172A" />
        </Pressable>
        <Text className="ml-1 flex-1 text-base font-bold text-slate-900">
          Sipariş detayı
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
        <View className="rounded-2xl bg-white p-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-bold text-slate-900">
              #{String(order.id).slice(0, 8).toUpperCase()}
            </Text>
            <View className={`rounded-full px-2 py-0.5 ${palette.bg}`}>
              <Text className={`text-xs font-semibold ${palette.text}`}>
                {ORDER_STATUS_LABEL[order.status] ?? order.status}
              </Text>
            </View>
          </View>
          <Text className="mt-1 text-xs text-slate-500">
            {new Date(order.created_at).toLocaleString('tr-TR')}
          </Text>
        </View>

        <View className="rounded-2xl bg-white p-4">
          <View className="flex-row items-center">
            <UserIcon size={16} color="#0369A1" />
            <Text className="ml-2 text-xs font-semibold uppercase text-slate-500">
              Müşteri
            </Text>
          </View>
          <Text className="mt-2 text-sm font-semibold text-slate-900">
            {order.customer_name_snapshot ?? 'Müşteri'}
          </Text>
          {order.customer_phone_snapshot && (
            <Pressable
              onPress={() =>
                Linking.openURL(`tel:${order.customer_phone_snapshot}`)
              }
              className="mt-2 flex-row items-center rounded-lg bg-brand-50 px-3 py-2"
            >
              <Phone size={14} color="#0369A1" />
              <Text className="ml-2 text-sm font-semibold text-brand-700">
                {order.customer_phone_snapshot}
              </Text>
            </Pressable>
          )}
        </View>

        <View className="rounded-2xl bg-white p-4">
          <Text className="text-xs font-semibold uppercase text-slate-500">
            Ürün
          </Text>
          <View className="mt-2 flex-row items-center">
            <Package size={18} color="#0369A1" />
            <Text className="ml-2 flex-1 text-sm font-semibold text-slate-900">
              {order.product_name_snapshot}
            </Text>
            <Text className="text-sm text-slate-700">× {order.qty}</Text>
          </View>
          <View className="mt-3 h-px bg-slate-100" />
          <Row label="Ara toplam" value={formatTL(order.subtotal)} />
          <Row
            label="Teslim ücreti"
            value={
              Number(order.delivery_fee_snapshot) > 0
                ? formatTL(order.delivery_fee_snapshot)
                : 'Ücretsiz'
            }
          />
          <Row label="Toplam" value={formatTL(order.total)} bold />
        </View>

        <View className="rounded-2xl bg-white p-4">
          <View className="flex-row items-center">
            <MapPin size={16} color="#0369A1" />
            <Text className="ml-2 text-xs font-semibold uppercase text-slate-500">
              Teslim adresi
            </Text>
          </View>
          <Text className="mt-2 text-sm font-semibold text-slate-900">
            {addr?.neighborhood_name} / {addr?.district_name}
          </Text>
          <Text className="text-sm text-slate-600">{addr?.full_address}</Text>
          <Text className="mt-1 text-xs text-slate-500">
            Etiket: {addr?.label}
          </Text>
        </View>

        {order.customer_note && (
          <View className="rounded-2xl bg-amber-50 p-4">
            <Text className="text-xs font-semibold uppercase text-amber-800">
              Müşteri notu
            </Text>
            <Text className="mt-1 text-sm text-amber-900">
              {order.customer_note}
            </Text>
          </View>
        )}

        <View className="rounded-2xl bg-white p-4">
          <Text className="text-xs font-semibold uppercase text-slate-500">
            Durum geçmişi
          </Text>
          <View className="mt-3 gap-2">
            {history.map((h: any) => {
              const p =
                ORDER_STATUS_COLOR[h.status] ?? ORDER_STATUS_COLOR.pending;
              return (
                <View key={h.id} className="flex-row items-center">
                  <View
                    className={`h-6 w-6 items-center justify-center rounded-full ${p.bg}`}
                  >
                    <Check size={12} color="#0F172A" />
                  </View>
                  <Text className="ml-2 flex-1 text-sm font-medium text-slate-900">
                    {ORDER_STATUS_LABEL[h.status] ?? h.status}
                  </Text>
                  <Text className="text-xs text-slate-500">
                    {new Date(h.created_at).toLocaleTimeString('tr-TR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {transitions.length > 0 && (
          <View className="gap-2">
            {transitions.map((t) => {
              const destructive = t.next === 'canceled';
              return (
                <Pressable
                  key={t.next}
                  onPress={() => updateStatus(t.next, t.label)}
                  className={`h-14 items-center justify-center rounded-2xl ${destructive ? 'border border-red-200 bg-white active:bg-red-50' : 'bg-brand-500 active:bg-brand-600'}`}
                >
                  <Text
                    className={`text-base font-semibold ${destructive ? 'text-red-700' : 'text-white'}`}
                  >
                    {t.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <View className="flex-row items-center justify-between py-1">
      <Text
        className={`text-sm ${bold ? 'font-bold text-slate-900' : 'text-slate-700'}`}
      >
        {label}
      </Text>
      <Text
        className={`text-sm ${bold ? 'font-bold text-slate-900' : 'text-slate-700'}`}
      >
        {value}
      </Text>
    </View>
  );
}
