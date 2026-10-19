<script setup>
import { nextTick, onBeforeUnmount, ref, watch } from 'vue';
import enhancedRelease from './enhanced-release.json';
import { loadFirmware } from './download';

const props = defineProps({ t: { type: Object, required: true }, verified: Boolean, baseBusy: Boolean });
const emit = defineEmits(['busy']);
// Temporary browser-local test gate. Static assets remain directly addressable.
const TEST_PASSWORD = '1234';
const accepted = ref(false);
const password = ref('');
const unlocked = ref(false);
const passwordError = ref(false);
const busy = ref(false);
const progress = ref(0);
const status = ref('');
const downloadButton = ref(null);
let controller;
let attempt = 0;

function cancel() {
  controller?.abort(); controller = undefined; attempt++;
  busy.value = false; status.value = ''; progress.value = 0; emit('busy', false);
}
function reset() {
  cancel(); accepted.value = false; password.value = ''; unlocked.value = false; passwordError.value = false;
}
function onToggle(event) { if (!event.target.open) reset(); }
watch(accepted, value => { if (!value) reset(); });
watch(password, () => { passwordError.value = false; });
watch(() => props.verified, value => { if (!value) reset(); });

async function unlock() {
  if (!props.verified || !accepted.value || props.baseBusy) return;
  if (password.value !== TEST_PASSWORD) { passwordError.value = true; return; }
  unlocked.value = true; password.value = ''; passwordError.value = false;
  await nextTick(); downloadButton.value?.focus();
}
async function download() {
  if (!props.verified || !accepted.value || !unlocked.value || props.baseBusy || busy.value) return;
  const current = ++attempt; const active = new AbortController(); controller = active;
  busy.value = true; progress.value = 0; status.value = 'downloading'; emit('busy', true);
  try {
    const blob = await loadFirmware(enhancedRelease, {
      signal: active.signal,
      onProgress(value) { if (current !== attempt) return; progress.value = value; if (value === 1) status.value = 'checking'; },
    });
    if (current !== attempt || !props.verified || !accepted.value || !unlocked.value) return;
    const url = URL.createObjectURL(blob); const anchor = document.createElement('a');
    anchor.href = url; anchor.download = enhancedRelease.filename;
    document.body.append(anchor); anchor.click(); anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000); status.value = 'saved';
  } catch (error) { if (current === attempt && error.name !== 'AbortError') status.value = 'failed'; }
  finally { if (current === attempt) { busy.value = false; controller = undefined; emit('busy', false); } }
}
onBeforeUnmount(cancel);
</script>

<template>
  <section class="enhanced-download" aria-labelledby="enhanced-title">
    <p class="enhanced-intro">{{ t.enhancedIntro }}</p>
    <details class="enhanced-panel" @toggle="onToggle">
      <summary id="enhanced-title"><span>{{ t.enhancedTitle }}</span><span class="enhanced-chevron" aria-hidden="true">+</span></summary>
      <div class="enhanced-content">
        <strong class="enhanced-warning">{{ t.enhancedWarning }}</strong>
        <p class="enhanced-test-note">{{ t.enhancedTestNote }}</p>
        <label class="enhanced-ack" :class="{ checked: accepted }">
          <input v-model="accepted" type="checkbox" :disabled="baseBusy" data-testid="enhanced-ack">
          <span class="custom-check" aria-hidden="true">{{ accepted ? '✓' : '' }}</span>
          <span>{{ t.enhancedAck }}</span>
        </label>
        <form v-if="accepted && !unlocked" class="enhanced-password" @submit.prevent="unlock">
          <label for="enhanced-password">{{ t.enhancedPassword }}</label>
          <input id="enhanced-password" v-model="password" type="password" inputmode="numeric" autocomplete="off" :placeholder="t.enhancedPasswordPlaceholder" :aria-invalid="passwordError" aria-describedby="enhanced-password-error" :disabled="baseBusy" required>
          <p v-if="passwordError" id="enhanced-password-error" class="enhanced-error" role="alert">{{ t.enhancedPasswordError }}</p>
          <button class="outlined enhanced-unlock" type="submit" :disabled="baseBusy">{{ t.enhancedUnlock }} <span aria-hidden="true">↗</span></button>
        </form>
        <div v-if="accepted && unlocked" class="enhanced-file">
          <p class="enhanced-file-meta">v23-H · {{ enhancedRelease.installationVersion }} · {{ (enhancedRelease.size / 1048576).toFixed(1) }} MiB</p>
          <button ref="downloadButton" class="primary enhanced-download-button" :disabled="baseBusy || busy || !verified" @click="download"><span>{{ busy ? t[status] : t.enhancedDownloadFile }}</span><span aria-hidden="true">↓</span></button>
          <progress v-if="busy" :value="progress" max="1" :aria-label="t.downloading"></progress>
          <div class="download-feedback" aria-live="polite"><span v-if="status">{{ t[status] }} {{ busy ? `${Math.round(progress * 100)}%` : '' }}</span><button v-if="busy" class="text-link" @click="cancel">{{ t.cancel }}</button></div>
          <p class="download-hint">{{ t.downloadHint }}</p>
        </div>
      </div>
    </details>
  </section>
</template>
