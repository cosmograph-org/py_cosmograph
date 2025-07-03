import { AnyModel } from '@anywidget/types'
import {
  Cosmograph,
  CosmographSizeLegend,
  CosmographRangeColorLegend,
  CosmographTypeColorLegend,
} from '@cosmograph/cosmograph'

import { createWidgetLegendElements } from './widget-elements'
import { isDuckDBStringType, isDuckDBNumericType } from './helper'

export enum PointColorStrategy {
  Palette = 'palette',
  InterpolatePalette = 'interpolatePalette',
  Map = 'map',
  Degree = 'degree',
  Direct = 'direct'
}

export enum PointSizeStrategy {
  Degree = 'degree',
  Auto = 'auto',
  Direct = 'direct'
}

export enum ColorType {
  Range = 'range',
  Type = 'type'
}

export function getPointColorLegendType(cosmograph: Cosmograph, column_by: string | null): ColorType | undefined {
  const pointsSummary = cosmograph.stats.pointsSummary
  const pointColorBy = column_by
  const activePointColorStrategy = cosmograph.activePointColorStrategy
  if (activePointColorStrategy === PointColorStrategy.Degree) return ColorType.Range
  if (activePointColorStrategy === PointColorStrategy.Direct) return undefined

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

  constructor(container: HTMLElement, model: AnyModel) {
    const { pointSizeLegendContainer, linkWidthLegendContainer, pointColorLegendContainer, pointTypeColorLegendContainer, linkColorLegendContainer } = createWidgetLegendElements(container)
    this.pointSizeLegendContainer = pointSizeLegendContainer
    this.linkWidthLegendContainer = linkWidthLegendContainer
    this.pointColorLegendContainer = pointColorLegendContainer
    this.pointTypeColorLegendContainer = pointTypeColorLegendContainer
    this.linkColorLegendContainer = linkColorLegendContainer

    this.model = model
  }

  public setCosmograph(cosmograph: Cosmograph): void {
    this.cosmograph = cosmograph

    this._pointSizeLegend = new CosmographSizeLegend(this.cosmograph, this.pointSizeLegendContainer, {
      label: d => `points by ${d}`,
    })
    this._pointRangeColorLegend = new CosmographRangeColorLegend(this.cosmograph, this.pointColorLegendContainer, {
      label: d => `points by ${d}`,
    })
    this._pointTypeColorLegend = new CosmographTypeColorLegend(this.cosmograph, this.pointTypeColorLegendContainer, {})
    this._linkWidthLegend = new CosmographSizeLegend(this.cosmograph, this.linkWidthLegendContainer, {
      useLinksData: true,
      label: d => `links by ${d}`,
    })
    this._linkRangeColorLegend = new CosmographRangeColorLegend(this.cosmograph, this.linkColorLegendContainer, {
      useLinksData: true,
      label: d => `links by ${d}`,
    })

    // Hide legends safely - workaround for cosmograph lib bug where _uiComponent might be undefined
    this._safeHideLegend(this._pointSizeLegend)
    this._safeHideLegend(this._pointRangeColorLegend)
    this._safeHideLegend(this._pointTypeColorLegend)
    this._safeHideLegend(this._linkWidthLegend)
    this._safeHideLegend(this._linkRangeColorLegend)
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
        this._updateVisibility(this._pointSizeLegend, hide || (
          (activePointSizeStrategy === PointSizeStrategy.Auto || activePointSizeStrategy === PointSizeStrategy.Direct) && !column_by
        ))
        break
      }

      case 'point_color': {
        const colorType = getPointColorLegendType(this.cosmograph, column_by)
        this._updateVisibility(this._pointRangeColorLegend, hide || colorType !== ColorType.Range)
        this._updateVisibility(this._pointTypeColorLegend, hide || colorType !== ColorType.Type)
        break
      }
      case 'link_width': {
        this._updateVisibility(this._linkWidthLegend, hide || !column_by)
        break
      }
      case 'link_color': {
        this._updateVisibility(this._linkRangeColorLegend, hide || !column_by)
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
    hide: boolean
  ): void {
    if (!legend) return
    if (hide) {
      this._safeHideLegend(legend)
    } else {
      this._safeShowLegend(legend)
    }
  }
}
