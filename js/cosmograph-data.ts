import { scaleSequential } from 'd3-scale'
import { interpolateWarm } from 'd3-scale-chromatic'
import { CosmographConfig, CosmographDataPrepConfig, prepareCosmographData, CosmographInputData } from '@cosmograph/cosmograph'
import { isDuckDBNumericType, isDuckDBStringType } from './helper'

export type WidgetConfig = CosmographConfig & {
  pointTimelineBy?: string;
}

/**
 * Prepares and mutates the Cosmograph data configuration based on the provided `CosmographConfig`.
 */
export async function prepareCosmographDataAndMutate(config: WidgetConfig): Promise<void> {
  const hasLinks = config.links !== undefined && config.linkSourceBy !== undefined && config.linkTargetBy !== undefined
  const cosmographDataPrepConfig: CosmographDataPrepConfig = {
    points: {
      pointLabelBy: config.pointLabelBy,
      pointLabelWeightBy: config.pointLabelWeightBy,
      pointColor: config.pointColor,
      pointColorBy: config.pointColorBy,
      pointColorPalette: config.pointColorPalette,
      pointColorByMap: config.pointColorByMap,
      pointColorStrategy: config.pointColorStrategy,
      pointSize: config.pointSize,
      pointSizeBy: config.pointSizeBy,
      pointSizeStrategy: config.pointSizeStrategy,
      pointXBy: config.pointXBy,
      pointYBy: config.pointYBy,
      pointClusterBy: config.pointClusterBy,
      pointClusterStrengthBy: config.pointClusterStrengthBy,
      pointIncludeColumns: config.pointIncludeColumns,
    },
  }

  if (config.pointTimelineBy) {
    if (!cosmographDataPrepConfig.points.pointIncludeColumns) cosmographDataPrepConfig.points.pointIncludeColumns = []
    cosmographDataPrepConfig.points.pointIncludeColumns.push(config.pointTimelineBy)
  }

  if (config.points !== undefined) {
    cosmographDataPrepConfig.points.pointIdBy = config.pointIdBy
  } else if (hasLinks) {
    cosmographDataPrepConfig.points.linkSourceBy = config.linkSourceBy
    cosmographDataPrepConfig.points.linkTargetsBy = [config.linkTargetBy as string]
  }

  if (hasLinks) {
    cosmographDataPrepConfig.links = {
      linkSourceBy: config.linkSourceBy as string,
      linkTargetsBy: [config.linkTargetBy as string],
      linkColorBy: config.linkColorBy,
      linkWidthBy: config.linkWidthBy,
      linkArrowBy: config.linkArrowBy,
      linkStrengthBy: config.linkStrengthBy,
      linkIncludeColumns: config.linkIncludeColumns,
    }
  }

  const hasLinksOnly = config.points === undefined && hasLinks
  const preparedDataArrow = await prepareCosmographData(
    cosmographDataPrepConfig,
    hasLinksOnly ? (config.links as CosmographInputData) : (config.points as CosmographInputData),
    config.links
  )

  Object.assign(config, preparedDataArrow?.cosmographConfig, {
    points: preparedDataArrow?.points,
    links: preparedDataArrow?.links,
  })

  // Temporary fix for Cosmograph simulation config parameters for small graphs
  if (preparedDataArrow?.points?.numRows !== undefined && preparedDataArrow?.points?.numRows < 50 && config.simulationGravity === undefined) {
    config.simulationGravity = 0
  }
  if (preparedDataArrow?.points?.numRows !== undefined && preparedDataArrow?.points?.numRows < 50 && config.simulationCenter === undefined) {
    config.simulationCenter = 1
  }
  if (preparedDataArrow?.points?.numRows !== undefined && preparedDataArrow?.points?.numRows < 50 && config.simulationDecay === undefined) {
    config.simulationDecay = 1000
  }
}

