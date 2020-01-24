import { insertCurrencySymbol, isNumber, stripCurrencySymbolAndMinusSign } from './stringUtils'
import { toInteger } from './numberUtils'
import conformToMask from './conformToMask'
import createCurrencyFormat from './createCurrencyFormat';

export const currencyToNumber = (str, currencyFormat, valueAsInteger = false) => {
  if (typeof str === 'string') {
    if (isNumber(str)) {
      return toInteger(Number(str), valueAsInteger, currencyFormat.minimumFractionDigits)
    }
    let { value, negative } = stripCurrencySymbolAndMinusSign(str, currencyFormat)
    const numberParts = value.split(currencyFormat.decimalSymbol)
    if (numberParts.length > 2) {
      return null
    }
    const integer = numberParts[0].replace(new RegExp(`\\${currencyFormat.groupingSymbol}`, 'g'), '')
    if (integer.length && !integer.match(/^\d+$/g)) {
      return null
    }
    let number = integer
    if (numberParts.length === 2) {
      const fraction = numberParts[1]
      if (fraction.length && !fraction.match(/^\d+$/g)) {
        return null
      }
      number += `.${fraction}`
    }
    if (number) {
      if (negative) {
        number = `-${number}`
      }
      return toInteger(Number(number), valueAsInteger, currencyFormat.minimumFractionDigits)
    }
  }
  return null
}

export const numberToCurrency = (value, options) => {
  if (!value && !isNumber(value)) return null
  const { allowNegative, autoDecimalMode, locale } = options
  let distractionFree = options.distractionFree
  if (distractionFree === true || !distractionFree) {
    distractionFree = {
      hideCurrencySymbol: distractionFree,
      hideNegligibleDecimalDigits: distractionFree
    }
  }
  const { hideNegligibleDecimalDigits, hideCurrencySymbol } = distractionFree
  const currencyFormat = createCurrencyFormat(options)
  const { conformedValue, fractionDigits } = conformToMask(value, currencyFormat, '', hideCurrencySymbol, autoDecimalMode, allowNegative)
  if (typeof conformedValue === 'number') {
    const formattedValue = new Intl.NumberFormat(locale, {
      useGrouping: !(distractionFree.hideGroupingSymbol),
      minimumFractionDigits: hideNegligibleDecimalDigits ? fractionDigits.replace(/0+$/, '').length : Math.min(currencyFormat.minimumFractionDigits, fractionDigits.length),
      maximumFractionDigits: currencyFormat.maximumFractionDigits
    }).format(Math.abs(conformedValue))
    const isNegativeZero = conformedValue === 0 && (1 / conformedValue < 0)
    value = insertCurrencySymbol(formattedValue, currencyFormat, isNegativeZero || conformedValue < 0, hideCurrencySymbol)
  } else {
    value = conformedValue
  }
  return value
}
