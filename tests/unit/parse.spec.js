import { numberToCurrency, currencyToNumber } from '../../src/utils/parse'

describe('currencyToNumber', () => {
  it('returns null if the value is empty', () => {
    expect(currencyToNumber('', {})).toBeNull()
    expect(currencyToNumber(' ', {})).toBeNull()
    expect(currencyToNumber(null, {})).toBeNull()
    expect(currencyToNumber(undefined, {})).toBeNull()
  })

  it('returns null if the value is invalid', () => {
    expect(currencyToNumber('-', {})).toBeNull()
    expect(currencyToNumber('123e-1', {})).toBeNull()
    expect(currencyToNumber('0x11', {})).toBeNull()
    expect(currencyToNumber('0b11', {})).toBeNull()
    expect(currencyToNumber('0o11', {})).toBeNull()
    expect(currencyToNumber('1.2e1', { decimalSymbol: '.' })).toBeNull()
    expect(currencyToNumber('1.23.4', { decimalSymbol: '.' })).toBeNull()
  })

  it('returns the parsed number if the value conforms to the currency format config', () => {
    expect(currencyToNumber('1234', { decimalSymbol: '.' })).toBe(1234)
    expect(currencyToNumber('1234', { minimumFractionDigits: 3 }, true)).toBe(1234000)
    expect(currencyToNumber('1,234,567', { groupingSymbol: ',' })).toBe(1234567)
    expect(currencyToNumber('$1,234,567', { prefix: '$', groupingSymbol: ',' })).toBe(1234567)
    expect(currencyToNumber('1234 €', { suffix: ' €' })).toBe(1234)
    expect(currencyToNumber('-1234', { decimalSymbol: '.' })).toBe(-1234)
    expect(currencyToNumber('-$1234', { prefix: '$' })).toBe(-1234)
    expect(currencyToNumber('-1234 €', { suffix: ' €' })).toBe(-1234)
    expect(currencyToNumber('1234.5', { decimalSymbol: null, groupingSymbol: '.' })).toBe(1234.5)
    expect(currencyToNumber('.5', { decimalSymbol: '.' })).toBe(0.5)
    expect(currencyToNumber('0.5', { decimalSymbol: '.' })).toBe(0.5)
    expect(currencyToNumber('1234.50', { decimalSymbol: '.' })).toBe(1234.5)
    expect(currencyToNumber('$1234.50', { decimalSymbol: '.', prefix: '$' })).toBe(1234.5)
    expect(currencyToNumber('1234.50 €', { decimalSymbol: '.', suffix: ' €' })).toBe(1234.5)
    expect(currencyToNumber('1234.5', { decimalSymbol: '.' })).toBe(1234.5)
    expect(currencyToNumber('1234.00', { decimalSymbol: '.' })).toBe(1234)
    expect(currencyToNumber('1234.0', { decimalSymbol: '.' })).toBe(1234)
    expect(currencyToNumber('1234.50 €', { decimalSymbol: '.', suffix: ' €', minimumFractionDigits: 2 }, true)).toBe(123450)
  })

  it('returns null if the value does not conform to the currency format config', () => {
    expect(currencyToNumber('1234,5', { decimalSymbol: '.' })).toBeNull()
    expect(currencyToNumber('$1234', { suffix: ' €' })).toBeNull()
    expect(currencyToNumber('1234 €', { prefix: '$' })).toBeNull()
    expect(currencyToNumber('1,234,567', { groupingSymbol: '.' })).toBeNull()
  })
})

describe('numberToCurrency', () => {
  it('returns null if the value is falsey and not a number', () => {
    expect(numberToCurrency('', {})).toBeNull()
    expect(numberToCurrency(' ', {})).toBeNull()
    expect(numberToCurrency(null, {})).toBeNull()
    expect(numberToCurrency(undefined, {})).toBeNull()
  })

  it('returns null if the value is invalid', () => {
    expect(numberToCurrency('-', {})).toBeNull()
    expect(numberToCurrency('123e-1', {})).toBeNull()
    expect(numberToCurrency('0x11', {})).toBeNull()
    expect(numberToCurrency('0b11', {})).toBeNull()
    expect(numberToCurrency('0o11', {})).toBeNull()
    expect(numberToCurrency('1.2e1', { decimalSymbol: '.' })).toBeNull()
    expect(numberToCurrency('1.23.4', { decimalSymbol: '.' })).toBeNull()
  })

  it('returns the parsed currency if the value conforms to the currency format config', () => {
    expect(numberToCurrency(1234, { decimalSymbol: '.' })).toBe(1234)
  })
})
