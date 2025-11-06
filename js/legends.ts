import { AnyModel } from '@anywidget/types'
import {
  Cosmograph,
  CosmographSizeLegend,
  CosmographRangeColorLegend,
  CosmographTypeColorLegend,
  CosmographPointColorStrategy,
  CosmographPointSizeStrategy,
} from '@cosmograph/cosmograph'

import { isDuckDBStringType, isDuckDBNumericType } from './helper'
export interface LegendContainers {
  pointSizeLegendContainer: HTMLDivElement;
  linkWidthLegendContainer: HTMLDivElement;
  pointColorLegendContainer: HTMLDivElement;
  pointTypeColorLegendContainer: HTMLDivElement;
  linkColorLegendContainer: HTMLDivElement;
}

export enum ColorType {
  Range = 'range',
  Type = 'type'
}

export function getPointColorLegendType(cosmograph: Cosmograph, column_by: string | null): ColorType | undefined {
  const pointsSummary = cosmograph.stats?.pointsSummary
  const pointColorBy = column_by
  const activePointColorStrategy = cosmograph.activePointColorStrategy
  if (activePointColorStrategy === CosmographPointColorStrategy.Degree) return ColorType.Range
  if (activePointColorStrategy === CosmographPointColorStrategy.LinkDirection) return ColorType.Type
  if (activePointColorStrategy === CosmographPointColorStrategy.Direct) return undefined

  const pointColorInfo = pointsSummary?.find(d => d.column_name === pointColorBy)
  if (pointColorInfo && isDuckDBNumericType(pointColorInfo.column_type)) return ColorType.Range
  if (pointColorInfo && isDuckDBStringType(pointColorInfo.column_type)) return ColorType.Type

  return undefined
}

export class CosmographLegends {
  public pointSizeLegendContainer: HTMLDivElement
  public linkWidthLegendContainer: HTMLDivElement
  public pointColorLegendContainer: HTMLDivElement
  public pointTypeColorLegendContainer: HTMLDivElement
  public linkColorLegendContainer: HTMLDivElement
  public model: AnyModel
  public cosmograph: Cosmograph | undefined

  private _pointSizeLegend: CosmographSizeLegend | undefined
  private _linkWidthLegend: CosmographSizeLegend | undefined
  private _pointRangeColorLegend: CosmographRangeColorLegend | undefined
  private _pointTypeColorLegend: CosmographTypeColorLegend | undefined
  private _linkRangeColorLegend: CosmographRangeColorLegend | undefined

  constructor(containers: LegendContainers, model: AnyModel) {
    this.pointSizeLegendContainer = containers.pointSizeLegendContainer
    this.linkWidthLegendContainer = containers.linkWidthLegendContainer
    this.pointColorLegendContainer = containers.pointColorLegendContainer
    this.pointTypeColorLegendContainer = containers.pointTypeColorLegendContainer
    this.linkColorLegendContainer = containers.linkColorLegendContainer

    this.model = model
  }

  public setCosmograph(cosmograph: Cosmograph): void {
    this.cosmograph = cosmograph

    this._pointSizeLegend = new CosmographSizeLegend(this.cosmograph, this.pointSizeLegendContainer, {
      label: d => `points · ${d}`,
      noDataMessage: false,
      loadingMessage: false,
    })
    this._pointRangeColorLegend = new CosmographRangeColorLegend(this.cosmograph, this.pointColorLegendContainer, {
      label: d => `points · ${d}`,
      noDataMessage: false,
      loadingMessage: false,
    })
    this._pointTypeColorLegend = new CosmographTypeColorLegend(this.cosmograph, this.pointTypeColorLegendContainer, {
      noDataMessage: false,
      loadingMessage: false,
      maxDisplayedItems: 8,
    })
    this._linkWidthLegend = new CosmographSizeLegend(this.cosmograph, this.linkWidthLegendContainer, {
      useLinksData: true,
      label: d => `links · ${d}`,
      noDataMessage: false,
      loadingMessage: false,
    })
    this._linkRangeColorLegend = new CosmographRangeColorLegend(this.cosmograph, this.linkColorLegendContainer, {
      useLinksData: true,
      label: d => `links · ${d}`,
      noDataMessage: false,
      loadingMessage: false,
    })
  }

  public async update(
    type: 'point' | 'link',
    property: 'size' | 'color' | 'width'
  ): Promise<void> {
    if (!this.cosmograph) return
    const column_by = this.model.get(`${type}_${property}_by`) as (string | null)
    const disable = this.model.get(`disable_${type}_${property}_legend`) as (boolean | null)
    const hide = disable === true

    switch (`${type}_${property}`) {
      case 'point_size': {
        const activePointSizeStrategy = this.cosmograph.activePointSizeStrategy
        this._updateVisibility(this._pointSizeLegend, this.pointSizeLegendContainer, hide || (
          (activePointSizeStrategy === CosmographPointSizeStrategy.Auto || activePointSizeStrategy === CosmographPointSizeStrategy.Direct) && !column_by
        ))
        break
      }

      case 'point_color': {
        const colorType = getPointColorLegendType(this.cosmograph, column_by)
        this._updateVisibility(this._pointRangeColorLegend, this.pointColorLegendContainer, hide || colorType !== ColorType.Range)
        this._updateVisibility(this._pointTypeColorLegend, this.pointTypeColorLegendContainer, hide || colorType !== ColorType.Type)
        break
      }
      case 'link_width': {
        this._updateVisibility(this._linkWidthLegend, this.linkWidthLegendContainer, hide || !column_by)
        break
      }
      case 'link_color': {
        this._updateVisibility(this._linkRangeColorLegend, this.linkColorLegendContainer, hide || !column_by)
        break
      }
    }
  }

  /**
   * Safely hide a legend - workaround for cosmograph lib bug where _uiComponent might be undefined
   */
  private _safeHideLegend(legend: CosmographSizeLegend | CosmographRangeColorLegend | CosmographTypeColorLegend | undefined): void {
    if (!legend) return
    try {
      legend.hide()
    } catch (error) {
      // Silently catch errors from undefined _uiComponent in cosmograph lib
      console.warn('Legend hide failed (cosmograph lib bug):', error)
    }
  }

  /**
   * Safely show a legend - workaround for cosmograph lib bug where _uiComponent might be undefined
   */
  private _safeShowLegend(legend: CosmographSizeLegend | CosmographRangeColorLegend | CosmographTypeColorLegend | undefined): void {
    if (!legend) return
    try {
      legend.show()
    } catch (error) {
      // Silently catch errors from undefined _uiComponent in cosmograph lib
      console.warn('Legend show failed (cosmograph lib bug):', error)
    }
  }

  private _updateVisibility(
    legend: CosmographSizeLegend | CosmographRangeColorLegend | CosmographTypeColorLegend | undefined,
    container: HTMLDivElement,
    hide: boolean
  ): void {
    if (!legend) return

    if (hide) {
      this._safeHideLegend(legend)
      container.style.display = 'none'
    } else {
      this._safeShowLegend(legend)
      container.style.display = ''
    }
  }
}
