import type { AnyModel } from '@anywidget/types'

/**
 * Subscribes a callback function to a named event on the provided model.
 *
 * @param model - The model object to subscribe the callback to.
 * @param name - The name of the event to subscribe to.
 * @param callback - The function to call when the event is emitted.
 * @returns A function that can be called to unsubscribe the callback.
 */
export function subscribe(model: AnyModel, name: string, callback: () => void) {
  model.on(name, callback)
  return (): void => model.off(name, callback)
}

export const isDuckDBNumericType = (type: unknown): boolean => {
  return typeof type === 'string' && [
    'TINYINT',
    'SMALLINT',
    'INTEGER',
    'BIGINT',
    'HUGEINT',
    'UTINYINT',
    'USMALLINT',
    'UINTEGER',
    'UBIGINT',
    'UHUGEINT',
    'FLOAT',
    'DOUBLE',
    'DECIMAL',
  ].includes(type)
}

export const isDuckDBStringType = (type: unknown): boolean => {
  return typeof type === 'string' && [
    'VARCHAR',
  ].includes(type)
}