export function getPointColorLegendType(pointsSummary?: Record<string, unknown>[], config?: CosmographConfig): 'range' | 'type' | undefined {
  const pointColorInfo = pointsSummary?.find(d => d.column_name === config?.pointColorBy)
  if (config?.pointColorStrategy === 'degree' || (pointColorInfo && isDuckDBNumericType(pointColorInfo.column_type))) {
    return 'range'
  } else if (pointColorInfo && isDuckDBStringType(pointColorInfo.column_type)) {
    return 'type'
  }
  return undefined
}

export function updateLinkColorFn(linksSummary: Record<string, unknown>[], cosmographConfig: CosmographConfig): void {
  const linkColorInfo = linksSummary.find(d => d.column_name === cosmographConfig.linkColorBy)
  if (linkColorInfo && isDuckDBNumericType(linkColorInfo.column_type)) {
    const linkColorScale = scaleSequential(interpolateWarm)
    linkColorScale.domain([Number(linkColorInfo.min), Number(linkColorInfo.max)])
    cosmographConfig.linkColorByFn = (d: number) => linkColorScale(d)
  } else {
    cosmographConfig.linkColorByFn = undefined
  }
  // TODO: If the data is of category type, use `CosmographTypeColorLegend`
}

// TODO: Remove this code when Cosmograph exports the `getPointColorStrategy` function
enum PointColorStrategy {
  Palette = 'palette',
  InterpolatePalette = 'interpolatePalette',
  Map = 'map',
  Degree = 'degree',
  ActualColor = 'actualColor'
}

type PointColorStrategyType = `${PointColorStrategy}`

export function resolveOptimalPointColorStrategy(
  cosmographConfig: CosmographConfig,
  pointsSummary?: Record<string, unknown>[]
): PointColorStrategyType | undefined {
  const { pointColorBy, pointColorByFn, pointColor, pointColorByMap, linkSourceBy } = cosmographConfig

  // Priority 1: Custom function or static color takes precedence
  if (pointColorByFn || pointColor) return undefined

  // Priority 2: Map-based coloring if a color map is provided
  if (pointColorByMap) return PointColorStrategy.Map

  // Priority 3: If no color settings specified, use degree-based coloring for linked graphs
  if (!pointColor && !pointColorBy) {
    return linkSourceBy ? PointColorStrategy.Degree : undefined
  }

  // Priority 4: For numeric columns, use interpolated palette. For string columns, use palette.
  const columnType = pointsSummary?.find(k => k.column_name === pointColorBy)?.column_type
  if (isDuckDBNumericType(columnType)) {
    return PointColorStrategy.InterpolatePalette
  } else if (isDuckDBStringType(columnType)) {
    return PointColorStrategy.Palette
  }

  // Default: no specific strategy needed
  return undefined
}

// TODO: Remove this code when Cosmograph exports the `getPointSizeStrategy` function
export enum PointSizeStrategy {
  Degree = 'degree',
  Auto = 'auto'
}

export type PointSizeStrategyType = `${PointSizeStrategy}`

export function resolveOptimalPointSizeStrategy(
  cosmographConfig: CosmographConfig,
  pointsSummary?: Record<string, unknown>[]
): PointSizeStrategyType | undefined {
  const { pointSizeBy, pointSize, pointSizeByFn, linkSourceBy } = cosmographConfig

  // Priority 1: Custom function or static size takes precedence
  if (pointSizeByFn || pointSize) return undefined

  // Priority 2: If no size settings specified, use degree-based sizing for linked graphs
  if (!pointSize && !pointSizeBy) {
    return linkSourceBy ? PointSizeStrategy.Degree : undefined
  }

  // Priority 3: For numeric columns, use automatic sizing
  const columnType = pointsSummary?.find(k => k.column_name === pointSizeBy)?.column_type
  if (isDuckDBNumericType(columnType)) {
    return PointSizeStrategy.Auto
  }

  // Default: no specific strategy needed
  return undefined
}
