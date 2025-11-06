import { Cosmograph } from '@cosmograph/cosmograph'
import { useEffect, useState } from 'preact/hooks'

interface PointInfoField {
  key: string
  value: string
  muted?: boolean
}

interface PointInfoContent {
  index: number
  fields: PointInfoField[]
}

export interface PointInfoPanelProps {
  cosmograph: Cosmograph | null
  selectedIndex: number | null
  onClose: () => void
}

function formatValue(value: unknown): { text: string; muted?: boolean } {
  if (typeof value === 'number') {
    return { text: Number.isInteger(value) ? value.toString() : value.toFixed(3) }
  }
  if (value === null || value === undefined) {
    return { text: 'null', muted: true }
  }
  return { text: String(value) }
}

export function PointInfoPanel({ cosmograph, selectedIndex, onClose }: PointInfoPanelProps) {
  const [info, setInfo] = useState<PointInfoContent | null>(null)

  useEffect(() => {
    let cancelled = false
    if (!cosmograph || selectedIndex === null || selectedIndex === undefined) {
      setInfo(null)
      return
    }

    void (async () => {
      try {
        const table: any = await cosmograph.getPointsByIndices([selectedIndex])
        if (cancelled) return
        if (!table || table.numRows === 0) {
          setInfo(null)
          return
        }

        const result: Record<string, unknown> = {}
        const schemaFields = table.schema?.fields ?? []
        schemaFields.forEach((field: any) => {
          const column = table.getChild(field.name)
          if (column && column.length > 0) {
            result[field.name] = column.get(0)
          }
        })

        const fields: PointInfoField[] = Object.entries(result)
          .filter(([key, value]) => {
            if (key.startsWith('_') || key.startsWith('__')) return false
            if (typeof value === 'object' && value !== null) return false
            return true
          })
          .slice(0, 8)
          .map(([key, value]) => {
            const formatted = formatValue(value)
            return { key, value: formatted.text, muted: formatted.muted }
          })

        setInfo({ index: selectedIndex, fields })
      } catch (error) {
        console.error('Error fetching point data:', error)
        if (!cancelled) setInfo(null)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [cosmograph, selectedIndex])

  if (!info) return null

  return (
    <div class="point-info-panel">
      <button class="point-info-close" onClick={onClose}>×</button>
      <div class="point-info-content">
        <div class="point-info-header">{`Point #${info.index}`}</div>
      </div>
      <div class="point-info-items">
        {info.fields.length === 0 ? (
          <div class="point-info-item">No displayable data</div>
        ) : (
          info.fields.map(field => (
            <div class="point-info-item" key={field.key}>
              <div class="point-info-label">{field.key}</div>
              <div class="point-info-value" style={field.muted ? { opacity: '0.5' } : undefined}>
                {field.value}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
