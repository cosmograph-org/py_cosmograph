import { Cosmograph } from '@cosmograph/cosmograph'
import type { RenderProps } from '@anywidget/types'

export interface SettingsPanelConfig {
  onPointSizeChange?: (value: number) => void;
  onLabelsToggle?: (enabled: boolean) => void;
  onSimulationParamChange?: (param: string, value: number) => void;
}

export class SettingsPanel {
  private panelContainer: HTMLElement
  private buttonContainer: HTMLElement
  private panel: HTMLDivElement
  private isExpanded: boolean = false
  private model: RenderProps['model']
  private cosmograph: Cosmograph
  private controls: Map<string, HTMLInputElement> = new Map()
  private simulationSection: HTMLDivElement | null = null
  private showLabelsContainer: HTMLDivElement | null = null

  constructor(
    cosmograph: Cosmograph,
    panelContainer: HTMLElement,
    buttonContainer: HTMLElement,
    model: RenderProps['model']
  ) {
    this.panelContainer = panelContainer
    this.buttonContainer = buttonContainer
    this.model = model
    this.cosmograph = cosmograph
    this.panel = this.createPanel()
    this.panelContainer.appendChild(this.panel)
    this.setupModelListeners()
    this.syncFromCosmograph()
    this.updateSimulationVisibility()
    this.updateLabelsCheckboxState()
  }

  private createPanel(): HTMLDivElement {
    const panel = document.createElement('div')
    panel.className = 'settings-panel'

    // Create toggle button in the button container
    const toggleButton = document.createElement('button')
    toggleButton.className = 'settings-panel-toggle'
    toggleButton.innerHTML = '⚙️'
    toggleButton.title = 'Settings'
    toggleButton.onclick = () => this.togglePanel()
    this.buttonContainer.appendChild(toggleButton)

    // Content container
    const content = document.createElement('div')
    content.className = 'settings-panel-content'

    // Point Size Scale Slider
    content.appendChild(this.createSlider(
      'Point Size Scale',
      'pointSizeScale',
      0.1,
      5,
      0.1,
      this.model.get('point_size_scale') || 1
    ))

    // Labels Toggle
    const showLabelsValue = this.model.get('show_labels')
    this.showLabelsContainer = this.createToggle(
      'Show Labels',
      'showLabels',
      showLabelsValue !== null && showLabelsValue !== undefined ? showLabelsValue : false
    )
    content.appendChild(this.showLabelsContainer)

    // Simulation controls section (only visible when not using embedding)
    const simSection = document.createElement('div')
    simSection.className = 'settings-section'
    const simTitle = document.createElement('div')
    simTitle.className = 'settings-section-title'
    simTitle.textContent = 'Simulation'
    simSection.appendChild(simTitle)

    // Simulation Gravity
    simSection.appendChild(this.createSlider(
      'Gravity',
      'simulationGravity',
      0,
      0.5,
      0.01,
      this.model.get('simulation_gravity') || 0
    ))

    // Simulation Repulsion
    simSection.appendChild(this.createSlider(
      'Repulsion',
      'simulationRepulsion',
      0,
      2,
      0.01,
      this.model.get('simulation_repulsion') || 0.1
    ))

    // Link Spring (Link Strength)
    simSection.appendChild(this.createSlider(
      'Link Strength',
      'simulationLinkSpring',
      0,
      2,
      0.01,
      this.model.get('simulation_link_spring') || 1
    ))

    // Link Distance
    simSection.appendChild(this.createSlider(
      'Link Distance',
      'simulationLinkDistance',
      1,
      20,
      1,
      this.model.get('simulation_link_distance') || 2
    ))

    // Simulation Friction
    simSection.appendChild(this.createSlider(
      'Friction',
      'simulationFriction',
      0,
      1,
      0.01,
      this.model.get('simulation_friction') || 0.85
    ))

    this.simulationSection = simSection
    content.appendChild(simSection)

    panel.appendChild(content)
    return panel
  }

  private createSlider(
    label: string,
    property: string,
    min: number,
    max: number,
    step: number,
    defaultValue: number
  ): HTMLDivElement {
    const container = document.createElement('div')
    container.className = 'settings-control'

    const labelDiv = document.createElement('div')
    labelDiv.className = 'settings-label'

    const labelText = document.createElement('span')
    labelText.textContent = label

    const valueDisplay = document.createElement('span')
    valueDisplay.className = 'settings-value'
    valueDisplay.textContent = defaultValue.toString()

    labelDiv.appendChild(labelText)
    labelDiv.appendChild(valueDisplay)

    const slider = document.createElement('input')
    slider.type = 'range'
    slider.min = min.toString()
    slider.max = max.toString()
    slider.step = step.toString()
    slider.value = defaultValue.toString()
    slider.className = 'settings-slider'

    slider.oninput = () => {
      const value = parseFloat(slider.value)
      valueDisplay.textContent = value.toFixed(step < 1 ? 2 : 0)
      this.updateModelProperty(property, value)
    }

    // Store reference to slider and its value display for updates
    this.controls.set(property, slider)
    this.controls.set(`${property}_display`, valueDisplay as any)

    container.appendChild(labelDiv)
    container.appendChild(slider)
    return container
  }

