import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Camera, Package } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/lib/auth';
import { qk } from '@/lib/queries';
import { supabase } from '@/lib/supabase';

export default function ProductEdit() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const params = useLocalSearchParams<{ id?: string }>();
  const editingId = params.id ?? null;
  const isEdit = !!editingId;

  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [volume, setVolume] = useState('');
  const [price, setPrice] = useState('');
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [pickedUri, setPickedUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: vendor } = useQuery({
    queryKey: qk.myVendor(userId),
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendors_active' as any)
        .select('id')
        .eq('profile_id', userId!)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });
  const vendorId = vendor?.id ?? null;

  const { data: existing } = useQuery({
    queryKey: ['product-edit', editingId],
    enabled: isEdit,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products_active' as any)
        .select('*')
        .eq('id', editingId!)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });

  useEffect(() => {
    if (existing) {
      setName(existing.name ?? '');
      setBrand(existing.brand ?? '');
      setVolume(existing.volume_liters ? String(existing.volume_liters) : '');
      setPrice(String(existing.price ?? ''));
      setImagePath(existing.image_path);
    }
  }, [existing]);

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (res.canceled) return;
    setPickedUri(res.assets[0].uri);
  };

  const uploadIfNeeded = async (): Promise<string | null> => {
    if (!pickedUri || !vendorId) return imagePath;
    const ext = pickedUri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${Date.now()}.${ext}`;
    const path = `${vendorId}/${fileName}`;

    // React Native'de dosyayı fetch ile blob al, arrayBuffer çıkar
    const response = await fetch(pickedUri);
    const arrayBuffer = await response.arrayBuffer();

    const mime =
      ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

    const { error } = await supabase.storage
      .from('product-images')
      .upload(path, arrayBuffer, { contentType: mime, upsert: false });
    if (error) throw error;
    return path;
  };

  const onSubmit = async () => {
    if (!name.trim() || !price.trim() || !vendorId) {
      Alert.alert('Eksik bilgi', 'Ürün adı ve fiyat zorunlu.');
      return;
    }
    const priceNum = parseFloat(price.replace(',', '.'));
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      Alert.alert('Fiyat geçersiz', 'Geçerli bir fiyat gir (0 veya üstü).');
      return;
    }
    const volumeNum = volume.trim()
      ? parseFloat(volume.replace(',', '.'))
      : null;

    setSubmitting(true);
    let finalImagePath: string | null = imagePath;
    try {
      finalImagePath = await uploadIfNeeded();
    } catch (e: any) {
      setSubmitting(false);
      Alert.alert('Görsel yüklenemedi', e?.message ?? 'Bilinmeyen hata');
      return;
    }

    if (isEdit) {
      const { error } = await supabase
        .from('products')
        .update({
          name: name.trim(),
          brand: brand.trim() || null,
          volume_liters: volumeNum,
          price: priceNum,
          image_path: finalImagePath,
        })
        .eq('id', editingId!);
      if (error) {
        setSubmitting(false);
        Alert.alert('Hata', error.message);
        return;
      }
    } else {
      const { error } = await supabase.from('products').insert({
        vendor_id: vendorId,
        name: name.trim(),
        brand: brand.trim() || null,
        volume_liters: volumeNum,
        price: priceNum,
        image_path: finalImagePath,
      });
      if (error) {
        setSubmitting(false);
        Alert.alert('Hata', error.message);
        return;
      }
    }

    queryClient.invalidateQueries({ queryKey: qk.myProducts(vendorId) });
    queryClient.invalidateQueries({ queryKey: qk.vendorProducts(vendorId) });
    setSubmitting(false);
    router.back();
  };

  const previewUri = pickedUri
    ? pickedUri
    : imagePath
      ? supabase.storage.from('product-images').getPublicUrl(imagePath).data.publicUrl
      : null;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-row items-center border-b border-slate-100 px-4 py-3">
        <Pressable onPress={() => router.back()} className="px-2 py-1">
          <Text className="text-base text-slate-600">Vazgeç</Text>
        </Pressable>
        <Text className="flex-1 text-center text-lg font-bold text-slate-900">
          {isEdit ? 'Ürünü düzenle' : 'Yeni ürün'}
        </Text>
        <Pressable onPress={onSubmit} disabled={submitting} className="px-2 py-1">
          {submitting ? (
            <ActivityIndicator color="#0369A1" />
          ) : (
            <Text className="text-base font-semibold text-brand-700">Kaydet</Text>
          )}
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
          <Pressable
            onPress={pickImage}
            className="h-40 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50"
          >
            {previewUri ? (
              <Image
                source={{ uri: previewUri }}
                style={{ width: '100%', height: '100%', borderRadius: 16 }}
                contentFit="cover"
              />
            ) : (
              <View className="items-center">
                <View className="h-12 w-12 items-center justify-center rounded-full bg-brand-100">
                  <Camera size={20} color="#0369A1" />
                </View>
                <Text className="mt-2 text-sm font-medium text-slate-700">
                  Ürün fotoğrafı ekle
                </Text>
                <Text className="text-xs text-slate-500">Kare format önerilir</Text>
              </View>
            )}
          </Pressable>

          <Field
            label="Ürün adı"
            placeholder="Örn: Damacana Su"
            value={name}
            onChangeText={setName}
          />
          <Field
            label="Marka"
            placeholder="Örn: Hayat"
            value={brand}
            onChangeText={setBrand}
          />
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Field
                label="Hacim (L)"
                placeholder="19"
                value={volume}
                onChangeText={setVolume}
                keyboardType="decimal-pad"
              />
            </View>
            <View className="flex-1">
              <Field
                label="Fiyat (₺)"
                placeholder="120"
                value={price}
                onChangeText={setPrice}
                keyboardType="decimal-pad"
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: 'default' | 'decimal-pad';
}) {
  return (
    <View>
      <Text className="mb-1 text-sm font-medium text-slate-700">{label}</Text>
      <TextInput
        className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-base text-slate-900"
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCorrect={false}
      />
    </View>
  );
}
