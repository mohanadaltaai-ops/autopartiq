import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const fileEnv = loadEnv(mode, process.cwd(), '');
  const supabaseUrl = process.env.VITE_SUPABASE_URL || fileEnv.VITE_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || fileEnv.VITE_SUPABASE_ANON_KEY || '';
  const market = process.env.VITE_MARKET || fileEnv.VITE_MARKET || '';

  if (mode === 'ae') {
    console.log(`[Auto Parts AE build] mode=${mode}`);
    console.log(`[Auto Parts AE build] VITE_MARKET=${market || '(missing)'}`);
    console.log(`[Auto Parts AE build] VITE_SUPABASE_URL=${supabaseUrl ? 'set' : 'MISSING'}`);
    console.log(`[Auto Parts AE build] VITE_SUPABASE_ANON_KEY=${supabaseAnonKey ? 'set' : 'MISSING'}`);

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        'AE build requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY. Add them in Vercel → Environment Variables (Production), then redeploy with Clear build cache.'
      );
    }
  }

  return {
    plugins: [react()],
    server: {
      port: 5173
    }
  };
});
