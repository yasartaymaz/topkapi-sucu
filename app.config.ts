import type { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Sucu',
  slug: 'sucu',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'sucu',
  userInterfaceStyle: 'light',
  newArchEnabled: true,
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.yasartaymaz.sucuapp',
    buildNumber: '1',
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      NSCameraUsageDescription:
        'Ürün ve dükkan fotoğrafı çekebilmek için kamera erişimi gereklidir.',
      NSPhotoLibraryUsageDescription:
        'Ürün ve dükkan fotoğrafı seçebilmek için fotoğraf kitaplığı erişimi gereklidir.',
    },
  },
  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#0EA5E9',
      },
    ],
    [
      'expo-notifications',
      {
        icon: './assets/images/icon.png',
        color: '#0EA5E9',
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission:
          'Ürün fotoğrafı seçebilmek için fotoğraf kitaplığı erişimi gereklidir.',
        cameraPermission:
          'Ürün fotoğrafı çekebilmek için kamera erişimi gereklidir.',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    eas: {
      projectId: 'af6ffb2a-05b1-47c5-a8cb-33b3f0f4e457',
    },
  },
});
