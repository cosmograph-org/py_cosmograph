import { fromArrow } from 'arquero'
import { tableFromIPC } from 'apache-arrow';

export function getBasicMetaFromLinks (links: { source: string; target: string  }[]): { id: string }[] {
  return [
    ...new Set([
      ...links.map(d => d.source),
      ...links.map(d => d.target)
    ])
    
  ].map(d => ({ id: d }))
}

export function getTableFromBuffer <Datum>(buffer?: string): Datum[] | undefined {
  if (!buffer) return undefined
  const dataArrowTable = tableFromIPC(buffer);

  return (fromArrow(dataArrowTable).objects()).map(d => {
    Object.keys(d).forEach(key => {
      const value = d[key as keyof typeof d]
      d[key as keyof typeof d] = typeof value === 'bigint' ? Number(value) as never : value
    })
    return d as Datum
  })
}
