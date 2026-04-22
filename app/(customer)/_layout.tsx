import { Stack } from 'expo-router';

export default function CustomerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#fff' } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="addresses" />
      <Stack.Screen name="address-edit" options={{ presentation: 'modal' }} />
      <Stack.Screen name="profile" />
      <Stack.Screen name="vendor/[id]" />
      <Stack.Screen name="order/[id]" />
      <Stack.Screen name="orders" />
    </Stack>
  );
}
