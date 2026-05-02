import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Check, ChevronLeft, MapPin, Package, Star, Truck } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomNav } from '@/components/BottomNav';
import { useAuth } from '@/lib/auth';
import { formatTL, ORDER_STATUS_COLOR, ORDER_STATUS_LABEL } from '@/lib/format';
import { sendOrderEvent } from '@/lib/orderEvents';
import { qk } from '@/lib/queries';
import { supabase } from '@/lib/supabase';

export default function CustomerOrderDetail() {
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
        .from('orders')
        .select('*, vendors!inner(shop_name, phone)')
        .eq('id', orderId!)
        .is('deleted_at', null)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
    refetchInterval: 10_000, // polling — push gelene kadar manuel yenile
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

  const { data: review } = useQuery({
    queryKey: qk.orderReview(orderId),
    enabled: !!orderId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('id, rating, comment')
        .eq('order_id', orderId!)
        .is('deleted_at', null)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });

  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (isLoading || !order) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color="#0EA5E9" />
      </SafeAreaView>
    );
  }

  const palette = ORDER_STATUS_COLOR[order.status] ?? ORDER_STATUS_COLOR.pending;

  const cancelable = order.status === 'pending';
  const reviewable = order.status === 'delivered' && !review;

  const cancelOrder = () => {
    Alert.alert('Siparişi iptal et?', 'İptal edilmiş sipariş geri alınamaz.', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'İptal et',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase
            .from('orders')
            .update({ status: 'canceled', canceled_reason: 'Müşteri iptal etti' })
            .eq('id', order.id);
          if (error) {
            Alert.alert('Hata', error.message);
            return;
          }
          await supabase.from('order_status_history').insert({
            order_id: order.id,
            status: 'canceled',
            changed_by: userId,
          });
          sendOrderEvent(order.id, 'canceled_by_customer');
          queryClient.invalidateQueries({ queryKey: qk.order(orderId) });
          queryClient.invalidateQueries({ queryKey: qk.orderStatusHistory(orderId) });
          queryClient.invalidateQueries({ queryKey: qk.myCustomerOrders(userId) });
        },
      },
    ]);
  };

  const submitReview = async () => {
    if (reviewRating < 1) {
      Alert.alert('Puan seç', '1-5 arası bir puan seçmelisin.');
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from('reviews').insert({
      order_id: order.id,
      customer_profile_id: userId,
      vendor_id: order.vendor_id,
      rating: reviewRating,
      comment: reviewComment.trim() || null,
    });
    setSubmitting(false);
    if (error) {
      Alert.alert('Değerlendirme kaydedilemedi', error.message);
      return;
    }
    queryClient.invalidateQueries({ queryKey: qk.orderReview(orderId) });
    queryClient.invalidateQueries({ queryKey: qk.vendorReviewSummary(order.vendor_id) });
  };

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

      <ScrollView contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: 90 }}>
        <View className="rounded-2xl bg-white p-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-bold text-slate-900">
              {(order as any).vendors?.shop_name}
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
              Teslimat adresi
            </Text>
          </View>
          <Text className="mt-2 text-sm font-semibold text-slate-900">
            {addr?.label} — {addr?.neighborhood_name} / {addr?.district_name}
          </Text>
          <Text className="text-sm text-slate-600">{addr?.full_address}</Text>
        </View>

        {order.customer_note && (
          <View className="rounded-2xl bg-white p-4">
            <Text className="text-xs font-semibold uppercase text-slate-500">
              Notunuz
            </Text>
            <Text className="mt-1 text-sm text-slate-800">
              {order.customer_note}
            </Text>
          </View>
        )}

        <View className="rounded-2xl bg-white p-4">
          <View className="flex-row items-center">
            <Truck size={16} color="#0369A1" />
            <Text className="ml-2 text-xs font-semibold uppercase text-slate-500">
              Durum geçmişi
            </Text>
          </View>
          <View className="mt-3 gap-2">
            {history.map((h: any) => {
              const p = ORDER_STATUS_COLOR[h.status] ?? ORDER_STATUS_COLOR.pending;
              return (
                <View key={h.id} className="flex-row items-center">
                  <View className={`h-6 w-6 items-center justify-center rounded-full ${p.bg}`}>
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

        {review && (
          <View className="rounded-2xl bg-white p-4">
            <Text className="text-xs font-semibold uppercase text-slate-500">
              Değerlendirmen
            </Text>
            <View className="mt-2 flex-row">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={18}
                  color={i < review.rating ? '#F59E0B' : '#E2E8F0'}
                  fill={i < review.rating ? '#F59E0B' : '#E2E8F0'}
                />
              ))}
            </View>
            {review.comment && (
              <Text className="mt-1 text-sm text-slate-700">{review.comment}</Text>
            )}
          </View>
        )}

        {reviewable && (
          <View className="rounded-2xl bg-white p-4">
            <Text className="text-base font-bold text-slate-900">
              Siparişini değerlendir
            </Text>
            <View className="mt-3 flex-row gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Pressable
                  key={i}
                  onPress={() => setReviewRating(i + 1)}
                  hitSlop={8}
                >
                  <Star
                    size={32}
                    color={i < reviewRating ? '#F59E0B' : '#CBD5E1'}
                    fill={i < reviewRating ? '#F59E0B' : 'transparent'}
                  />
                </Pressable>
              ))}
            </View>
            <TextInput
              className="mt-3 min-h-20 rounded-xl border border-slate-200 bg-slate-50 p-4 text-base text-slate-900"
              placeholder="Yorumun (opsiyonel)"
              placeholderTextColor="#94A3B8"
              value={reviewComment}
              onChangeText={setReviewComment}
              multiline
              textAlignVertical="top"
            />
            <Pressable
              onPress={submitReview}
              disabled={submitting}
              className="mt-3 h-12 items-center justify-center rounded-xl bg-brand-500 active:bg-brand-600 disabled:opacity-60"
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-base font-semibold text-white">
                  Değerlendirmeyi gönder
                </Text>
              )}
            </Pressable>
          </View>
        )}

        {cancelable && (
          <Pressable
            onPress={cancelOrder}
            className="h-12 items-center justify-center rounded-xl border border-red-200 bg-white active:bg-red-50"
          >
            <Text className="text-base font-semibold text-red-700">
              Siparişi iptal et
            </Text>
          </Pressable>
        )}
      </ScrollView>
      <BottomNav role="customer" active="orders" />
    </SafeAreaView>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View className="flex-row items-center justify-between py-1">
      <Text className={`text-sm ${bold ? 'font-bold text-slate-900' : 'text-slate-700'}`}>
        {label}
      </Text>
      <Text className={`text-sm ${bold ? 'font-bold text-slate-900' : 'text-slate-700'}`}>
        {value}
      </Text>
    </View>
  );
}
