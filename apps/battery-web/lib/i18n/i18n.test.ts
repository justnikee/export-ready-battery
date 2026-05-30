import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { resolveLocale, createTranslator, SUPPORTED_LOCALES } from './i18n'

describe('resolveLocale', () => {
  it('resolves "hi" from query param', () => {
    const params = new URLSearchParams('lang=hi')
    expect(resolveLocale(params)).toBe('hi')
  })

  it('resolves "ta" from query param', () => {
    const params = new URLSearchParams('lang=ta')
    expect(resolveLocale(params)).toBe('ta')
  })

  it('resolves "te" from query param', () => {
    const params = new URLSearchParams('lang=te')
    expect(resolveLocale(params)).toBe('te')
  })

  it('resolves "gu" from query param', () => {
    const params = new URLSearchParams('lang=gu')
    expect(resolveLocale(params)).toBe('gu')
  })

  it('falls back to "en" for unsupported query param', () => {
    const params = new URLSearchParams('lang=xx')
    expect(resolveLocale(params)).toBe('en')
  })

  it('falls back to browser language when no query param', () => {
    const originalLang = Object.getOwnPropertyDescriptor(window.navigator, 'language')
    Object.defineProperty(window.navigator, 'language', {
      value: 'hi-IN',
      configurable: true,
    })
    expect(resolveLocale()).toBe('hi')
    if (originalLang) {
      Object.defineProperty(window.navigator, 'language', originalLang)
    }
  })

  it('falls back to "en" when browser language is unsupported', () => {
    const originalLang = Object.getOwnPropertyDescriptor(window.navigator, 'language')
    Object.defineProperty(window.navigator, 'language', {
      value: 'ja-JP',
      configurable: true,
    })
    expect(resolveLocale()).toBe('en')
    if (originalLang) {
      Object.defineProperty(window.navigator, 'language', originalLang)
    }
  })
})

describe('createTranslator', () => {
  it('returns Hindi translation for known keys', () => {
    const t = createTranslator('hi')
    // "loading_title" should be translated in hi.json
    expect(t('loading_title')).not.toBe('loading_title')
    expect(t('loading_title')).toBeTruthy()
  })

  it('falls back to English for missing keys in Indian locales', () => {
    const t = createTranslator('hi')
    expect(t('this_key_does_not_exist')).toBe('this_key_does_not_exist')
  })

  it('supports variable replacement in Indian locales', () => {
    const t = createTranslator('hi')
    const result = t('label_months', { count: 6 })
    expect(result).toContain('6')
  })
})

describe('SUPPORTED_LOCALES', () => {
  it('includes all four Indian languages', () => {
    const codes = SUPPORTED_LOCALES.map((l) => l.code)
    expect(codes).toContain('hi')
    expect(codes).toContain('ta')
    expect(codes).toContain('te')
    expect(codes).toContain('gu')
  })

  it('includes English, French, and German', () => {
    const codes = SUPPORTED_LOCALES.map((l) => l.code)
    expect(codes).toContain('en')
    expect(codes).toContain('fr')
    expect(codes).toContain('de')
  })
})
