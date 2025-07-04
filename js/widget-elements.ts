export function createWidgetContainer(el: HTMLElement): Record<string, HTMLDivElement> {
  el.classList.add('wrapper')
  const graphContainer = document.createElement('div')
  graphContainer.classList.add('graph')
  el.appendChild(graphContainer)

  const timelineContainer = document.createElement('div')
  timelineContainer.classList.add('timeline')
  el.appendChild(timelineContainer)

  const controlsContainer = document.createElement('div')
  controlsContainer.classList.add('controls')
  el.appendChild(controlsContainer)

  return {
    graphContainer,
    timelineContainer,
    controlsContainer,
  }
}

export function createWidgetLegendElements(el: HTMLElement): Record<string, HTMLDivElement> {
  const bottomContainer = document.createElement('div')
  bottomContainer.classList.add('bottom')
  el.appendChild(bottomContainer)

  const pointSizeLegendContainer = document.createElement('div')
  pointSizeLegendContainer.classList.add('pointSizeLegend')
  bottomContainer.appendChild(pointSizeLegendContainer)

  const linkWidthLegendContainer = document.createElement('div')
  linkWidthLegendContainer.classList.add('linkWidthLegend')
  bottomContainer.appendChild(linkWidthLegendContainer)

  const pointColorLegendContainer = document.createElement('div')
  pointColorLegendContainer.classList.add('pointColorLegend')
  bottomContainer.appendChild(pointColorLegendContainer)

  const pointTypeColorLegendContainer = document.createElement('div')
  pointTypeColorLegendContainer.classList.add('pointTypeColorLegend')
  bottomContainer.appendChild(pointTypeColorLegendContainer)

  const linkColorLegendContainer = document.createElement('div')
  linkColorLegendContainer.classList.add('linkColorLegend')
  bottomContainer.appendChild(linkColorLegendContainer)

  return {
    pointSizeLegendContainer,
    linkWidthLegendContainer,
    pointColorLegendContainer,
    pointTypeColorLegendContainer,
    linkColorLegendContainer,
  }
}

export function createWidgetControlElements(el: HTMLElement): Record<string, HTMLDivElement> {
  // Create left controls container
  const leftControlsContainer = document.createElement('div')
  leftControlsContainer.classList.add('leftControls')
  el.appendChild(leftControlsContainer)

  const fitViewButtonContainer = document.createElement('div')
  fitViewButtonContainer.classList.add('fitViewButton')
  leftControlsContainer.appendChild(fitViewButtonContainer)

  const selectAreaButtonContainer = document.createElement('div')
  selectAreaButtonContainer.classList.add('selectAreaButton')
  leftControlsContainer.appendChild(selectAreaButtonContainer)

  // Create right controls container
  const rightControlsContainer = document.createElement('div')
  rightControlsContainer.classList.add('rightControls')
  el.appendChild(rightControlsContainer)

  const playButtonContainer = document.createElement('div')
  playButtonContainer.classList.add('playButton')
  rightControlsContainer.appendChild(playButtonContainer)

  const zoomInOutButtonContainer = document.createElement('div')
  zoomInOutButtonContainer.classList.add('zoomInOutButton')
  rightControlsContainer.appendChild(zoomInOutButtonContainer)

  return {
    fitViewButtonContainer,
    zoomInOutButtonContainer,
    playButtonContainer,
    selectAreaButtonContainer,
  }
}