  private createToggle(
    label: string,
    property: string,
    defaultValue: boolean
  ): HTMLDivElement {
    const container = document.createElement('div')
    container.className = 'settings-control'

    const labelDiv = document.createElement('label')
    labelDiv.className = 'settings-toggle-label'

    const checkbox = document.createElement('input')
    checkbox.type = 'checkbox'
    checkbox.checked = defaultValue
    checkbox.className = 'settings-checkbox'

    checkbox.onchange = () => {
      this.updateModelProperty(property, checkbox.checked)
    }

    const span = document.createElement('span')
    span.textContent = label

    labelDiv.appendChild(checkbox)
    labelDiv.appendChild(span)
    container.appendChild(labelDiv)

    // Store reference to checkbox for updates
    this.controls.set(property, checkbox)

    return container
  }

  private updateModelProperty(property: string, value: number | boolean): void {
    // Convert camelCase to snake_case
    const snakeCase = property.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
    this.model.set(snakeCase, value)
    this.model.save_changes()
  }

  private async syncFromCosmograph(): Promise<void> {
    // Get actual config from cosmograph to sync UI with reality
    const config = await this.cosmograph.getConfig()

    // Update checkboxes to reflect actual state
    const showLabelsControl = this.controls.get('showLabels')
    if (showLabelsControl && config.showLabels !== undefined) {
      showLabelsControl.checked = config.showLabels
    }

    // Update sliders
    const pointSizeScaleControl = this.controls.get('pointSizeScale')
    if (pointSizeScaleControl && config.pointSizeScale !== undefined) {
      pointSizeScaleControl.value = config.pointSizeScale.toString()
      const display = this.controls.get('pointSizeScale_display') as any
      if (display) {
        display.textContent = config.pointSizeScale.toFixed(1)
      }
    }

    // Update simulation parameters
    const simParams = [
      { key: 'simulationGravity', decimals: 2 },
      { key: 'simulationRepulsion', decimals: 2 },
      { key: 'simulationLinkSpring', decimals: 2 },
      { key: 'simulationLinkDistance', decimals: 0 },
      { key: 'simulationFriction', decimals: 2 },
    ]

    simParams.forEach(({ key, decimals }) => {
      const value = (config as any)[key]
      if (value !== undefined) {
        const control = this.controls.get(key)
        if (control) {
          control.value = value.toString()
          const display = this.controls.get(`${key}_display`) as any
          if (display) display.textContent = value.toFixed(decimals)
        }
      }
    })
  }

  private updateSimulationVisibility(): void {
    // Show simulation controls only if not using embedding (point_x_by and point_y_by)
    const hasEmbedding = this.model.get('point_x_by') || this.model.get('point_y_by')
    if (this.simulationSection) {
      this.simulationSection.style.display = hasEmbedding ? 'none' : 'block'
    }
  }

  private updateLabelsCheckboxState(): void {
    // Enable/disable show labels checkbox based on whether point_label_by is set
    const pointLabelBy = this.model.get('point_label_by')
    const hasLabelSource = pointLabelBy !== null && pointLabelBy !== undefined && pointLabelBy !== ''

    const checkbox = this.controls.get('showLabels')
    if (checkbox && this.showLabelsContainer) {
      checkbox.disabled = !hasLabelSource

      // Add visual indication via opacity when disabled
      if (hasLabelSource) {
        this.showLabelsContainer.style.opacity = '1'
        this.showLabelsContainer.title = ''
      } else {
        this.showLabelsContainer.style.opacity = '0.5'
        this.showLabelsContainer.title = 'Set point_label_by to enable labels'
      }
    }
  }

  private setupModelListeners(): void {
    // Listen for changes from Python to update UI
    const properties = [
      'point_size_scale',
      'show_labels',
      'simulation_gravity',
      'simulation_repulsion',
      'simulation_link_spring',
      'simulation_link_distance',
      'simulation_friction',
      'point_x_by',
      'point_y_by',
      'point_label_by',
    ]

    properties.forEach((snakeProp) => {
      this.model.on(`change:${snakeProp}`, () => {
        // Update simulation visibility if embedding properties change
        if (snakeProp === 'point_x_by' || snakeProp === 'point_y_by') {
          this.updateSimulationVisibility()
          return
        }

        // Update labels checkbox state if point_label_by changes
        if (snakeProp === 'point_label_by') {
          this.updateLabelsCheckboxState()
          return
        }

        const camelProp = snakeProp.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
        const value = this.model.get(snakeProp)
        const control = this.controls.get(camelProp)

        if (control) {
          if (control.type === 'checkbox') {
            control.checked = value ?? false
          } else if (control.type === 'range') {
            const numValue = value ?? parseFloat(control.min)
            control.value = numValue.toString()
            // Update display
            const display = this.controls.get(`${camelProp}_display`) as any
            if (display) {
              const step = parseFloat(control.step)
              display.textContent = numValue.toFixed(step < 1 ? 2 : 0)
            }
          }
        }
      })
    })
  }

  private togglePanel(): void {
    this.isExpanded = !this.isExpanded
    this.panel.style.display = this.isExpanded ? 'block' : 'none'
  }

  public destroy(): void {
    this.panel.remove()
  }
}
