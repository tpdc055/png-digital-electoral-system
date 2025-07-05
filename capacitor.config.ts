import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'pg.gov.electoral.system',
  appName: 'PNG Electoral System',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      launchFadeOutDuration: 3000,
      backgroundColor: "#dc2626",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#ffffff",
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: "dark",
      backgroundColor: "#dc2626"
    },
    Camera: {
      permissions: ["camera", "photos"],
      saveToGallery: false
    },
    BiometricAuth: {
      allowDeviceCredential: true,
      fallbackTitle: "Use PIN/Password",
      negativeButtonText: "Cancel",
      subtitleText: "PNG Electoral Verification",
      descriptionText: "Verify your identity to access the digital voting booth"
    },
    Geolocation: {
      permissions: ["location"]
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#dc2626",
      sound: "beep.wav"
    },
    Keyboard: {
      resize: "body",
      style: "dark",
      resizeOnFullScreen: true
    },
    App: {
      launchUrl: "",
      iosCustomApplicationProtocols: ["pg-electoral"]
    }
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystorePassword: undefined,
      keystoreAlias: undefined,
      keystoreAliasPassword: undefined,
      releaseType: "APK",
      signingType: "apksigner"
    },
    webContentsDebuggingEnabled: true,
    allowMixedContent: false,
    captureInput: true,
    hideLogs: false,
    loggingBehavior: "none",
    path: "android"
  },
  ios: {
    scheme: "PNG Electoral System",
    path: "ios"
  }
};

export default config;
