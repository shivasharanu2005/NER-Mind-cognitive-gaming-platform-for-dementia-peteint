import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'org.nermind.patientapp',
  appName: 'NER-MIND Dementia Care',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    StatusBar: {
      overlaysWebView: false,
      style: 'DARK',
      backgroundColor: '#0f172a',
    },
    ScreenOrientation: {
      // Dementia-friendly interface is designed for comfortable upright tablet and phone use
    },
  },
};

export default config;

