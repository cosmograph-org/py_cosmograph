import { Cosmograph } from '@cosmograph/cosmograph'

export class PointInfoPanel {
  private container: HTMLElement
  private panel: HTMLDivElement
  private cosmograph: Cosmograph
  private isVisible: boolean = false

  constructor(cosmograph: Cosmograph, container: HTMLElement) {
    this.cosmograph = cosmograph
    this.container = container
    this.panel = this.createPanel()
    this.container.appendChild(this.panel)
  }

  private createPanel(): HTMLDivElement {
    const panel = document.createElement('div')
    panel.className = 'point-info-panel'
    panel.style.display = 'none'
    return panel
  }

  public async showPointInfo(index: number | null): Promise<void> {
    if (index === null || index === undefined) {
      this.hide()
      return
    }

    try {
      // Get point data using getPointsByIndices
      const pointData = await this.cosmograph.getPointsByIndices([index])

      if (!pointData || pointData.numRows === 0) {
        this.hide()
        return
      }

      // Extract point information
      const info: Record<string, any> = {}
      const columnNames = pointData.schema.fields.map((field: any) => field.name)

      // Get values from the first (and only) row
      columnNames.forEach((columnName: string) => {
        const column = pointData.getChild(columnName)
        if (column && column.length > 0) {
          info[columnName] = column.get(0)
        }
      })

      this.renderInfo(info, index)
      this.show()
    } catch (error) {
      console.error('Error fetching point data:', error)
      this.hide()
    }
  }

  private renderInfo(info: Record<string, any>, index: number): void {
    this.panel.innerHTML = ''

    // Create fixed header container with title
    const content = document.createElement('div')
    content.className = 'point-info-content'

    const header = document.createElement('div')
    header.className = 'point-info-header'
    header.textContent = `Point #${index}`
    content.appendChild(header)

    this.panel.appendChild(content)

    // Create scrollable items container
    const itemsContainer = document.createElement('div')
    itemsContainer.className = 'point-info-items'

    // Filter out internal/complex fields and render the rest
    const displayableFields = Object.entries(info)
      .filter(([key, value]) => {
        // Skip internal fields and arrays/objects
        if (key.startsWith('_') || key.startsWith('__')) return false
        if (typeof value === 'object' && value !== null) return false
        return true
      })
      .slice(0, 8) // Limit to first 8 fields to keep it minimal

    if (displayableFields.length === 0) {
      const noData = document.createElement('div')
      noData.className = 'point-info-item'
      noData.textContent = 'No displayable data'
      itemsContainer.appendChild(noData)
    } else {
      displayableFields.forEach(([key, value]) => {
        const item = document.createElement('div')
        item.className = 'point-info-item'

        const label = document.createElement('div')
        label.className = 'point-info-label'
        label.textContent = key

        const valueDiv = document.createElement('div')
        valueDiv.className = 'point-info-value'

        // Format value based on type
        if (typeof value === 'number') {
          valueDiv.textContent = Number.isInteger(value)
            ? value.toString()
            : value.toFixed(3)
        } else if (value === null || value === undefined) {
          valueDiv.textContent = 'null'
          valueDiv.style.opacity = '0.5'
        } else {
          valueDiv.textContent = String(value)
        }

        item.appendChild(label)
        item.appendChild(valueDiv)
        itemsContainer.appendChild(item)
      })
    }

    this.panel.appendChild(itemsContainer)

    // Create close button (fixed at top)
    const closeButton = document.createElement('button')
    closeButton.className = 'point-info-close'
    closeButton.innerHTML = '×'
    closeButton.onclick = () => this.hide()
    this.panel.appendChild(closeButton)
  }

  private show(): void {
    this.isVisible = true
    this.panel.style.display = 'flex'
  }

  private hide(): void {
    this.isVisible = false
    this.panel.style.display = 'none'
  }

  public destroy(): void {
    this.panel.remove()
  }
}
