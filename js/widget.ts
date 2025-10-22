import type { RenderProps } from '@anywidget/types'
import { Cosmograph, CosmographConfig } from '@cosmograph/cosmograph'

import { subscribe } from './helper'
import { createWidgetContainer, createLoadingOverlay, showLoadingOverlay, hideLoadingOverlay, setLoadingOverlayBackgroundColor } from './widget-elements'
import { prepareCosmographDataAndMutate } from './cosmograph-data'
import { CosmographLegends } from './legends'
import { PointTimeline } from './components/point-timeline'
import { LinkTimeline } from './components/link-timeline'
import { ControlButtonsComponent } from './components/control-buttons'
import { SettingsPanel } from './components/settings-panel'
import { PointInfoPanel } from './components/point-info'
import snakeToCamelConfigProps from './config-props.json'

import './widget.css'

async function render({ model, el }: RenderProps) {
  const { graphContainer, timelineContainer, controlsContainer } = createWidgetContainer(el)

  // Create and show loading overlay
  const loadingOverlay = createLoadingOverlay(el)
  showLoadingOverlay(loadingOverlay)
  let isOverlayVisible = true
  const backgroundColor = model.get('background_color')
  if (backgroundColor) {
    setLoadingOverlayBackgroundColor(loadingOverlay, backgroundColor)
  }

  let cosmograph: Cosmograph | undefined = undefined
  let pointTimeline: PointTimeline | undefined = undefined
  let linkTimeline: LinkTimeline | undefined = undefined
  let settingsPanel: SettingsPanel | undefined = undefined
  let pointInfoPanel: PointInfoPanel | undefined = undefined
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
    if (msg.type === 'activate_polygonal_selection') {
      cosmograph?.activatePolygonalSelection()
    }
    if (msg.type === 'deactivate_polygonal_selection') {
      cosmograph?.deactivatePolygonalSelection()
    }
    if (msg.type === 'select_points_in_polygon') {
      cosmograph?.selectPointsInPolygon(msg.polygon)
    }
    if (msg.type === 'unselect_points_by_indices') {
      cosmograph?.unselectPointsByIndicies(msg.indices)
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
      cosmograph?.setFocusedPoint(msg.index ?? undefined)
    }
    if (msg.type === 'focus_point') {
      const index = (await cosmograph?.getPointIndicesByIds([msg.id]))?.[0]
      cosmograph?.setFocusedPoint(index)
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

  const updateSelectedIndices = async (selectedPointIndices?: number[] | null, selectedLinkIndices?: number[]): Promise<void> => {
    const indices = selectedPointIndices ?? cosmograph?.getSelectedPointIndices()
    const linkIndices = selectedLinkIndices ?? cosmograph?.getSelectedLinkIndices()
    model.set('selected_point_indices', indices ?? [])
    model.set('selected_point_ids', indices && indices.length > 0 ? await cosmograph?.getPointIdsByIndices(indices) : [])
    model.set('selected_link_indices', linkIndices ?? [])
    model.save_changes()
  }

  const cosmographConfig: CosmographConfig = {
    onClick: async (index) => {
      model.set('clicked_point_index', index ?? null)
      model.save_changes()
      // Show point info panel
      pointInfoPanel?.showPointInfo(index ?? null)
    },
    onPointsFiltered: async (_filteredPoints, selectedPointIndices, selectedLinkIndices) => {
      await updateSelectedIndices(selectedPointIndices, selectedLinkIndices)
    },
    onLinksFiltered: async (_filteredLinks, selectedPointIndices, selectedLinkIndices) => {
      await updateSelectedIndices(selectedPointIndices, selectedLinkIndices)
    },
    onClusterLabelClick: async (cluster) => {
      // Handle cluster label click event
      model.set('clicked_cluster', cluster)
      model.save_changes()
    },
  }

  const updatePythonCosmographConfig = (): void => {
    const camelCaseConfigProps = new Set(Object.values(snakeToCamelConfigProps))
    const filteredConfig = Object.fromEntries(
      Object.entries(cosmographConfig).filter(([camelCasePropKey, value]) =>
        camelCaseConfigProps.has(camelCasePropKey) && value !== undefined
      )
    )
    model.set('cosmograph_config', filteredConfig)
    model.save_changes()
  }

  const modelChangeHandlers: { [key: string]: () => void } = {
    _ipc_points: () => {
      const ipc = model.get('_ipc_points')
      cosmographConfig.points = ipc ? ipc.buffer : undefined
    },
    _ipc_links: () => {
      const ipc = model.get('_ipc_links')
      cosmographConfig.links = ipc ? ipc.buffer : undefined
    },

    disable_point_size_legend: () => {
      legends.update('point', 'size')
    },
    disable_link_width_legend: () => {
      legends.update('link', 'width')
    },
    disable_point_color_legend: () => {
      legends.update('point', 'color')
    },
    disable_link_color_legend: () => {
      legends.update('link', 'color')
    },
  }

  // Set config properties from model
  Object.entries(snakeToCamelConfigProps).forEach(([snakeCaseProp, camelCaseProp]) => {
    modelChangeHandlers[snakeCaseProp] = async () => {
      const value = model.get(snakeCaseProp)

      if (value === null || value === undefined) {
        delete cosmographConfig[camelCaseProp as keyof CosmographConfig]
      } else {
        cosmographConfig[camelCaseProp as keyof CosmographConfig] = value
      }
    }
  })

  const unsubscribes = Object
    .entries(modelChangeHandlers)
    .map(([snakeCaseProp, onModelChange]) => subscribe(model, `change:${snakeCaseProp}`, async () => {
      onModelChange()

      if (snakeToCamelConfigProps[snakeCaseProp as keyof typeof snakeToCamelConfigProps]) {
        cosmograph?.setConfig(cosmographConfig)
        // await when config is set
        await cosmograph?.getConfig()
        updatePythonCosmographConfig()
      }

      // If color associated properties change, update the color legend after setting the config to cosmograph
      if (snakeCaseProp === 'point_color_by' || snakeCaseProp === 'point_color_strategy') {
        legends.update('point', 'color')
      }

      if (snakeCaseProp === 'point_size_by') {
        legends.update('point', 'size')
      }

      if (snakeCaseProp === 'link_color_by') {
        legends.update('link', 'color')
      }

      if (snakeCaseProp === 'link_width_by') {
        legends.update('link', 'width')
      }

      // `point_timeline_by` can be initialized once with first provided property
      // In order to update accessor need to re-prepare the data for cosmograph
      // or provide column name in `point_include_columns` array
      if (snakeCaseProp === 'point_timeline_by') {
        pointTimeline?.setConfig({ accessor: model.get('point_timeline_by') })
      }

      // `link_timeline_by` can be initialized once with first provided property
      // In order to update accessor need to re-prepare the data for cosmograph
      // or provide column name in `link_include_columns` array
      if (snakeCaseProp === 'link_timeline_by') {
        linkTimeline?.setConfig({ accessor: model.get('link_timeline_by') })
      }
    }))

  // Initializes the Cosmograph with the configured settings
  Object.values(modelChangeHandlers).forEach(callback => callback())

  await prepareCosmographDataAndMutate(cosmographConfig)

  cosmographConfig.onGraphRebuilt = () => {
    if (!cosmograph) return
    legends.update('point', 'size')
    legends.update('point', 'color')
    legends.update('link', 'width')
    legends.update('link', 'color')

    const pointTimelineBy = model.get('point_timeline_by')
    const linkTimelineBy = model.get('link_timeline_by')

    if (pointTimelineBy && pointTimeline) {
      pointTimeline.setConfig({ accessor: pointTimelineBy })
    }

    if (linkTimelineBy && linkTimeline) {
      linkTimeline.setConfig({ accessor: linkTimelineBy })
    }
  }

  cosmographConfig.onGraphDataUpdated = () => {
    if (isOverlayVisible) {
      hideLoadingOverlay(loadingOverlay)
    }
    isOverlayVisible = false
  }

  updatePythonCosmographConfig()
  /**
   * Remove all props from `cosmographConfig` if they are `undefined`
   */
  Object.keys(cosmographConfig).forEach((key) => {
    if (cosmographConfig[key as keyof CosmographConfig] === undefined) {
      delete cosmographConfig[key as keyof CosmographConfig]
    }
  })

  cosmograph = new Cosmograph(graphContainer, cosmographConfig)
  legends.setCosmograph(cosmograph)

  // Create point info panel
  pointInfoPanel = new PointInfoPanel(cosmograph, graphContainer)

  // Create timeline components based on which parameters are set
  const pointTimelineBy = model.get('point_timeline_by')
  const linkTimelineBy = model.get('link_timeline_by')

  if (pointTimelineBy) {
    pointTimeline = new PointTimeline(cosmograph, timelineContainer, {
      accessor: pointTimelineBy,
    })
  }

  if (linkTimelineBy) {
    linkTimeline = new LinkTimeline(cosmograph, timelineContainer, {
      accessor: linkTimelineBy,
    })
  }

  const controlButtons = new ControlButtonsComponent(cosmograph, controlsContainer)

  // Create settings panel at top of graph container with button in right controls
  const settingsButtonContainer = controlButtons.settingsButtonContainer
  settingsPanel = new SettingsPanel(cosmograph, graphContainer, settingsButtonContainer, model)

  return (): void => {
    unsubscribes.forEach(unsubscribe => unsubscribe())
    cosmograph?.destroy()
    settingsPanel?.destroy()
    pointInfoPanel?.destroy()
  }
}

export default { render }
