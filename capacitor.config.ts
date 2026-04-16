import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ridertv.app',
  appName: 'Rider TV',
  webDir: 'out',
  plugins: {
    CapacitorHttp: {
      enabled: true
    }
  },
  server: {
    androidScheme: 'https',
    cleartext: true
  }
};

export default config;
