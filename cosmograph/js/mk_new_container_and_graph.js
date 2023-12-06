globalThis.CreateContainerAndCosmographById = function (id, height, width, config) {
  const container = document.createElement("div")
  container.style.height = height;
  container.style.width = width;
  GraphContainers.set(id, container)
  const graph = new cosmograph.Cosmograph(container, config)
  Graphs.set(id, graph)
}