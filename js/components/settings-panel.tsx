import { Cosmograph } from '@cosmograph/cosmograph'
import type { RenderProps } from '@anywidget/types'
import { useEffect, useMemo, useState } from 'preact/hooks'

import { subscribe } from '../helper'

type NumericSettingKey = Exclude<keyof SettingsState, 'showLabels'>

interface SliderControl {
  key: NumericSettingKey
  label: string
  min: number
  max: number
  step: number
  decimals: number
  modelKey: keyof ModelValues
}

type ModelValues = {
  point_size_scale: number | null
  simulation_gravity: number | null
  simulation_repulsion: number | null
  simulation_link_spring: number | null
  simulation_link_distance: number | null
  simulation_friction: number | null
  show_labels: boolean | null
  point_x_by?: unknown
  point_y_by?: unknown
  point_label_by?: unknown
}

type SettingsState = {
  pointSizeScale: number
  simulationGravity: number
  simulationRepulsion: number
  simulationLinkSpring: number
  simulationLinkDistance: number
  simulationFriction: number
  showLabels: boolean
}

const sliderControls: SliderControl[] = [
  { key: 'pointSizeScale', label: 'Point Size Scale', min: 0.1, max: 5, step: 0.1, decimals: 1, modelKey: 'point_size_scale' },
  { key: 'simulationGravity', label: 'Gravity', min: 0, max: 0.5, step: 0.01, decimals: 2, modelKey: 'simulation_gravity' },
  { key: 'simulationRepulsion', label: 'Repulsion', min: 0, max: 2, step: 0.01, decimals: 2, modelKey: 'simulation_repulsion' },
  { key: 'simulationLinkSpring', label: 'Link Strength', min: 0, max: 2, step: 0.01, decimals: 2, modelKey: 'simulation_link_spring' },
  { key: 'simulationLinkDistance', label: 'Link Distance', min: 1, max: 20, step: 1, decimals: 0, modelKey: 'simulation_link_distance' },
  { key: 'simulationFriction', label: 'Friction', min: 0, max: 1, step: 0.01, decimals: 2, modelKey: 'simulation_friction' },
]

const defaultState: SettingsState = {
  pointSizeScale: 1,
  simulationGravity: 0,
  simulationRepulsion: 0.1,
  simulationLinkSpring: 1,
  simulationLinkDistance: 2,
  simulationFriction: 0.85,
  showLabels: false,
}

export interface SettingsPanelProps {
  cosmograph: Cosmograph | null
  model: RenderProps['model']
}

function formatNumber(value: number, decimals: number): string {
  return decimals > 0 ? value.toFixed(decimals) : value.toString()
}

