import { Cosmograph, CosmographTimeline, CosmographTimelineConfig } from '@cosmograph/cosmograph'
import { merge } from '@cosmograph/ui'

export class LinkTimeline {
  public cosmograph: Cosmograph
  public element: HTMLElement
  public timeline: CosmographTimeline | undefined
  public defaultConfig: CosmographTimelineConfig = {
    showAnimationControls: true,
    useLinksData: true, // Enable link data mode
  }

  public config: CosmographTimelineConfig = this.defaultConfig

  constructor(cosmograph: Cosmograph, element: HTMLElement, config: CosmographTimelineConfig) {
    this.cosmograph = cosmograph
    this.element = element
    if (config.accessor) this._init(config)
  }

  public setConfig(config: CosmographTimelineConfig): void {
    this.config = merge(this.defaultConfig, config)
    if (this.timeline) this.timeline.setConfig(this.config)
    else this._init(this.config)

    if (this.config.accessor) {
      this.show()
    } else {
      this.hide()
    }
  }

  public show(): void {
    this.element.style.display = 'flex'
  }

  public hide(): void {
    this.element.style.display = 'none'
  }

  private _init(config: CosmographTimelineConfig): void {
    this.timeline = new CosmographTimeline(this.cosmograph, this.element, config)
  }
}
