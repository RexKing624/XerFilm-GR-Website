<script setup>
import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue';
import { loadFirmware, unlockFirmware } from './download';
import { trackFirmwareDownload } from './download-statistics';
import { firmwareBaseCopy } from './firmware-base-copy';
import { fileSize } from './releases';

const props = defineProps({ families: { type: Array, required: true }, language: { type: String, required: true }, t: { type: Object, required: true }, releaseCopy: { type: Object, required: true }, verified: Boolean, baseBusy: Boolean });
const emit = defineEmits(['busy']);
const labels = computed(() => firmwareBaseCopy[props.language]);
const selectedBase = ref('');
const selectedVariant = ref('standard');
const family = computed(() => props.families.find(item => item.id === selectedBase.value));
const release = computed(() => family.value?.[selectedVariant.value]);
const acceptedEnhanced = ref(false);
const acceptedTest = ref(false);
const busy = ref(false), unlocking = ref(false), progress = ref(0), status = ref('');
const password = ref(''), passwordError = ref(false), decryptionKey = shallowRef(null);
const allowed = computed(() => props.verified && !!release.value && !release.value.downloadSuspended && (!release.value.testRelease || acceptedTest.value) && (selectedVariant.value === 'standard' || acceptedEnhanced.value));
let controller, attempt = 0;
const shortVersion = item => item.installationVersion.split('.').slice(0, 2).join('.');
const baseLabel = item => (item.legacy ? labels.value.earlier : item.standard.selectionMinimumVersion ? labels.value.currentFrom : labels.value.current).replace('{version}', item.standard.selectionMinimumVersion || item.baseVersion);
const versionSummary = item => labels.value.identify.replace('{standard}', shortVersion(item.standard)).replace('{enhanced}', shortVersion(item.enhanced));
function cancel() { controller?.abort(); controller = undefined; attempt++; busy.value = false; unlocking.value = false; status.value = ''; progress.value = 0; emit('busy', false); }
function resetDownload() { cancel(); acceptedEnhanced.value = false; acceptedTest.value = false; password.value = ''; passwordError.value = false; decryptionKey.value = null; }
watch(selectedBase, () => { resetDownload(); selectedVariant.value = 'standard'; });
watch(selectedVariant, resetDownload);
watch(() => props.verified, value => { if (!value) { resetDownload(); selectedBase.value = ''; } });
watch(() => props.families, () => { resetDownload(); selectedBase.value = ''; });
watch(password, () => { passwordError.value = false; });
watch(acceptedTest, value => { if (!value) { cancel(); decryptionKey.value = null; password.value = ''; passwordError.value = false; } });
watch(acceptedEnhanced, value => { if (!value && selectedVariant.value === 'enhanced') { cancel(); decryptionKey.value = null; } });
async function unlock() {
  if (!allowed.value || props.baseBusy || busy.value || unlocking.value || !release.value.encryption) return;
  const current = ++attempt, target = release.value;
  unlocking.value = true; passwordError.value = false; emit('busy', true);
  try { const key = await unlockFirmware(target, password.value); if (current !== attempt || !allowed.value || target !== release.value) return; decryptionKey.value = key; password.value = ''; }
  catch { if (current === attempt) passwordError.value = true; }
  finally { if (current === attempt) { unlocking.value = false; emit('busy', false); } }
}
async function download() {
  if (!allowed.value || props.baseBusy || busy.value || unlocking.value || (release.value.encryption && !decryptionKey.value)) return;
  const current = ++attempt, target = release.value, active = new AbortController(); controller = active;
  busy.value = true; progress.value = 0; status.value = 'downloading'; emit('busy', true);
  try {
    const blob = await loadFirmware(target, { signal: active.signal, decryptionKey: decryptionKey.value, onProgress(value) { if (current === attempt) { progress.value = value; if (value === 1) status.value = 'checking'; } } });
    if (current !== attempt || !allowed.value || target !== release.value) return;
    const url = URL.createObjectURL(blob), anchor = document.createElement('a'); anchor.href = url; anchor.download = target.filename;
    document.querySelector('dialog[open]')?.append(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000);
    status.value = 'saved'; trackFirmwareDownload(target, selectedVariant.value);
  } catch (error) { if (current === attempt && error.name !== 'AbortError') status.value = 'failed'; }
  finally { if (current === attempt) { busy.value = false; controller = undefined; emit('busy', false); } }
}
onBeforeUnmount(resetDownload);
</script>