export function SettingsPanel({ cosmograph, model }: SettingsPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [state, setState] = useState<SettingsState>(() => ({
    pointSizeScale: model.get('point_size_scale') ?? defaultState.pointSizeScale,
    simulationGravity: model.get('simulation_gravity') ?? defaultState.simulationGravity,
    simulationRepulsion: model.get('simulation_repulsion') ?? defaultState.simulationRepulsion,
    simulationLinkSpring: model.get('simulation_link_spring') ?? defaultState.simulationLinkSpring,
    simulationLinkDistance: model.get('simulation_link_distance') ?? defaultState.simulationLinkDistance,
    simulationFriction: model.get('simulation_friction') ?? defaultState.simulationFriction,
    showLabels: model.get('show_labels') ?? defaultState.showLabels,
  }))

  const [hasEmbedding, setHasEmbedding] = useState(() => Boolean(model.get('point_x_by') || model.get('point_y_by')))
  const [labelsAvailable, setLabelsAvailable] = useState(() => {
    const pointLabelBy = model.get('point_label_by')
    return pointLabelBy !== null && pointLabelBy !== undefined && pointLabelBy !== ''
  })

  const simulationControls = useMemo(() => sliderControls.slice(1), [])

  useEffect(() => {
    const unsubscribes = sliderControls.map((control) => {
      return subscribe(model, `change:${control.modelKey}`, () => {
        const value = model.get(control.modelKey)
        setState(prev => ({
          ...prev,
          [control.key]: typeof value === 'number' ? value : defaultState[control.key],
        }))
      })
    })

    unsubscribes.push(subscribe(model, 'change:show_labels', () => {
      const value = model.get('show_labels')
      setState(prev => ({ ...prev, showLabels: value ?? defaultState.showLabels }))
    }))

    const updateEmbedding = () => {
      setHasEmbedding(Boolean(model.get('point_x_by') || model.get('point_y_by')))
    }

    unsubscribes.push(subscribe(model, 'change:point_x_by', updateEmbedding))
    unsubscribes.push(subscribe(model, 'change:point_y_by', updateEmbedding))

    unsubscribes.push(subscribe(model, 'change:point_label_by', () => {
      const value = model.get('point_label_by')
      setLabelsAvailable(value !== null && value !== undefined && value !== '')
    }))

    return () => {
      unsubscribes.forEach(unsub => unsub())
    }
  }, [model])

  useEffect(() => {
    if (!cosmograph) return
    let cancelled = false

    void (async () => {
      try {
        const config = await cosmograph.getConfig()
        if (cancelled || !config) return
        setState(prev => ({
          pointSizeScale: config.pointSizeScale ?? prev.pointSizeScale,
          simulationGravity: config.simulationGravity ?? prev.simulationGravity,
          simulationRepulsion: config.simulationRepulsion ?? prev.simulationRepulsion,
          simulationLinkSpring: config.simulationLinkSpring ?? prev.simulationLinkSpring,
          simulationLinkDistance: config.simulationLinkDistance ?? prev.simulationLinkDistance,
          simulationFriction: config.simulationFriction ?? prev.simulationFriction,
          showLabels: config.showLabels ?? prev.showLabels,
        }))
      } catch (error) {
        console.error('Failed to sync settings panel with cosmograph config', error)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [cosmograph])

  const handleSliderChange = (control: SliderControl, value: number) => {
    setState(prev => ({ ...prev, [control.key]: value }))
    model.set(control.modelKey, value)
    model.save_changes()
  }

  const handleToggleLabels = (enabled: boolean) => {
    setState(prev => ({ ...prev, showLabels: enabled }))
    model.set('show_labels', enabled)
    model.save_changes()
  }

  return (
    <>
      <div class="settings-toggle-wrapper">
        <button class="settings-panel-toggle" onClick={() => setIsOpen(prev => !prev)}>⚙️</button>
      </div>
      {isOpen && (
        <div class="settings-panel">
          <div class="settings-panel-content">
            <div class="settings-control">
              <div class="settings-label">
                <span>Point Size Scale</span>
                <span class="settings-value">{formatNumber(state.pointSizeScale, sliderControls[0].decimals)}</span>
              </div>
              <input
                class="settings-slider"
                type="range"
                min={sliderControls[0].min.toString()}
                max={sliderControls[0].max.toString()}
                step={sliderControls[0].step.toString()}
                value={state.pointSizeScale}
                onInput={(event: Event) => {
                  const target = event.currentTarget as HTMLInputElement
                  handleSliderChange(sliderControls[0], parseFloat(target.value))
                }}
              />
            </div>

            <div class="settings-control">
              <label class="settings-toggle-label" title={labelsAvailable ? '' : 'Set point_label_by to enable labels'}>
                <input
                  class="settings-checkbox"
                  type="checkbox"
                  checked={state.showLabels}
                  disabled={!labelsAvailable}
                  onChange={(event: Event) => handleToggleLabels((event.currentTarget as HTMLInputElement).checked)}
                />
                <span>Show Labels</span>
              </label>
            </div>

            {!hasEmbedding && (
              <div class="settings-section">
                <div class="settings-section-title">Simulation</div>
                {simulationControls.map(control => (
                  <div class="settings-control" key={control.key}>
                    <div class="settings-label">
                      <span>{control.label}</span>
                      <span class="settings-value">{formatNumber(state[control.key], control.decimals)}</span>
                    </div>
                    <input
                      class="settings-slider"
                      type="range"
                      min={control.min.toString()}
                      max={control.max.toString()}
                      step={control.step.toString()}
                      value={state[control.key]}
                      onInput={(event: Event) => {
                        const target = event.currentTarget as HTMLInputElement
                        handleSliderChange(control, parseFloat(target.value))
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
