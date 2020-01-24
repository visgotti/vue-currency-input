import Vue from 'vue'
import { DEFAULT_OPTIONS } from './api'
import { getCaretPositionAfterFormat, getDistractionFreeCaretPosition, setCaretPosition } from './utils/caretPosition'
import conformToMask from './utils/conformToMask'
import createCurrencyFormat from './utils/createCurrencyFormat'
import dispatchEvent from './utils/dispatchEvent'
import equal from './utils/equal'
import { toFloat, toInteger } from './utils/numberUtils'
import { currencyToNumber } from './utils/parse'
import { insertCurrencySymbol } from './utils/stringUtils'

const init = (el, optionsFromBinding, { $CI_DEFAULT_OPTIONS }) => {
  const inputElement = el.tagName.toLowerCase() === 'input' ? el : el.querySelector('input')
  if (!inputElement) {
    throw new Error('No input element found')
  }
  const options = { ...($CI_DEFAULT_OPTIONS || DEFAULT_OPTIONS), ...optionsFromBinding }
  const { distractionFree, autoDecimalMode } = options
  if (typeof distractionFree === 'boolean') {
    options.distractionFree = {
      hideCurrencySymbol: distractionFree,
      hideNegligibleDecimalDigits: distractionFree,
      hideGroupingSymbol: distractionFree
    }
  }
  if (autoDecimalMode) {
    options.distractionFree.hideNegligibleDecimalDigits = false
  }
  const currencyFormat = createCurrencyFormat(options)
  inputElement.$ci = {
    ...inputElement.$ci || {},
    options,
    currencyFormat
  }
  return inputElement
}

const validateValueRange = (value, valueRange) => {
  if (valueRange) {
    const { min, max } = valueRange
    if (min !== undefined && value < min) {
      value = min
    }
    if (max !== undefined && value > max) {
      value = max
    }
  }
  return value
}

const applyFixedFractionFormat = (el, value, forcedChange) => {
  const { valueRange, locale, valueAsInteger } = el.$ci.options
  const { maximumFractionDigits, minimumFractionDigits } = el.$ci.currencyFormat
  const oldValue = el.$ci.numberValue
  if (value != null) {
    value = validateValueRange(value, valueRange)
    value = new Intl.NumberFormat(locale, { minimumFractionDigits, maximumFractionDigits }).format(value)
  }
  format(el, value)
  const newValue = el.$ci.numberValue
  if (oldValue !== newValue || forcedChange) {
    dispatchEvent(el, 'input')
    dispatchEvent(el, 'change', { numberValue: toInteger(newValue, valueAsInteger, maximumFractionDigits) })
  }
}

const updateInputValue = (el, value, hideNegligibleDecimalDigits = false) => {
  if (value != null) {
    const { focus, options: { allowNegative, autoDecimalMode, distractionFree, locale }, currencyFormat, previousConformedValue } = el.$ci
    const hideCurrencySymbol = focus && distractionFree.hideCurrencySymbol
    const { conformedValue, fractionDigits } = conformToMask(value, currencyFormat, previousConformedValue, hideCurrencySymbol, autoDecimalMode, allowNegative)
    if (typeof conformedValue === 'number') {
      const formattedValue = new Intl.NumberFormat(locale, {
        useGrouping: !(focus && distractionFree.hideGroupingSymbol),
        minimumFractionDigits: hideNegligibleDecimalDigits ? fractionDigits.replace(/0+$/, '').length : Math.min(currencyFormat.minimumFractionDigits, fractionDigits.length),
        maximumFractionDigits: currencyFormat.maximumFractionDigits
      }).format(Math.abs(conformedValue))
      const isNegativeZero = conformedValue === 0 && (1 / conformedValue < 0)
      el.value = insertCurrencySymbol(formattedValue, currencyFormat, isNegativeZero || conformedValue < 0, hideCurrencySymbol)
      el.$ci.numberValue = conformedValue
    } else {
      el.value = conformedValue
      el.$ci.numberValue = currencyToNumber(el.value, currencyFormat, false)
    }
  } else {
    el.value = el.$ci.numberValue = null
  }
  el.$ci.previousConformedValue = el.value
}

const format = (el, value) => {
  updateInputValue(el, value)
  let { numberValue, currencyFormat, options } = el.$ci
  if (numberValue != null) {
    numberValue = toInteger(numberValue, options.valueAsInteger, currencyFormat.maximumFractionDigits)
  }
  dispatchEvent(el, 'format-complete', { numberValue })
}

const addEventListener = (el) => {
  el.addEventListener('input', () => {
    const { value, selectionStart, $ci: { currencyFormat, options } } = el
    format(el, value)
    if (el.$ci.focus) {
      setCaretPosition(el, getCaretPositionAfterFormat(el.value, value, selectionStart, currencyFormat, options))
    }
  }, { capture: true })

  el.addEventListener('format', (e) => {
    const { currencyFormat, options, numberValue } = el.$ci
    const value = toFloat(e.detail.value, options.valueAsInteger, currencyFormat.maximumFractionDigits)
    if (value !== numberValue) {
      applyFixedFractionFormat(el, value)
    }
  })

  el.addEventListener('focus', () => {
    el.$ci.oldValue = el.$ci.numberValue
    el.$ci.focus = true
    const { hideCurrencySymbol, hideGroupingSymbol, hideNegligibleDecimalDigits } = el.$ci.options.distractionFree
    if (hideCurrencySymbol || hideGroupingSymbol || hideNegligibleDecimalDigits) {
      setTimeout(() => {
        const { value, selectionStart, selectionEnd } = el
        updateInputValue(el, el.value, hideNegligibleDecimalDigits)
        if (Math.abs(selectionStart - selectionEnd) > 0) {
          el.setSelectionRange(0, el.value.length)
        } else {
          setCaretPosition(el, getDistractionFreeCaretPosition(el.$ci.currencyFormat, el.$ci.options, value, selectionStart))
        }
      })
    }
  })

  el.addEventListener('blur', () => {
    el.$ci.focus = false
    applyFixedFractionFormat(el, el.$ci.numberValue, el.$ci.oldValue !== el.$ci.numberValue)
  })
}

export default {
  bind (el, { value: options }, { context }) {
    const inputElement = init(el, options, context)
    Vue.nextTick(() => {
      const { value, $ci: { currencyFormat, options } } = inputElement
      if (value) {
        applyFixedFractionFormat(inputElement, toFloat(currencyToNumber(value, currencyFormat), options.valueAsInteger, currencyFormat.maximumFractionDigits))
      }
    })
    addEventListener(inputElement)
  },
  componentUpdated (el, { value, oldValue }, { context }) {
    if (!equal(value, oldValue)) {
      const inputElement = init(el, value, context)
      applyFixedFractionFormat(inputElement, inputElement.$ci.numberValue, value.valueAsInteger !== oldValue.valueAsInteger)
    }
  }
}
