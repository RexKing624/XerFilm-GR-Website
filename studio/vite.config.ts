import {defineConfig} from 'vite';
export default defineConfig({resolve:{alias:{vue:'vue/dist/vue.esm-bundler.js'}},server:{host:'127.0.0.1',port:5186,strictPort:true},build:{target:'es2022'}});
