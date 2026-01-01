// Dynamic Expo config - supports environment variables and Sentry integration
export default {
    expo: {
        name: "WellFitGo",
        slug: "wellfitgo",
        version: "1.0.0",
        orientation: "portrait",
        icon: "./assets/images/icon.png",
        scheme: "wellfitgo",
        userInterfaceStyle: "automatic",
        newArchEnabled: true,

        ios: {
            supportsTablet: true,
            bundleIdentifier: "com.wellfitgo",
        },

        android: {
            package: "com.wellfitgo",
            adaptiveIcon: {
                backgroundColor: "#E6F4FE",
                foregroundImage: "./assets/images/adaptive-icon.png",
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
                    imageWidth: 100,
                    imageHeight: 100,
                    resizeMode: "contain",
                    backgroundColor: "#FFFFFF",
                    dark: {
                        backgroundColor: "#FFFFFF",
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
            // Sentry configuration
            [
                "@sentry/react-native/expo",
                {
                    organization: process.env.SENTRY_ORG,
                    project: process.env.SENTRY_PROJECT,
                    // Uncomment to enable source maps upload (requires auth token)
                    // url: "https://sentry.io/",
                },
            ],
        ],

        experiments: {
            typedRoutes: true,
            reactCompiler: true,
        },

        // Extra config accessible via expo-constants
        extra: {
            eas: {
                projectId: "2c9e9dcb-deb4-4884-83a9-0fcc7ed43e71",
            },
        },

        // Hooks for native builds
        hooks: {
            postPublish: [
                {
                    file: "@sentry/react-native/expo",
                    config: {
                        organization: process.env.SENTRY_ORG,
                        project: process.env.SENTRY_PROJECT,
                    },
                },
            ],
        },
    },
};
