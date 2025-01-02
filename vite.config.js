import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        coulomb_on_circle: resolve(__dirname, 'coulomb-on-circle/index.html'),
      },
    },
  },
})