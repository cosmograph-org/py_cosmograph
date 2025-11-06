import type { RenderProps } from '@anywidget/types'
import { Cosmograph, CosmographConfig } from '@cosmograph/cosmograph'
import { render } from 'preact'
import { useEffect, useRef, useState } from 'preact/hooks'

import { ControlButtons } from './components/control-buttons'
import { PointTimeline } from './components/point-timeline'
import { LinkTimeline } from './components/link-timeline'
import { PointInfoPanel } from './components/point-info'
import { SettingsPanel } from './components/settings-panel'
import { subscribe } from './helper'
import { prepareCosmographDataAndMutate, WidgetConfig } from './cosmograph-data'
import { CosmographLegends, LegendContainers } from './legends'
import snakeToCamelConfigProps from './config-props.json'

import './widget.css'

type AnyModel = RenderProps['model']

type MutableRef<T> = { current: T }

type WidgetMessage = {
  type: string
  [key: string]: any
}

function toCssColor(color: string | number[] | undefined): string | undefined {
  if (!color) return undefined
  if (typeof color === 'string') return color
  if (Array.isArray(color) && color.length >= 3) {
    const [r, g, b, a = 1] = color
    return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`
  }
  return undefined
}

interface LegendsProps {
  model: AnyModel
  legendsRef: MutableRef<CosmographLegends | null>
  pointSizeLegendRef: MutableRef<HTMLDivElement | null>
  linkWidthLegendRef: MutableRef<HTMLDivElement | null>
  pointColorLegendRef: MutableRef<HTMLDivElement | null>
  pointTypeColorLegendRef: MutableRef<HTMLDivElement | null>
  linkColorLegendRef: MutableRef<HTMLDivElement | null>
}

function LegendsOverlay({ model, legendsRef, pointSizeLegendRef, linkWidthLegendRef, pointColorLegendRef, pointTypeColorLegendRef, linkColorLegendRef }: LegendsProps) {
  useEffect(() => {
    if (
      legendsRef.current ||
      !pointSizeLegendRef.current ||
      !linkWidthLegendRef.current ||
      !pointColorLegendRef.current ||
      !pointTypeColorLegendRef.current ||
      !linkColorLegendRef.current
    ) {
      return
    }

    const containers: LegendContainers = {
      pointSizeLegendContainer: pointSizeLegendRef.current,
      linkWidthLegendContainer: linkWidthLegendRef.current,
      pointColorLegendContainer: pointColorLegendRef.current,
      pointTypeColorLegendContainer: pointTypeColorLegendRef.current,
      linkColorLegendContainer: linkColorLegendRef.current,
    }

    legendsRef.current = new CosmographLegends(containers, model)
  }, [model])

  return (
    <div class="bottom">
      <div class="leftLegends">
        <div class="pointColorLegend" ref={pointColorLegendRef} />
        <div class="pointTypeColorLegend" ref={pointTypeColorLegendRef} />
        <div class="linkColorLegend" ref={linkColorLegendRef} />
      </div>
      <div class="rightLegends">
        <div class="pointSizeLegend" ref={pointSizeLegendRef} />
        <div class="linkWidthLegend" ref={linkWidthLegendRef} />
      </div>
    </div>
  )
}

function CosmographWidgetApp({ model }: { model: AnyModel }) {
  const graphRef = useRef<HTMLDivElement | null>(null)
  const timelineRef = useRef<HTMLDivElement | null>(null)
  const cosmographRef = useRef<Cosmograph | null>(null)
  const cosmographConfigRef = useRef<WidgetConfig>({} as WidgetConfig)
  const unsubscribesRef = useRef<(() => void)[]>([])
  const pointTimelineRef = useRef<PointTimeline | null>(null)
  const linkTimelineRef = useRef<LinkTimeline | null>(null)
  const legendsRef = useRef<CosmographLegends | null>(null)
  const pointSizeLegendRef = useRef<HTMLDivElement | null>(null)
  const linkWidthLegendRef = useRef<HTMLDivElement | null>(null)
  const pointColorLegendRef = useRef<HTMLDivElement | null>(null)
  const pointTypeColorLegendRef = useRef<HTMLDivElement | null>(null)
  const linkColorLegendRef = useRef<HTMLDivElement | null>(null)

  const [cosmograph, setCosmograph] = useState<Cosmograph | null>(null)
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null)
  const [overlayVisible, setOverlayVisible] = useState(true)
  const [overlayMounted, setOverlayMounted] = useState(true)
  const [overlayBackground, setOverlayBackground] = useState<string | undefined>(toCssColor(model.get('background_color')))

  useEffect(() => {
    if (overlayVisible) {
      setOverlayMounted(true)
      return
    }
    const timeout = setTimeout(() => setOverlayMounted(false), 300)
    return () => clearTimeout(timeout)
  }, [overlayVisible])

  useEffect(() => {
    const config = cosmographConfigRef.current
    setOverlayVisible(true)
    Object.keys(config).forEach((key) => {
      delete (config as Record<string, unknown>)[key]
    })

    const updateTimelineVisibility = () => {
      if (!timelineRef.current) return
      const hasTimeline = Boolean(model.get('point_timeline_by') || model.get('link_timeline_by'))
      timelineRef.current.style.display = hasTimeline ? 'flex' : 'none'
    }

    const updatePythonCosmographConfig = () => {
      const camelCaseConfigProps = new Set(Object.values(snakeToCamelConfigProps))
      const filteredConfig = Object.fromEntries(
        Object.entries(config as CosmographConfig)
          .filter(([key, value]) => camelCaseConfigProps.has(key) && value !== undefined)
      )
      model.set('cosmograph_config', filteredConfig)
      model.save_changes()
    }

    const updateSelectedIndices = async (selectedPointIndices?: number[] | null, selectedLinkIndices?: number[]) => {
      const instance = cosmographRef.current
      if (!instance) return
      const pointIndices = selectedPointIndices ?? instance.getSelectedPointIndices()
      const linkIndices = selectedLinkIndices ?? instance.getSelectedLinkIndices()
      model.set('selected_point_indices', pointIndices ?? [])
      model.set('selected_point_ids', pointIndices && pointIndices.length > 0 ? await instance.getPointIdsByIndices(pointIndices) : [])
      model.set('selected_link_indices', linkIndices ?? [])
      model.save_changes()
    }

    config.onClick = async (index) => {
      model.set('clicked_point_index', index ?? null)
      model.save_changes()
      setSelectedPointIndex(index ?? null)
    }

    config.onPointsFiltered = async (_filteredPoints, selectedPointIndices, selectedLinkIndices) => {
      await updateSelectedIndices(selectedPointIndices, selectedLinkIndices)
    }

    config.onLinksFiltered = async (_filteredLinks, selectedPointIndices, selectedLinkIndices) => {
      await updateSelectedIndices(selectedPointIndices, selectedLinkIndices)
    }

    config.onClusterLabelClick = async (cluster) => {
      model.set('clicked_cluster', cluster)
      model.save_changes()
    }

    config.onGraphRebuilt = () => {
      if (!cosmographRef.current) return
      void legendsRef.current?.update('point', 'size')
      void legendsRef.current?.update('point', 'color')
      void legendsRef.current?.update('link', 'width')
      void legendsRef.current?.update('link', 'color')

      const pointTimelineBy = model.get('point_timeline_by')
      const linkTimelineBy = model.get('link_timeline_by')

      if (pointTimelineBy && pointTimelineRef.current) {
        pointTimelineRef.current.setConfig({ accessor: pointTimelineBy })
      }

      if (linkTimelineBy && linkTimelineRef.current) {
        linkTimelineRef.current.setConfig({ accessor: linkTimelineBy })
      }
    }

    config.onGraphDataUpdated = () => {
      setOverlayVisible(false)
    }

    const handleCustomMessage = async (msg: WidgetMessage) => {
      const instance = cosmographRef.current
      if (!instance) return
      switch (msg.type) {
        case 'select_point_by_index':
          instance.selectPoint(msg.index, true)
          break
        case 'select_point_by_id': {
          const index = (await instance.getPointIndicesByIds([msg.id]))?.[0]
          instance.selectPoint(index, true)
          break
        }
        case 'select_points_by_indices':
          instance.selectPoints(msg.indices)
          break
        case 'select_points_by_ids': {
          const indices = await instance.getPointIndicesByIds(msg.ids)
          instance.selectPoints(indices ?? null)
          break
        }
        case 'activate_rect_selection':
          instance.activateRectSelection()
          break
        case 'deactivate_rect_selection':
          instance.deactivateRectSelection()
          break
        case 'activate_polygonal_selection':
          instance.activatePolygonalSelection()
          break
        case 'deactivate_polygonal_selection':
          instance.deactivatePolygonalSelection()
          break
        case 'select_points_in_polygon':
          instance.selectPointsInPolygon(msg.polygon)
          break
        case 'unselect_points_by_indices':
          instance.unselectPointsByIndicies(msg.indices)
          break
        case 'fit_view':
          instance.fitView(msg.duration, msg.padding)
          break
        case 'fit_view_by_indices':
          instance.fitViewByIndices(msg.indices, msg.duration, msg.padding)
          break
        case 'fit_view_by_ids': {
          const indices = await instance.getPointIndicesByIds(msg.ids)
          if (indices) instance.fitViewByIndices(indices, msg.duration, msg.padding)
          break
        }
        case 'fit_view_by_coordinates':
          instance.fitViewByCoordinates(msg.coordinates, msg.duration, msg.padding)
          break
        case 'focus_point_by_index':
          instance.setFocusedPoint(msg.index ?? undefined)
          break
        case 'focus_point': {
          if (msg.id === null || msg.id === undefined) {
            instance.setFocusedPoint(undefined)
          } else {
            const index = (await instance.getPointIndicesByIds([msg.id]))?.[0]
            instance.setFocusedPoint(index)
          }
          break
        }
        case 'start':
          instance.start(msg.alpha ?? undefined)
          break
        case 'pause':
          instance.pause()
          break
        case 'restart':
          instance.restart()
          break
        case 'step':
          instance.step()
          break
        case 'capture_screenshot':
          instance.captureScreenshot()
          break
      }
    }

    model.on('msg:custom', handleCustomMessage)
    const unsubscribes: (() => void)[] = [() => model.off('msg:custom', handleCustomMessage)]

    const modelChangeHandlers: Record<string, () => void | Promise<void>> = {
      _ipc_points: () => {
        const ipc = model.get('_ipc_points')
        config.points = ipc ? ipc.buffer : undefined
      },
      _ipc_links: () => {
        const ipc = model.get('_ipc_links')
        config.links = ipc ? ipc.buffer : undefined
      },
      disable_point_size_legend: () => { void legendsRef.current?.update('point', 'size') },
      disable_link_width_legend: () => { void legendsRef.current?.update('link', 'width') },
      disable_point_color_legend: () => { void legendsRef.current?.update('point', 'color') },
      disable_link_color_legend: () => { void legendsRef.current?.update('link', 'color') },
      background_color: () => {
        setOverlayBackground(toCssColor(model.get('background_color')))
      },
      point_timeline_by: () => {
        const accessor = model.get('point_timeline_by')
        if (cosmographRef.current && timelineRef.current) {
          if (!pointTimelineRef.current && accessor) {
            pointTimelineRef.current = new PointTimeline(cosmographRef.current, timelineRef.current, { accessor })
          } else if (pointTimelineRef.current) {
            pointTimelineRef.current.setConfig({ accessor })
          }
        }
        updateTimelineVisibility()
      },
      link_timeline_by: () => {
        const accessor = model.get('link_timeline_by')
        if (cosmographRef.current && timelineRef.current) {
          if (!linkTimelineRef.current && accessor) {
            linkTimelineRef.current = new LinkTimeline(cosmographRef.current, timelineRef.current, { accessor })
          } else if (linkTimelineRef.current) {
            linkTimelineRef.current.setConfig({ accessor })
          }
        }
        updateTimelineVisibility()
      },
    }

    Object.entries(snakeToCamelConfigProps).forEach(([snakeCaseProp, camelCaseProp]) => {
      const existingHandler = modelChangeHandlers[snakeCaseProp]
      modelChangeHandlers[snakeCaseProp] = async () => {
        const value = model.get(snakeCaseProp)
        if (value === null || value === undefined) {
          delete (config as Record<string, unknown>)[camelCaseProp]
        } else {
          (config as Record<string, unknown>)[camelCaseProp] = value
        }
        if (existingHandler) await existingHandler()
      }
    })

    Object.entries(modelChangeHandlers).forEach(([prop, handler]) => {
      void handler()
      const unsubscribe = subscribe(model, `change:${prop}`, async () => {
        await handler()

        if (snakeToCamelConfigProps[prop as keyof typeof snakeToCamelConfigProps]) {
          cosmographRef.current?.setConfig(config)
          await cosmographRef.current?.getConfig()
          updatePythonCosmographConfig()
        }

        if (prop === 'point_color_by' || prop === 'point_color_strategy') {
          void legendsRef.current?.update('point', 'color')
        }
        if (prop === 'point_size_by') {
          void legendsRef.current?.update('point', 'size')
        }
        if (prop === 'link_color_by') {
          void legendsRef.current?.update('link', 'color')
        }
        if (prop === 'link_width_by') {
          void legendsRef.current?.update('link', 'width')
        }
      })
      unsubscribes.push(unsubscribe)
    })

    void (async () => {
      await prepareCosmographDataAndMutate(config)

      Object.keys(config).forEach((key) => {
        if ((config as CosmographConfig)[key as keyof CosmographConfig] === undefined) {
          delete (config as Record<string, unknown>)[key]
        }
      })

      const container = graphRef.current
      if (!container) return

      const instance = new Cosmograph(container, config)
      cosmographRef.current = instance
      setCosmograph(instance)
      legendsRef.current?.setCosmograph(instance)

      const pointTimelineBy = model.get('point_timeline_by')
      const linkTimelineBy = model.get('link_timeline_by')

      if (pointTimelineBy && timelineRef.current) {
        pointTimelineRef.current = new PointTimeline(instance, timelineRef.current, { accessor: pointTimelineBy })
      }

      if (linkTimelineBy && timelineRef.current) {
        linkTimelineRef.current = new LinkTimeline(instance, timelineRef.current, { accessor: linkTimelineBy })
      }

      updateTimelineVisibility()
      updatePythonCosmographConfig()
    })()

    unsubscribesRef.current = unsubscribes

    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe())
      unsubscribesRef.current = []
      pointTimelineRef.current = null
      linkTimelineRef.current = null
      cosmographRef.current?.destroy()
      cosmographRef.current = null
      setCosmograph(null)
      setSelectedPointIndex(null)
      setOverlayVisible(true)
    }
  }, [model])

  return (
    <div class="wrapper">
      <div class="graph" ref={graphRef}>
        {overlayMounted && (
          <div class="loading-overlay" style={{ opacity: overlayVisible ? '1' : '0', backgroundColor: overlayBackground }}>
            <div class="loading-spinner" />
          </div>
        )}
        <PointInfoPanel cosmograph={cosmograph} selectedIndex={selectedPointIndex} onClose={() => setSelectedPointIndex(null)} />
        <SettingsPanel cosmograph={cosmograph} model={model} />
        <LegendsOverlay
          model={model}
          legendsRef={legendsRef}
          pointSizeLegendRef={pointSizeLegendRef}
          linkWidthLegendRef={linkWidthLegendRef}
          pointColorLegendRef={pointColorLegendRef}
          pointTypeColorLegendRef={pointTypeColorLegendRef}
          linkColorLegendRef={linkColorLegendRef}
        />
      </div>
      <div class="timeline" ref={timelineRef} />
      <ControlButtons cosmograph={cosmograph} />
    </div>
  )
}

async function renderWidget({ model, el }: RenderProps) {
  let root: VNode | null = null
  root = render(<CosmographWidgetApp model={model} />, el)
  return () => {
    render(null, el, root)
  }
}

type VNode = ReturnType<typeof render>

export default { render: renderWidget }
