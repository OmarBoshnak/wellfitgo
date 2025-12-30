import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: process.env.EXPO_PUBLIC_APP_NAME || "WellFitGo",
  slug: "mobile",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "wellfitgo",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: process.env.EXPO_PUBLIC_BUNDLE_IDENTIFIER || "com.wellfitgo",
  },
  android: {
    package: process.env.EXPO_PUBLIC_BUNDLE_IDENTIFIER || "com.wellfitgo",
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
        dark: {
          backgroundColor: "#000000",
        },
      },
    ],
    [
      "expo-image-picker",
      {
        photosPermission: "Allow $(PRODUCT_NAME) to access your photos to update your profile picture.",
        cameraPermission: "Allow $(PRODUCT_NAME) to access your camera to take profile photos.",
      },
    ],
    [
      "@sentry/react-native/expo",
      {
        "url": "https://sentry.io/",
        "project": "mobile",
        "organization": "wellfitgo"
      }
    ]
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    eas: {
      projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID,
    },
    clerkPublishableKey: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
    convexUrl: process.env.EXPO_PUBLIC_CONVEX_URL,
    sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    posthogApiKey: process.env.EXPO_PUBLIC_POSTHOG_API_KEY,
    posthogHost: process.env.EXPO_PUBLIC_POSTHOG_HOST,
  },
});
