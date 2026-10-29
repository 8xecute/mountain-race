import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({plugins:[react()],build:{rollupOptions:{output:{manualChunks:{three:['three','@react-three/fiber','@react-three/drei']}}}},server:{proxy:{'/socket.io':{target:'http://localhost:3042',ws:true}}}});

