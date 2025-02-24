import { Cosmograph, CosmographButtonFitView, CosmographButtonPlayPause, CosmographButtonSelectArea, CosmographButtonZoomInOut } from '@cosmograph/cosmograph'
import { createWidgetControlElements } from '.././widget-elements'

export class ControlButtonsComponent {
  public cosmograph: Cosmograph
  public element: HTMLElement
  public fitViewButton: CosmographButtonFitView
  public zoomInOutButton: CosmographButtonZoomInOut
  public playButton: CosmographButtonPlayPause
  public selectAreaButton: CosmographButtonSelectArea

  constructor(cosmograph: Cosmograph, element: HTMLElement) {
    this.cosmograph = cosmograph
    this.element = element
    const { fitViewButtonContainer, zoomInOutButtonContainer, playButtonContainer, selectAreaButtonContainer } = createWidgetControlElements(element)
    this.fitViewButton = new CosmographButtonFitView(cosmograph, fitViewButtonContainer)

    /** Error in cosmograph/ui button in CSS */
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    this.fitViewButton._fitViewButton.show()
    this.zoomInOutButton = new CosmographButtonZoomInOut(cosmograph, zoomInOutButtonContainer)

    /** Error in cosmograph/ui button in CSS */
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    this.zoomInOutButton._zoomInButton.show()
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    this.zoomInOutButton._zoomOutButton.show()

    this.playButton = new CosmographButtonPlayPause(cosmograph, playButtonContainer)
    this.selectAreaButton = new CosmographButtonSelectArea(cosmograph, selectAreaButtonContainer, {})

    /** Error in cosmograph/ui button in CSS */
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    this.selectAreaButton._selectAreaButton.show()
  }
}
