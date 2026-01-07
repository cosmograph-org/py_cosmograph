import { CosmographConfig, CosmographDataPrepConfig, prepareCosmographData, CosmographInputData } from '@cosmograph/cosmograph'

export type WidgetConfig = CosmographConfig & {
  pointTimelineBy?: string;
  linkTimelineBy?: string;
  linkTargetBy?: string | string[];
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
      pointDefaultColor: config.pointDefaultColor,
      pointColorBy: config.pointColorBy,
      pointColorPalette: config.pointColorPalette,
      pointColorByMap: config.pointColorByMap,
      pointColorStrategy: config.pointColorStrategy,
      pointDefaultSize: config.pointDefaultSize,
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
    cosmographDataPrepConfig.points.linkTargetsBy = Array.isArray(config.linkTargetBy)
      ? config.linkTargetBy
      : [config.linkTargetBy as string]
  }

  if (hasLinks) {
    cosmographDataPrepConfig.links = {
      linkSourceBy: config.linkSourceBy as string,
      linkTargetsBy: Array.isArray(config.linkTargetBy)
        ? config.linkTargetBy
        : [config.linkTargetBy as string],
      linkColorBy: config.linkColorBy,
      linkColorPalette: config.linkColorPalette,
      linkWidthBy: config.linkWidthBy,
      linkArrowBy: config.linkArrowBy,
      linkStrengthBy: config.linkStrengthBy,
      linkIncludeColumns: config.linkIncludeColumns,
      linkDefaultColor: config.linkDefaultColor,
      linkDefaultWidth: config.linkDefaultWidth,
    }

    // Add link timeline column to include columns if specified
    if (config.linkTimelineBy) {
      if (!cosmographDataPrepConfig.links.linkIncludeColumns) cosmographDataPrepConfig.links.linkIncludeColumns = []
      cosmographDataPrepConfig.links.linkIncludeColumns.push(config.linkTimelineBy)
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
