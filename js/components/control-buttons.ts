import { Cosmograph, CosmographButtonFitView, CosmographButtonPlayPause, CosmographButtonRectangularSelection, CosmographButtonZoomInOut } from '@cosmograph/cosmograph'
import { createWidgetControlElements } from '.././widget-elements'

export class ControlButtonsComponent {
  public cosmograph: Cosmograph
  public element: HTMLElement
  public fitViewButton: CosmographButtonFitView
  public zoomInOutButton: CosmographButtonZoomInOut
  public playButton: CosmographButtonPlayPause
  public selectAreaButton: CosmographButtonRectangularSelection

  constructor(cosmograph: Cosmograph, element: HTMLElement) {
    this.cosmograph = cosmograph
    this.element = element
    const { fitViewButtonContainer, zoomInOutButtonContainer, playButtonContainer, selectAreaButtonContainer } = createWidgetControlElements(element)
    this.fitViewButton = new CosmographButtonFitView(cosmograph, fitViewButtonContainer)
    this.zoomInOutButton = new CosmographButtonZoomInOut(cosmograph, zoomInOutButtonContainer)
    this.playButton = new CosmographButtonPlayPause(cosmograph, playButtonContainer)
    this.selectAreaButton = new CosmographButtonRectangularSelection(cosmograph, selectAreaButtonContainer, {})
  }
}
