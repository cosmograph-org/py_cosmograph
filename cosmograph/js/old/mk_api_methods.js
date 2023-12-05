globalThis.SetData = function (id, nodes, links) {
    const graph = Graphs.get(id)
    if (graph) graph.setData(nodes, links)
}
globalThis.FitView = function (id) {
    const graph = Graphs.get(id)
    if (graph) graph.fitView()
}
globalThis.AddGraphContainerToDivById = function (id) {
    const container = GraphContainers.get(id)
    const divElement = document.querySelector(`#${id}`)
    if (divElement && container) {
        divElement.appendChild(container)
    }
}