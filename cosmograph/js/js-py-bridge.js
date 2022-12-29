//_js_mk_canvas_and_graphs_containers

window.Canvases = new Map()
window.Graphs = new Map()


// _js_mk_new_canvas_and_cosmos_instance
window.CreateCanvasAndCosmosById = function (id, height, width) {
    const canvas = document.createElement("canvas")
    canvas.style.height = height;
    canvas.style.width = width;
    Canvases.set(id, canvas)
    const graph = new cosmos.Graph(canvas)
    Graphs.set(id, graph)
}

// _js_mk_api_methods
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




