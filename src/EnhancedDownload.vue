<script setup>
import { onBeforeUnmount, ref, shallowRef, watch } from 'vue';
import { loadFirmware, unlockFirmware } from './download';

const props = defineProps({ t: { type: Object, required: true }, release: { type: Object, required: true }, verified: Boolean, baseBusy: Boolean });
const emit = defineEmits(['busy']);
const accepted = ref(false);
const busy = ref(false);
const progress = ref(0);
const status = ref('');
const password = ref('');
const passwordError = ref(false);
const decryptionKey = shallowRef(null);
const unlocking = ref(false);
let controller;
let attempt = 0;

function cancel() {
  controller?.abort(); controller = undefined; attempt++;
  busy.value = false; unlocking.value = false; status.value = ''; progress.value = 0; emit('busy', false);
}
function reset() {
  cancel(); accepted.value = false; password.value = ''; passwordError.value = false; decryptionKey.value = null;
}
function onToggle(event) { if (!event.target.open) reset(); }
watch(accepted, value => { if (!value) reset(); });
watch(() => props.verified, value => { if (!value) reset(); });
watch(() => props.release, reset);
watch(password, () => { passwordError.value = false; });

async function unlock() {
  if (!props.verified || !accepted.value || props.baseBusy || busy.value || unlocking.value) return;
  const current = ++attempt;
  unlocking.value = true; passwordError.value = false; emit('busy', true);
  try {
    const key = await unlockFirmware(props.release, password.value);
    if (current !== attempt || !props.verified || !accepted.value) return;
    decryptionKey.value = key; password.value = '';
  } catch { if (current === attempt) passwordError.value = true; }
  finally { if (current === attempt) { unlocking.value = false; emit('busy', false); } }
}
async function download() {
  if (!props.verified || !accepted.value || props.baseBusy || busy.value || unlocking.value || (props.release.encryption && !decryptionKey.value)) return;
  const current = ++attempt; const active = new AbortController(); controller = active;
  const target = props.release;
  busy.value = true; progress.value = 0; status.value = 'downloading'; emit('busy', true);
  try {
    const blob = await loadFirmware(target, {
      signal: active.signal, decryptionKey: decryptionKey.value,
      onProgress(value) { if (current !== attempt) return; progress.value = value; if (value === 1) status.value = 'checking'; },
    });
    if (current !== attempt || !props.verified || !accepted.value) return;
    const url = URL.createObjectURL(blob); const anchor = document.createElement('a');
    anchor.href = url; anchor.download = target.filename;
    // Keep the programmatic click inside the modal's boundary.
    document.querySelector('dialog[open]')?.append(anchor);
    anchor.click(); anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000); status.value = 'saved';
  } catch (error) { if (current === attempt && error.name !== 'AbortError') status.value = 'failed'; }
  finally { if (current === attempt) { busy.value = false; controller = undefined; emit('busy', false); } }
}
onBeforeUnmount(reset);
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
        <div v-if="accepted" class="enhanced-file">
          <p class="enhanced-file-meta">{{ release.version }} · {{ release.installationVersion }} · {{ (release.size / 1048576).toFixed(1) }} MiB</p>
          <form v-if="release.encryption && !decryptionKey" class="enhanced-password" @submit.prevent="unlock">
            <label for="enhanced-password">{{ t.enhancedPassword }}</label>
            <input id="enhanced-password" v-model="password" type="password" inputmode="numeric" autocomplete="off" :placeholder="t.downloadPasswordPlaceholder" :aria-invalid="passwordError" :aria-describedby="passwordError ? 'enhanced-password-error' : undefined" :disabled="baseBusy || unlocking" required>
            <p v-if="passwordError" id="enhanced-password-error" class="enhanced-error" role="alert">{{ t.downloadPasswordError }}</p>
            <button class="outlined enhanced-unlock" type="submit" :disabled="baseBusy || unlocking || !verified">{{ unlocking ? t.checkingPassword : t.unlockDownload }} <span aria-hidden="true">↗</span></button>
          </form>
          <template v-else>
            <button class="primary enhanced-download-button" :disabled="baseBusy || busy || !verified" @click="download"><span>{{ busy ? t[status] : t.enhancedDownloadFile }}</span><span aria-hidden="true">↓</span></button>
            <progress v-if="busy" :value="progress" max="1" :aria-label="t.downloading"></progress>
            <div class="download-feedback" aria-live="polite"><span v-if="status">{{ t[status] }} {{ busy ? `${Math.round(progress * 100)}%` : '' }}</span><button v-if="busy" class="text-link" @click="cancel">{{ t.cancel }}</button></div>
            <p class="download-hint">{{ t.downloadHint.replace('{filename}', release.filename) }}</p>
          </template>
        </div>
      </div>
    </details>
  </section>
</template>
