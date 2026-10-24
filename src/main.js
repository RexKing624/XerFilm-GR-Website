import { initializeDownloadStatistics } from './download-statistics';
import { createApp } from 'vue';
import App from './App.vue';
import './style.css';
initializeDownloadStatistics();
createApp(App).mount('#app');
