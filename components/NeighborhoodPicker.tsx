import { useQuery } from '@tanstack/react-query';
import { Check, ChevronDown, Search, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '@/lib/supabase';

type Option = {
  id: string;
  name: string;
  district_id: string;
  district_name: string;
};

type SingleProps = {
  multi?: false;
  value: string | null;
  onChange: (id: string | null) => void;
  placeholder?: string;
};

type MultiProps = {
  multi: true;
  value: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
};

type Props = SingleProps | MultiProps;

export function NeighborhoodPicker(props: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const { data = [], isLoading } = useQuery({
    queryKey: ['neighborhoods-with-district'],
    queryFn: async (): Promise<Option[]> => {
      const { data, error } = await supabase
        .from('neighborhoods')
        .select('id, name, district_id, districts!inner(name)')
        .order('name');
      if (error) throw error;
      return (data ?? []).map((n: any) => ({
        id: n.id,
        name: n.name,
        district_id: n.district_id,
        district_name: (n as any).districts?.name ?? '',
      }));
    },
    staleTime: 1000 * 60 * 60, // 1 saat cache — lookup verisi değişmez
  });

  const selectedIds = useMemo(
    () => (props.multi ? new Set(props.value) : new Set(props.value ? [props.value] : [])),
    [props]
  );

  const selectedLabel = useMemo(() => {
    if (props.multi) {
      const count = props.value.length;
      if (count === 0) return null;
      if (count === 1) {
        const one = data.find((o) => o.id === props.value[0]);
        return one ? `${one.name} / ${one.district_name}` : '1 mahalle';
      }
      return `${count} mahalle seçildi`;
    }
    const one = data.find((o) => o.id === props.value);
    return one ? `${one.name} / ${one.district_name}` : null;
  }, [props, data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase('tr-TR');
    if (!q) return data;
    return data.filter(
      (o) =>
        o.name.toLocaleLowerCase('tr-TR').includes(q) ||
        o.district_name.toLocaleLowerCase('tr-TR').includes(q)
    );
  }, [data, search]);

  const toggle = (id: string) => {
    if (props.multi) {
      const set = new Set(props.value);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      props.onChange(Array.from(set));
    } else {
      props.onChange(id);
      setOpen(false);
    }
  };

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        className="h-12 flex-row items-center rounded-xl border border-slate-200 bg-slate-50 px-4"
      >
        <Text
          className={`flex-1 text-base ${selectedLabel ? 'text-slate-900' : 'text-slate-400'}`}
          numberOfLines={1}
        >
          {selectedLabel ?? props.placeholder ?? 'Mahalle seç'}
        </Text>
        <ChevronDown size={18} color="#94A3B8" />
      </Pressable>

      <Modal
        visible={open}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setOpen(false)}
      >
        <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
          <View className="flex-row items-center border-b border-slate-100 px-4 py-3">
            <Text className="flex-1 text-lg font-bold text-slate-900">
              Mahalle seç
            </Text>
            {props.multi && (
              <Pressable onPress={() => setOpen(false)} className="mr-2 px-3 py-2">
                <Text className="text-base font-semibold text-brand-700">
                  Tamam ({props.value.length})
                </Text>
              </Pressable>
            )}
            <Pressable onPress={() => setOpen(false)} className="p-1">
              <X size={24} color="#0F172A" />
            </Pressable>
          </View>

          <View className="px-4 py-3">
            <View className="h-11 flex-row items-center rounded-xl bg-slate-100 px-3">
              <Search size={18} color="#64748B" />
              <TextInput
                className="ml-2 flex-1 text-base text-slate-900"
                placeholder="Mahalle veya ilçe ara"
                placeholderTextColor="#94A3B8"
                value={search}
                onChangeText={setSearch}
                autoCorrect={false}
                autoCapitalize="none"
              />
            </View>
          </View>

          {isLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#0EA5E9" />
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <View className="items-center py-12">
                  <Text className="text-slate-400">Mahalle bulunamadı.</Text>
                </View>
              }
              renderItem={({ item }) => {
                const selected = selectedIds.has(item.id);
                return (
                  <Pressable
                    onPress={() => toggle(item.id)}
                    className={`flex-row items-center justify-between border-b border-slate-100 px-4 py-3 ${selected ? 'bg-brand-50' : 'bg-white'} active:bg-slate-50`}
                  >
                    <View className="flex-1 pr-3">
                      <Text className="text-base font-medium text-slate-900">
                        {item.name}
                      </Text>
                      <Text className="text-xs text-slate-500">
                        {item.district_name}
                      </Text>
                    </View>
                    {selected && <Check size={18} color="#0369A1" />}
                  </Pressable>
                );
              }}
            />
          )}
        </SafeAreaView>
      </Modal>
    </>
  );
}
