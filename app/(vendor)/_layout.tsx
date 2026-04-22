import { Stack } from 'expo-router';

export default function VendorLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#fff' } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="shop" />
      <Stack.Screen name="service-areas" />
      <Stack.Screen name="products/index" />
      <Stack.Screen name="products/edit" options={{ presentation: 'modal' }} />
      <Stack.Screen name="orders" />
      <Stack.Screen name="order/[id]" />
      <Stack.Screen name="profile" />
    </Stack>
  );
}
