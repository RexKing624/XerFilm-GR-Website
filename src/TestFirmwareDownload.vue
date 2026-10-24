<script setup>
import { computed, ref } from 'vue';
import EnhancedDownload from './EnhancedDownload.vue';
import ordinary from './gr3x-test-ordinary-release.json';
import enhanced from './gr3x-test-enhanced-release.json';
import { testFirmwareCopy } from './test-firmware-copy';

const props = defineProps({ language: String, t: Object, verified: Boolean, baseBusy: Boolean });
const emit = defineEmits(['busy']);
const variant = ref('ordinary');
const busy = ref(false);
const labels = computed(() => testFirmwareCopy[props.language]);
const release = computed(() => variant.value === 'ordinary' ? ordinary : enhanced);
const text = computed(() => ({ ...props.t, ...labels.value, enhancedDownloadFile: labels.value[variant.value === 'ordinary' ? 'ordinaryDownload' : 'enhancedDownload'] }));
function onBusy(value) { busy.value = value; emit('busy', value); }
</script>

<template>
  <EnhancedDownload id-prefix="gr3x-test" :release="release" :t="text" :verified="verified" :base-busy="baseBusy" @busy="onBusy">
    <div class="test-firmware-variants" role="group" :aria-label="labels.chooseVariant">
      <button v-for="type in ['ordinary', 'enhanced']" :key="type" type="button" class="outlined" :class="{ selected: variant === type }" :aria-pressed="variant === type" :disabled="baseBusy || busy" @click="variant = type">{{ labels[type] }}</button>
    </div>
  </EnhancedDownload>
</template>
