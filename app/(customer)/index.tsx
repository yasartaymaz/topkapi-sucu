import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useRouter } from 'expo-router';
import { ChevronRight, Droplets, MapPin, Pencil, Plus, Store } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomNav } from '@/components/BottomNav';
import { useAuth } from '@/lib/auth';
import { formatTL, formatTime, ORDER_STATUS_COLOR, ORDER_STATUS_LABEL } from '@/lib/format';
import { qk } from '@/lib/queries';
import { supabase } from '@/lib/supabase';

type Address = {
  id: string;
  label: string;
  full_address: string;
  neighborhood_id: string;
  neighborhood_name: string;
  district_name: string;
  is_default: boolean;
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

type ActiveOrder = {
  id: string;
  status: string;
  total: number;
  qty: number;
  product_name_snapshot: string;
  vendor_shop_name: string;
  created_at: string;
};

const ACTIVE_STATUSES = ['pending', 'accepted', 'preparing', 'delivering'];

export default function CustomerHome() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? null;

  // Tüm adresler
  const { data: allAddresses = [], isLoading: addressesLoading } = useQuery({
    queryKey: qk.myAddresses(userId),
    enabled: !!userId,
    queryFn: async (): Promise<Address[]> => {
      const { data, error } = await supabase
        .from('customer_addresses')
        .select('id, label, full_address, neighborhood_id, is_default, neighborhoods!inner(name, districts!inner(name))')
        .eq('customer_profile_id', userId!)
        .is('deleted_at', null)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []).map((r: any) => ({
        id: r.id,
        label: r.label,
        full_address: r.full_address,
        neighborhood_id: r.neighborhood_id,
        neighborhood_name: r.neighborhoods?.name ?? '',
        district_name: r.neighborhoods?.districts?.name ?? '',
        is_default: r.is_default,
      }));
    },
  });

  const defaultAddress = allAddresses.find((a) => a.is_default) ?? allAddresses[0] ?? null;
  const neighborhoodId = defaultAddress?.neighborhood_id ?? null;

  const [addressModalOpen, setAddressModalOpen] = useState(false);

  const setDefault = async (id: string) => {
    if (!userId) return;
    await supabase
      .from('customer_addresses')
      .update({ is_default: false })
      .eq('customer_profile_id', userId)
      .eq('is_default', true);
    await supabase
      .from('customer_addresses')
      .update({ is_default: true })
      .eq('id', id);
    queryClient.invalidateQueries({ queryKey: qk.myAddresses(userId) });
    queryClient.invalidateQueries({ queryKey: qk.defaultAddress(userId) });
    setAddressModalOpen(false);
  };

  // Açık siparişler
  const { data: activeOrders = [] } = useQuery({
    queryKey: ['customer-active-orders', userId],
    enabled: !!userId,
    queryFn: async (): Promise<ActiveOrder[]> => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, status, total, qty, product_name_snapshot, created_at, vendors!inner(shop_name)')
        .eq('customer_profile_id', userId!)
        .in('status', ACTIVE_STATUSES)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r: any) => ({
        id: r.id,
        status: r.status,
        total: r.total,
        qty: r.qty,
        product_name_snapshot: r.product_name_snapshot,
        vendor_shop_name: r.vendors?.shop_name ?? '',
        created_at: r.created_at,
      }));
    },
    refetchInterval: 15_000,
  });

  // Sucular
  const { data: vendors = [], isLoading: vendorsLoading } = useQuery({
    queryKey: qk.vendorsByNeighborhood(neighborhoodId),
    enabled: !!neighborhoodId,
    queryFn: async (): Promise<Vendor[]> => {
      const { data, error } = await supabase
        .from('vendor_service_areas')
        .select('vendors!inner(id, shop_name, phone, logo_path, delivery_fee, opens_at, closes_at)')
        .eq('neighborhood_id', neighborhoodId!)
        .is('deleted_at', null);
      if (error) throw error;
      const seen = new Set<string>();
      const out: Vendor[] = [];
      for (const row of data ?? []) {
        const v: any = (row as any).vendors;
        if (!v || seen.has(v.id)) continue;
        seen.add(v.id);
        out.push(v);
      }
      return out;
    },
  });

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <View className="px-5 pb-3 pt-2">
        <Text className="text-xs text-slate-500">Hoş geldin</Text>
        <Text className="text-xl font-bold text-slate-900">Sucular</Text>
      </View>

      {/* Adres kartı */}
      <View className="mx-5 flex-row items-center overflow-hidden rounded-2xl bg-white shadow-sm">
        <Pressable
          onPress={() => allAddresses.length > 0 && setAddressModalOpen(true)}
          className="flex-1 flex-row items-center p-4 active:bg-slate-50"
        >
          <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-100">
            <MapPin size={18} color="#0369A1" />
          </View>
          <View className="ml-3 flex-1">
            {addressesLoading ? (
              <Text className="text-sm text-slate-500">Yükleniyor…</Text>
            ) : defaultAddress ? (
              <>
                <Text className="text-xs font-semibold uppercase text-brand-700">
                  {defaultAddress.label}
                </Text>
                <Text className="mt-0.5 text-sm font-medium text-slate-900" numberOfLines={1}>
                  {defaultAddress.neighborhood_name} / {defaultAddress.district_name}
                </Text>
              </>
            ) : (
              <>
                <Text className="text-sm font-semibold text-slate-900">Adres seç</Text>
                <Text className="mt-0.5 text-xs text-slate-500">
                  Mahallendeki sucuları görmek için adres ekle.
                </Text>
              </>
            )}
          </View>
        </Pressable>

        {/* + butonu */}
        <Pressable
          onPress={() => router.push('/(customer)/address-edit')}
          className="border-l border-slate-100 px-4 py-4 active:bg-slate-50"
        >
          <Plus size={20} color="#0369A1" />
        </Pressable>
      </View>

      {/* Sucular listesi */}
      <FlatList
        data={vendors}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: 90 }}
        ListHeaderComponent={
          activeOrders.length > 0 ? (
            <View style={{ gap: 8, marginBottom: 4 }}>
              <Text className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Devam Eden Siparişler
              </Text>
              {activeOrders.map((order) => {
                const palette = ORDER_STATUS_COLOR[order.status] ?? ORDER_STATUS_COLOR.pending;
                return (
                  <Link
                    key={order.id}
                    href={{ pathname: '/(customer)/order/[id]', params: { id: order.id } }}
                    asChild
                  >
                    <Pressable className="overflow-hidden rounded-2xl bg-white active:bg-slate-50">
                      {/* Renkli üst şerit */}
                      <View className={`h-1 w-full ${palette.bg}`} />
                      <View className="p-4">
                        <View className="flex-row items-center justify-between">
                          <Text className="text-base font-bold text-slate-900" numberOfLines={1}>
                            {order.vendor_shop_name}
                          </Text>
                          <View className={`rounded-full px-2 py-0.5 ${palette.bg}`}>
                            <Text className={`text-[11px] font-semibold ${palette.text}`}>
                              {ORDER_STATUS_LABEL[order.status]}
                            </Text>
                          </View>
                        </View>
                        <Text className="mt-1 text-sm text-slate-600">
                          {order.product_name_snapshot} × {order.qty}
                        </Text>
                        <View className="mt-2 flex-row items-center justify-between">
                          <Text className="text-sm font-bold text-slate-900">
                            {formatTL(order.total)}
                          </Text>
                          <View className="flex-row items-center gap-1">
                            <Text className="text-xs text-brand-700 font-semibold">
                              Detay
                            </Text>
                            <ChevronRight size={14} color="#0369A1" />
                          </View>
                        </View>
                      </View>
                    </Pressable>
                  </Link>
                );
              })}
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View className="items-center rounded-2xl bg-white p-8">
            {!defaultAddress ? (
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
              <View className="h-9 w-9 items-center justify-center rounded-full bg-sky-100">
                <Droplets size={18} color="#38BDF8" />
              </View>
            </Pressable>
          </Link>
        )}
      />

      <BottomNav role="customer" active="home" />

      {/* Adres seçim modalı */}
      <Modal
        visible={addressModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setAddressModalOpen(false)}
      >
        <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
          <View className="flex-row items-center border-b border-slate-100 px-5 py-4">
            <Text className="flex-1 text-lg font-bold text-slate-900">Adreslerim</Text>
            <Pressable
              onPress={() => {
                setAddressModalOpen(false);
                router.push('/(customer)/address-edit');
              }}
              className="flex-row items-center gap-1 rounded-xl bg-brand-50 px-3 py-2"
            >
              <Plus size={16} color="#0369A1" />
              <Text className="text-sm font-semibold text-brand-700">Yeni adres</Text>
            </Pressable>
          </View>

          <FlatList
            data={allAddresses}
            keyExtractor={(a) => a.id}
            contentContainerStyle={{ padding: 16, gap: 8 }}
            renderItem={({ item }) => {
              const isActive = item.id === defaultAddress?.id;
              return (
                <Pressable
                  onPress={() => setDefault(item.id)}
                  className={`flex-row items-center rounded-2xl p-4 ${isActive ? 'bg-brand-50' : 'bg-slate-50'} active:opacity-70`}
                >
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2">
                      <Text className={`text-sm font-bold ${isActive ? 'text-brand-700' : 'text-slate-900'}`}>
                        {item.label}
                      </Text>
                      {isActive && (
                        <View className="rounded-full bg-brand-100 px-2 py-0.5">
                          <Text className="text-[10px] font-semibold text-brand-700">Aktif</Text>
                        </View>
                      )}
                    </View>
                    <Text className="mt-0.5 text-xs text-slate-500">
                      {item.neighborhood_name} / {item.district_name}
                    </Text>
                    <Text className="mt-0.5 text-xs text-slate-400" numberOfLines={1}>
                      {item.full_address}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => {
                      setAddressModalOpen(false);
                      router.push({
                        pathname: '/(customer)/address-edit',
                        params: { id: item.id },
                      });
                    }}
                    hitSlop={8}
                    className="ml-3 rounded-xl bg-white p-2"
                  >
                    <Pencil size={16} color="#64748B" />
                  </Pressable>
                </Pressable>
              );
            }}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
