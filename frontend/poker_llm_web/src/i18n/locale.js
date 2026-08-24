import { computed, ref, watch } from 'vue'

export const GLOBAL_LOCALE_STORAGE_KEY = 'postsoma_locale_v1'
export const LEGACY_GUIDE_LOCALE_STORAGE_KEY = 'postsoma_decision_guide_lang'

const SUPPORTED_LOCALES = Object.freeze(['zh-CN', 'en'])

const normalizeLocale = (value) => {
  if (value === 'zh-CN' || value === 'zh') return 'zh-CN'
  if (value === 'en') return 'en'
  return null
}

const readStorageValue = (key) => {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

export const getInitialLocale = () => {
  if (typeof window === 'undefined') return 'en'

  const savedLocale = normalizeLocale(readStorageValue(GLOBAL_LOCALE_STORAGE_KEY))
  if (savedLocale) return savedLocale

  const legacyLocale = normalizeLocale(readStorageValue(LEGACY_GUIDE_LOCALE_STORAGE_KEY))
  if (legacyLocale) return legacyLocale

  return String(window.navigator?.language || '').toLowerCase().startsWith('zh')
    ? 'zh-CN'
    : 'en'
}

const localeState = ref(getInitialLocale())

export const locale = computed(() => localeState.value)
export const isZh = computed(() => localeState.value === 'zh-CN')

export const setLocale = (nextLocale) => {
  const normalized = normalizeLocale(nextLocale)
  if (!normalized || !SUPPORTED_LOCALES.includes(normalized)) return false

  localeState.value = normalized
  try {
    window.localStorage.setItem(GLOBAL_LOCALE_STORAGE_KEY, normalized)
  } catch {
    // Language switching remains available in memory when storage is unavailable.
  }
  return true
}

watch(localeState, (nextLocale) => {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = nextLocale
  }
}, { immediate: true })
