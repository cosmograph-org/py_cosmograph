import { Cosmograph, CosmographButtonFitView, CosmographButtonPlayPause, CosmographButtonPolygonalSelection, CosmographButtonZoomInOut } from '@cosmograph/cosmograph'
import { useEffect, useRef } from 'preact/hooks'

type CleanupTarget = { remove?: () => void; destroy?: () => void }

function cleanupButton(target: CleanupTarget | undefined): void {
  if (!target) return
  if (typeof target.remove === 'function') {
    target.remove()
    return
  }
  if (typeof target.destroy === 'function') {
    target.destroy()
  }
}

export interface ControlButtonsProps {
  cosmograph: Cosmograph | null
}

export function ControlButtons({ cosmograph }: ControlButtonsProps) {
  const fitViewRef = useRef<HTMLDivElement | null>(null)
  const zoomRef = useRef<HTMLDivElement | null>(null)
  const playRef = useRef<HTMLDivElement | null>(null)
  const selectRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!cosmograph) return
    if (!fitViewRef.current || !zoomRef.current || !playRef.current || !selectRef.current) return

    const fitViewButton = new CosmographButtonFitView(cosmograph, fitViewRef.current)
    const zoomButton = new CosmographButtonZoomInOut(cosmograph, zoomRef.current)
    const playButton = new CosmographButtonPlayPause(cosmograph, playRef.current)
    const selectButton = new CosmographButtonPolygonalSelection(cosmograph, selectRef.current, {})

    return () => {
      cleanupButton(fitViewButton as CleanupTarget)
      cleanupButton(zoomButton as CleanupTarget)
      cleanupButton(playButton as CleanupTarget)
      cleanupButton(selectButton as CleanupTarget)
    }
  }, [cosmograph])

  return (
    <div class="controls">
      <div class="leftControls">
        <div class="playButton" ref={playRef} />
        <div class="selectAreaButton" ref={selectRef} />
      </div>
      <div class="rightControls">
        <div class="fitViewButton" ref={fitViewRef} />
        <div class="zoomInOutButton" ref={zoomRef} />
      </div>
    </div>
  )
}
