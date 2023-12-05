globalThis.CreateContainerAndCosmographById = function (id, height, width) {
  const container = document.createElement("div")
  container.style.height = height;
  container.style.width = width;
  GraphContainers.set(id, container)
  const graph = new cosmograph.Cosmograph(container)
  Graphs.set(id, graph)
}