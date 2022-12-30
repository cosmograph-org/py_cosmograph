window.SetData = function (id, nodes, links) {
    const graph = Graphs.get(id)
    if (graph) graph.setData(nodes, links)
}
window.FitView = function (id) {
    const graph = Graphs.get(id)
    if (graph) graph.fitView()
}
window.AddCanvasToDivById = function (id) {
    const canvas = Canvases.get(id)
    const divElement = document.querySelector(`#${id}`)
    if (divElement && canvas) {
        divElement.appendChild(canvas)
    }
}