<template>
 <section class="firmware-selector" data-testid="firmware-selector">
  <p class="firmware-enhanced-policy" role="note">{{ labels.enhancedPolicy }}</p>
  <p v-for="item in families.filter(item => item.standard.downloadSuspended)" :key="`suspended-${item.id}`" class="firmware-downgrade-warning" role="alert" data-testid="base-suspension-notice">{{ labels.suspensionNote.replace('{version}',item.baseVersion) }}</p>
  <fieldset class="firmware-choice-step"><legend><span>01</span>{{ labels.chooseBase }}</legend><p class="firmware-step-help">{{ labels.baseHelp }}</p>
   <div class="firmware-base-options">
    <label v-for="item in families" :key="item.id" class="firmware-choice-card" :class="{selected:selectedBase === item.id,suspended:item.standard.downloadSuspended}" :data-testid="`base-${item.id}`">
     <input v-model="selectedBase" type="radio" name="firmware-base" :value="item.id" :disabled="baseBusy || item.standard.downloadSuspended"><span class="firmware-radio" aria-hidden="true"></span>
     <span class="firmware-choice-content"><small>{{ labels.baseVersion }} · <span class="firmware-release-channel" :class="{'is-test':item.standard.testRelease}" :data-testid="`channel-${item.id}`">{{ item.standard.downloadSuspended ? labels.suspended : item.standard.testRelease ? labels.test : labels.stable }}</span></small><strong>{{ baseLabel(item) }}</strong><span>{{ versionSummary(item) }}</span></span>
    </label>
   </div><p class="firmware-version-help">{{ labels.versionHelp }}</p>
  </fieldset>
  <template v-if="family">
   <fieldset class="firmware-choice-step firmware-variant-step"><legend><span>02</span>{{ labels.chooseVariant }}</legend>
    <div class="firmware-variant-options">
     <label v-for="variant in ['standard','enhanced']" :key="variant" class="firmware-choice-card" :class="{selected:selectedVariant === variant}" :data-testid="`variant-${variant}`">
      <input v-model="selectedVariant" type="radio" name="firmware-variant" :value="variant" :disabled="baseBusy"><span class="firmware-radio" aria-hidden="true"></span>
      <span class="firmware-choice-content"><strong>{{ labels[variant] }}<small v-if="variant === 'standard'" class="firmware-recommended">{{ labels.recommended }}</small></strong><span>{{ labels.installationVersion }} {{ shortVersion(family[variant]) }}</span><span class="firmware-variant-hint">{{ labels[`${variant}Hint`] }}</span><span v-if="variant === 'enhanced' && !family.legacy" class="firmware-downgrade-warning">{{ labels.cannotDowngrade.split(/[。.]/)[0] }}{{ language === 'en' ? '.' : '。' }}</span></span>
     </label>
    </div>
   </fieldset>
   <div class="firmware-selected-file" :key="`${selectedBase}-${selectedVariant}`">
    <p v-if="release.testRelease" class="firmware-test-note" role="note">{{ labels.testNote }}</p>
    <p class="release-description">{{ family.legacy ? releaseCopy.note : labels.latestNote.replace('{version}', family.baseVersion) }}</p>
    <p class="firmware-base-warning">{{ labels.wrongBase }}</p>
    <template v-if="selectedVariant === 'enhanced'"><p v-if="!family.legacy" class="firmware-downgrade-warning" role="note">{{ labels.cannotDowngrade }}</p><p class="firmware-enhanced-note">{{ labels.enhancedNote }}</p><label class="enhanced-ack" :class="{checked:acceptedEnhanced}"><input v-model="acceptedEnhanced" type="checkbox" :disabled="baseBusy || busy || unlocking" data-testid="enhanced-ack"><span class="custom-check" aria-hidden="true">{{ acceptedEnhanced ? '✓' : '' }}</span><span>{{ labels.enhancedAck }}</span></label></template>
    <label v-if="release.testRelease" class="enhanced-ack firmware-test-ack" :class="{checked:acceptedTest}"><input v-model="acceptedTest" type="checkbox" :disabled="baseBusy || busy || unlocking" data-testid="base-test-ack"><span class="custom-check" aria-hidden="true">{{ acceptedTest ? '✓' : '' }}</span><span>{{ labels.testAck }}</span></label>
    <dl class="file-details"><div><dt>{{ labels.baseVersion }}</dt><dd>{{ family.baseVersion }}</dd></div><div><dt>{{ t.release }}</dt><dd>{{ release.version }}<template v-if="release.testRelease"> · {{ labels.test }}</template> · {{ release.internalVersion }}</dd></div><div><dt>{{ labels.installationVersion }}</dt><dd>{{ release.installationVersion }}</dd></div><div><dt>{{ t.filename }}</dt><dd>{{ release.filename }}</dd></div><div><dt>{{ t.sizeLabel }}</dt><dd>{{ fileSize(release) }}</dd></div></dl>
    <form v-if="release.encryption && !decryptionKey && allowed" class="model-password" @submit.prevent="unlock"><label for="selected-download-password">{{ release.testRelease ? labels.testPassword : t.downloadPassword }}</label><input id="selected-download-password" v-model="password" type="password" autocomplete="off" :disabled="unlocking" required data-testid="base-test-password"><p v-if="passwordError" class="enhanced-error" role="alert">{{ t.downloadPasswordError }}</p><button class="outlined" type="submit" :disabled="unlocking || baseBusy" data-testid="base-test-unlock">{{ unlocking ? t.checkingPassword : t.unlockDownload }}</button></form>
    <template v-else><button class="primary actual-download" data-testid="selected-firmware-download" :disabled="!allowed || baseBusy || busy || unlocking || (release.encryption && !decryptionKey)" @click="download"><span>{{ busy ? t[status] : selectedVariant === 'enhanced' ? t.enhancedDownloadFile : t.downloadFile }}</span><span aria-hidden="true">↓</span></button><progress v-if="busy" :value="progress" max="1" :aria-label="t.downloading"></progress><div class="download-feedback" aria-live="polite"><span v-if="status">{{ t[status] }} {{ busy ? `${Math.round(progress*100)}%` : '' }}</span><button v-if="busy" class="text-link" @click="cancel">{{ t.cancel }}</button></div></template>
    <p class="download-hint">{{ t.downloadHint.replace('{filename}', release.filename) }}</p>
    <details class="firmware-file-checksum"><summary>{{ t.checksum }}</summary><code>{{ release.sha256 }}</code></details>
   </div>
  </template>
  <p v-else class="firmware-choice-pending" aria-live="polite">{{ labels.waiting }}</p>
 </section>
</template>
