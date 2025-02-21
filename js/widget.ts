import type { RenderProps } from '@anywidget/types'
import { Cosmograph, CosmographConfig } from '@cosmograph/cosmograph'
import { tableFromIPC } from 'apache-arrow'

import { subscribe, toCamelCase } from './helper'
import { configProperties } from './config-props'
import { createWidgetContainer } from './widget-elements'
import { prepareCosmographDataAndMutate, resolveOptimalPointColorStrategy, resolveOptimalPointSizeStrategy, getPointColorLegendType, updateLinkColorFn } from './cosmograph-data'
import { CosmographLegends } from './legends'
import { PointTimeline } from './components/point-timeline'
import { ControlButtonsComponent } from './components/control-buttons'

import './widget.css'

async function render({ model, el }: RenderProps) {
  const { graphContainer, timelineContainer, controlsContainer } = createWidgetContainer(el)
  let cosmograph: Cosmograph | undefined = undefined
  let pointTimeline: PointTimeline | undefined = undefined
  const legends = new CosmographLegends(graphContainer, model)

  model.on('msg:custom', async (msg: { [key: string]: never }) => {
    if (msg.type === 'select_point_by_index') {
      cosmograph?.selectPoint(msg.index, true)
    }
    if (msg.type === 'select_point_by_id') {
      const index = (await cosmograph?.getPointIndicesByIds([msg.id]))?.[0]
      cosmograph?.selectPoint(index, true)
    }
    if (msg.type === 'select_points_by_indices') {
      cosmograph?.selectPoints(msg.indices)
    }
    if (msg.type === 'select_points_by_ids') {
      const indices = await cosmograph?.getPointIndicesByIds(msg.ids)
      cosmograph?.selectPoints(indices ?? null)
    }
    if (msg.type === 'activate_rect_selection') {
      cosmograph?.activateRectSelection()
    }
    if (msg.type === 'deactivate_rect_selection') {
      cosmograph?.deactivateRectSelection()
    }
    if (msg.type === 'fit_view') {
      cosmograph?.fitView()
    }
    if (msg.type === 'fit_view_by_indices') {
      cosmograph?.fitViewByIndices(msg.indices, msg.duration, msg.padding)
    }
    if (msg.type === 'fit_view_by_ids') {
      const indices = await cosmograph?.getPointIndicesByIds(msg.ids)
      if (indices) cosmograph?.fitViewByIndices(indices, msg.duration, msg.padding)
    }
    if (msg.type === 'fit_view_by_coordinates') {
      cosmograph?.fitViewByCoordinates(msg.coordinates, msg.duration, msg.padding)
    }
    if (msg.type === 'focus_point_by_index') {
      cosmograph?.focusPoint(msg.index ?? undefined)
    }
    if (msg.type === 'focus_point') {
      const index = (await cosmograph?.getPointIndicesByIds([msg.id]))?.[0]
      cosmograph?.focusPoint(index)
    }
    if (msg.type === 'start') {
      cosmograph?.start(msg.alpha ?? undefined)
    }
    if (msg.type === 'pause') {
      cosmograph?.pause()
    }
    if (msg.type === 'restart') {
      cosmograph?.restart()
    }
    if (msg.type === 'step') {
      cosmograph?.step()
    }
    if (msg.type === 'capture_screenshot') {
      cosmograph?.captureScreenshot()
    }
  })

  const cosmographConfig: CosmographConfig = {
    pointLabelClassName: 'pointLabelClassName',
    onClick: async (index) => {
      if (index === undefined) {
        model.set('clicked_point_id', null)
        cosmograph?.selectPoint()
      } else {
        const indices = await cosmograph?.getPointIdsByIndices([index])
        model.set('clicked_point_id', indices?.[0] ?? null)
        cosmograph?.selectPoint(index)
      }
      model.set('clicked_point_index', index ?? null)
      model.save_changes()
    },
    onPointsFiltered: async () => {
      const indices = cosmograph?.getSelectedPointIndices()
      model.set('selected_point_indices', indices ?? [])
      model.set('selected_point_ids', indices ? await cosmograph?.getPointIdsByIndices(indices) : [])
      model.save_changes()
    },
  }

  const modelChangeHandlers: { [key: string]: () => void } = {
    _ipc_points: () => {
      const ipc = model.get('_ipc_points')
      cosmographConfig.points = ipc ? tableFromIPC(ipc.buffer) : undefined
    },
    _ipc_links: () => {
      const ipc = model.get('_ipc_links')
      cosmographConfig.links = ipc ? tableFromIPC(ipc.buffer) : undefined
    },

    disable_point_size_legend: async () => {
      await legends.updateLegend('point', 'size')
    },
    disable_link_width_legend: async () => {
      await legends.updateLegend('link', 'width')
    },
    disable_point_color_legend: async () => {
      await legends.updateLegend('point', 'color')
    },
    disable_link_color_legend: async () => {
      await legends.updateLegend('link', 'color')
    },
  }

  // Set config properties from model
  configProperties.forEach((prop) => {
    modelChangeHandlers[prop] = async () => {
      const value = model.get(prop)

      // "disable_simulation" -> "disableSimulation", "simulation_decay" -> "simulationDecay", etc.
      const snakeToCamelProp = toCamelCase(prop) as keyof CosmographConfig
      if (value === null) {
        delete cosmographConfig[snakeToCamelProp]
      } else {
        cosmographConfig[snakeToCamelProp] = value
      }
    }
  })

  const unsubscribes = Object
    .entries(modelChangeHandlers)
    .map(([propName, onModelChange]) => subscribe(model, `change:${propName}`, async () => {
      onModelChange()

      // If color associated properties change, update the color strategy
      if (propName === 'point_color_by' || propName === 'point_color_palette' || propName === 'point_color_by_map' || propName === 'point_color_strategy') {
        const pointsSummary = cosmograph?.stats.pointsSummary
        cosmographConfig.pointColorStrategy = model.get('point_color_strategy') ?? resolveOptimalPointColorStrategy(cosmographConfig, pointsSummary)
      }

      // If size associated properties change, update the size strategy
      if (propName === 'point_size_by' || propName === 'point_size_range' || propName === 'point_size_strategy') {
        const pointsSummary = cosmograph?.stats.pointsSummary
        cosmographConfig.pointSizeStrategy = model.get('point_size_strategy') ?? resolveOptimalPointSizeStrategy(cosmographConfig, pointsSummary)
      }

      if (propName === 'link_color_by') {
        if (cosmograph?.stats.linksSummary) updateLinkColorFn(cosmograph.stats.linksSummary, cosmographConfig)
      }

      if (configProperties.includes(propName)) {
        await cosmograph?.setConfig(cosmographConfig)
      }

      // If color associated properties change, update the color legend after setting the config to cosmograph
      if (propName === 'point_color_by' || propName === 'point_color_palette' || propName === 'point_color_by_map' || propName === 'point_color_strategy') {
        const pointColorType = getPointColorLegendType(cosmograph?.stats.pointsSummary, cosmographConfig)
        await legends.updateLegend('point', 'color', pointColorType)
      }

      if (propName === 'link_color_by') {
        await legends.updateLegend('link', 'color')
      }

      if (propName === 'point_size_by') {
        await legends.updateLegend('point', 'size')
      }

      if (propName === 'link_width_by') {
        await legends.updateLegend('link', 'width')
      }

      // `point_timeline_by` can be initialized once with first provided property
      // In order to update accessor need to re-prepare the data for cosmograph
      // or provide column name in `point_include_columns` array
      if (propName === 'point_timeline_by') {
        pointTimeline?.setConfig({ accessor: model.get('point_timeline_by') })
      }
    }))

  // Initializes the Cosmograph with the configured settings
  Object.values(modelChangeHandlers).forEach(callback => callback())

  await prepareCosmographDataAndMutate(cosmographConfig)

  cosmographConfig.onDataUpdated = async (stats) => {
    if (!cosmograph) return
    await legends.updateLegend('point', 'size')
    await legends.updateLegend('link', 'width')

    if (stats.linksSummary) {
      updateLinkColorFn(stats.linksSummary, cosmographConfig)
    }

    await cosmograph.setConfig(cosmographConfig)
    const pointColorType = getPointColorLegendType(stats.pointsSummary, cosmographConfig)
    await legends.updateLegend('point', 'color', pointColorType)
    await legends.updateLegend('link', 'color')

    pointTimeline?.setConfig({ accessor: model.get('point_timeline_by') })
  }

  cosmograph = new Cosmograph(graphContainer, cosmographConfig)
  legends.setCosmograph(cosmograph)
  pointTimeline = new PointTimeline(cosmograph, timelineContainer, {
    accessor: model.get('point_timeline_by'),
  })

  new ControlButtonsComponent(cosmograph, controlsContainer)

  return (): void => {
    unsubscribes.forEach(unsubscribe => unsubscribe())
    cosmograph?.destroy()
  }
}

export default { render }
