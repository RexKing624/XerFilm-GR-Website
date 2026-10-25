import { initializeDownloadStatistics } from './download-statistics';
import { initializeExportStatistics } from './export-statistics';
import { createApp } from 'vue';
import App from './App.vue';
import './style.css';
initializeDownloadStatistics();
initializeExportStatistics();
createApp(App).mount('#app');
