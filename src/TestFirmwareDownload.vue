<script setup>
import { computed, nextTick, onBeforeUnmount, ref, shallowRef, watch } from 'vue';
import { loadFirmware, unlockFirmware } from './download';
import { trackFirmwareDownload } from './download-statistics';
import { testFirmwareCopy } from './test-firmware-copy';

const props = defineProps({ releaseSet: { type: Object, required: true }, language: String, t: Object, verified: Boolean, baseBusy: Boolean });
const emit = defineEmits(['busy']);
const labels = computed(() => testFirmwareCopy[props.language]);
const id = computed(() => `${props.releaseSet.id}-test`);
const accepted = ref(false), password = ref(''), passwordError = ref(false), unlocking = ref(false);
const key = shallowRef(null), busyFile = ref(''), progress = ref(0), status = ref('');
const panel = ref(null);
let attempt = 0, controller;
function cancel() {
  controller?.abort(); controller = undefined; attempt++;
  busyFile.value = ''; unlocking.value = false; progress.value = 0; status.value = ''; emit('busy', false);
}
function reset() { cancel(); accepted.value = false; password.value = ''; passwordError.value = false; key.value = null; }
watch(accepted, value => { if (!value) reset(); });
watch(() => props.verified, value => { if (!value) reset(); });
watch(() => props.releaseSet, reset);
watch(password, () => { passwordError.value = false; });
async function unlock() {
  if (!props.verified || !accepted.value || props.baseBusy || unlocking.value || busyFile.value) return;
  const current = ++attempt; unlocking.value = true; passwordError.value = false; emit('busy', true);
  try {
    const unlocked = await unlockFirmware(props.releaseSet.firmware[0], password.value);
    if (current !== attempt || !props.verified || !accepted.value) return;
    key.value = unlocked; password.value = '';
    await nextTick(); panel.value?.querySelector('.test-bin-download')?.focus();
  } catch { if (current === attempt) passwordError.value = true; }
  finally { if (current === attempt) { unlocking.value = false; emit('busy', false); } }
}
async function download(asset) {
  if (!props.verified || !accepted.value || !key.value || props.baseBusy || unlocking.value || busyFile.value) return;
  const current = ++attempt, active = new AbortController(); controller = active;
  busyFile.value = asset.filename + asset.internalVersion; status.value = 'downloading'; progress.value = 0; emit('busy', true);
  try {
    const blob = await loadFirmware(asset, { decryptionKey: key.value, signal: active.signal, onProgress(value) { if (current === attempt) { progress.value = value; if (value === 1) status.value = 'checking'; } } });
    if (current !== attempt || !props.verified || !accepted.value || !key.value) return;
    const url = URL.createObjectURL(blob), anchor = document.createElement('a');
    anchor.href = url; anchor.download = asset.filename;
    panel.value?.append(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000);
    status.value = 'saved';
    if (!asset.supplement) trackFirmwareDownload(asset, asset.downloadVariant);
  } catch (error) { if (current === attempt && error.name !== 'AbortError') status.value = 'failed'; }
  finally { if (current === attempt) { busyFile.value = ''; controller = undefined; emit('busy', false); } }
}
onBeforeUnmount(reset);
</script>

<template>
  <section ref="panel" class="enhanced-download test-firmware-download" :data-testid="`${id}-zone`">
    <details class="enhanced-panel" @toggle="event => { if (!event.target.open) reset(); }">
      <summary :id="`${id}-title`"><span>{{ labels.title }} · {{ releaseSet.revision }}</span><span class="enhanced-chevron" aria-hidden="true">+</span></summary>
      <div class="enhanced-content">
        <strong class="enhanced-warning">{{ releaseSet.camera }} · {{ labels.warning }}</strong>
        <p class="enhanced-test-note">{{ labels.note }}</p>
        <p class="enhanced-file-meta">{{ labels.base }} {{ releaseSet.firmware[0].baseVersion }} · {{ labels.standard }} {{ releaseSet.firmware[0].installationVersion }} / {{ labels.enhanced }} {{ releaseSet.firmware[1].installationVersion }}</p>
        <label class="enhanced-ack" :class="{ checked: accepted }">
          <input v-model="accepted" type="checkbox" :disabled="baseBusy" :data-testid="`${id}-ack`">
          <span class="custom-check" aria-hidden="true">{{ accepted ? '✓' : '' }}</span><span>{{ labels.ack }}</span>
        </label>
        <form v-if="accepted && !key" class="enhanced-password" @submit.prevent="unlock">
          <label :for="`${id}-password`">{{ labels.password }}</label>
          <input :id="`${id}-password`" v-model="password" type="password" inputmode="numeric" autocomplete="off" required :disabled="baseBusy || unlocking" :placeholder="t.downloadPasswordPlaceholder" :aria-invalid="passwordError" :aria-describedby="passwordError ? `${id}-error` : undefined">
          <p v-if="passwordError" :id="`${id}-error`" class="enhanced-error" role="alert">{{ t.downloadPasswordError }}</p>
          <button class="outlined enhanced-unlock" type="submit" :disabled="baseBusy || unlocking || !verified">{{ unlocking ? t.checkingPassword : t.unlockDownload }} <span aria-hidden="true">↗</span></button>
        </form>
        <div v-if="accepted && key" class="test-unlocked" :data-testid="`${id}-downloads`">
          <p class="test-verified" role="status">{{ labels.passed }}</p>
          <div v-for="asset in releaseSet.firmware" :key="asset.internalVersion" class="test-download-file">
            <p class="enhanced-file-meta">{{ asset.internalVersion }} · {{ asset.installationVersion }} · {{ (asset.size / 1048576).toFixed(1) }} MiB</p>
            <button class="primary test-bin-download" :disabled="baseBusy || !!busyFile || !verified" @click="download(asset)"><span>{{ asset.downloadVariant === 'standard' ? labels.standardDownload : labels.enhancedDownload }}</span><span aria-hidden="true">↓</span></button>
          </div>
          <p class="download-hint">{{ t.downloadHint.replace('{filename}', releaseSet.firmware[0].filename) }}</p>
          <progress v-if="busyFile" :value="progress" max="1" :aria-label="t.downloading"></progress>
          <div class="download-feedback" aria-live="polite"><span v-if="status">{{ t[status] }} {{ busyFile ? `${Math.round(progress * 100)}%` : '' }}</span><button v-if="busyFile" class="text-link" @click="cancel">{{ t.cancel }}</button></div>
        </div>
      </div>
    </details>
  </section>
</template>

<style scoped>
.test-unlocked{margin-top:22px}.test-verified{font-size:12px;color:var(--accent);margin:0 0 18px}.test-download-file+.test-download-file{margin-top:20px}.test-download-file .enhanced-file-meta{margin-bottom:8px}
</style>
