import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { supabase } from './supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Kullanıcının cihazından Expo push token'ını ister ve profile satırına kaydeder.
 * - İzin verilmezse sessiz geçer (bu MVP'de kritik değil)
 * - Simülatörde çalışmaz (Device.isDevice false)
 */
export async function registerForPushAsync(userId: string) {
  if (!Device.isDevice) return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;

  const projectId =
    (process.env.EXPO_PUBLIC_EAS_PROJECT_ID as string | undefined) ?? undefined;

  try {
    const tokenResult = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    const token = tokenResult.data;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Sucu',
        importance: Notifications.AndroidImportance.HIGH,
      });
    }

    await supabase
      .from('profiles')
      .update({ expo_push_token: token })
      .eq('id', userId);

    return token;
  } catch {
    return null;
  }
}
