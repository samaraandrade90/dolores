import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'url';
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'


// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
     '@components': fileURLToPath(new URL('./src/components', import.meta.url)),
    }
  },
  optimizeDeps: {
    // Mantenha o exclude existente se for intencional
    exclude: ['lucide-react'],
    // ADICIONE ESTA SEÇÃO 'include' para os módulos que não estão sendo resolvidos
    include: [
      'firebase/app',           // Para resolver o import de firebase/app
      'firebase/messaging',     // Para resolver o import de firebase/messaging
      'firebase/analytics',     // Para resolver o import de firebase/analytics
      'react-beautiful-dnd',    // Para resolver o import de react-beautiful-dnd
      'date-fns/locale/pt-BR',  // Para resolver o import de date-fns/locale/pt-BR
      'react-day-picker',       // Para resolver o import de react-day-picker

      // Adicione aqui também os outros módulos do Radix UI que estavam dando problema se ainda aparecerem
      // Ex:
      // '@radix-ui/react-slot',
      // '@radix-ui/react-dropdown-menu',
      // '@radix-ui/react-avatar',
      // '@radix-ui/react-dialog',
      // 'class-variance-authority',
      // 'sonner', // Se o erro de sonner persistir
      // 'lucide-react', // Se ele também estiver dando problema e você não quiser excluí-lo
    ],
  }
})