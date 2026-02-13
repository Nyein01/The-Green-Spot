import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  // Fix: Cast process to any to handle missing Node types for cwd()
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    server: {
      host: true, // This exposes the app to your local network (Wi-Fi)
    },
    define: {
      // This ensures process.env.API_KEY in your code is replaced with the actual value during build
      'process.env.API_KEY': JSON.stringify(env.API_KEY || "AIzaSyBNbaGjHax-W4T8nvQ22J1PhL8ttu9xGpQ")
    }
  };
});