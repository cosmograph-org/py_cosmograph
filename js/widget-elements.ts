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

export function createLoadingOverlay(el: HTMLElement): HTMLDivElement {
  const loadingOverlay = document.createElement('div')
  loadingOverlay.classList.add('loading-overlay')

  const spinner = document.createElement('div')
  spinner.classList.add('loading-spinner')

  loadingOverlay.appendChild(spinner)
  el.appendChild(loadingOverlay)

  return loadingOverlay
}

export function showLoadingOverlay(loadingOverlay: HTMLDivElement): void {
  loadingOverlay.style.display = 'flex'
  loadingOverlay.style.opacity = '1'
}

export function hideLoadingOverlay(loadingOverlay: HTMLDivElement): void {
  loadingOverlay.style.opacity = '0'
  setTimeout(() => {
    loadingOverlay.style.display = 'none'
  }, 300) // Match the CSS transition duration
}

export function setLoadingOverlayBackgroundColor(loadingOverlay: HTMLDivElement, color: string | number[] | undefined): void {
  if (!color) return

  if (typeof color === 'string') {
    loadingOverlay.style.backgroundColor = color
  } else if (Array.isArray(color) && color.length >= 3) {
    // Convert RGB array to CSS color
    const r = Math.round(color[0] * 255)
    const g = Math.round(color[1] * 255)
    const b = Math.round(color[2] * 255)
    const a = color.length > 3 ? color[3] : 1
    loadingOverlay.style.backgroundColor = `rgba(${r}, ${g}, ${b}, ${a})`
  }
}

export function createWidgetLegendElements(el: HTMLElement): Record<string, HTMLDivElement> {
  const bottomContainer = document.createElement('div')
  bottomContainer.classList.add('bottom')
  el.appendChild(bottomContainer)

  // Left side container for color legends
  const leftLegendsContainer = document.createElement('div')
  leftLegendsContainer.classList.add('leftLegends')
  bottomContainer.appendChild(leftLegendsContainer)

  const pointColorLegendContainer = document.createElement('div')
  pointColorLegendContainer.classList.add('pointColorLegend')
  leftLegendsContainer.appendChild(pointColorLegendContainer)

  const pointTypeColorLegendContainer = document.createElement('div')
  pointTypeColorLegendContainer.classList.add('pointTypeColorLegend')
  leftLegendsContainer.appendChild(pointTypeColorLegendContainer)

  const linkColorLegendContainer = document.createElement('div')
  linkColorLegendContainer.classList.add('linkColorLegend')
  leftLegendsContainer.appendChild(linkColorLegendContainer)

  // Right side container for size/width legends
  const rightLegendsContainer = document.createElement('div')
  rightLegendsContainer.classList.add('rightLegends')
  bottomContainer.appendChild(rightLegendsContainer)

  const pointSizeLegendContainer = document.createElement('div')
  pointSizeLegendContainer.classList.add('pointSizeLegend')
  rightLegendsContainer.appendChild(pointSizeLegendContainer)

  const linkWidthLegendContainer = document.createElement('div')
  linkWidthLegendContainer.classList.add('linkWidthLegend')
  rightLegendsContainer.appendChild(linkWidthLegendContainer)

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

  const playButtonContainer = document.createElement('div')
  playButtonContainer.classList.add('playButton')
  leftControlsContainer.appendChild(playButtonContainer)

  const selectAreaButtonContainer = document.createElement('div')
  selectAreaButtonContainer.classList.add('selectAreaButton')
  leftControlsContainer.appendChild(selectAreaButtonContainer)

  // Create right controls container
  const rightControlsContainer = document.createElement('div')
  rightControlsContainer.classList.add('rightControls')
  el.appendChild(rightControlsContainer)

  const fitViewButtonContainer = document.createElement('div')
  fitViewButtonContainer.classList.add('fitViewButton')
  rightControlsContainer.appendChild(fitViewButtonContainer)

  const zoomInOutButtonContainer = document.createElement('div')
  zoomInOutButtonContainer.classList.add('zoomInOutButton')
  rightControlsContainer.appendChild(zoomInOutButtonContainer)

  const settingsButtonContainer = document.createElement('div')
  settingsButtonContainer.classList.add('settingsButton')
  rightControlsContainer.appendChild(settingsButtonContainer)

  return {
    fitViewButtonContainer,
    zoomInOutButtonContainer,
    playButtonContainer,
    selectAreaButtonContainer,
    settingsButtonContainer,
  }
}
