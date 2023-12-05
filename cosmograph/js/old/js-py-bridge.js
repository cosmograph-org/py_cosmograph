//_js_mk_canvas_and_graphs_containers

globalThis.Canvases = new Map()
globalThis.Graphs = new Map()


// _js_mk_new_canvas_and_cosmos_instance
globalThis.CreateCanvasAndCosmosById = function (id, height, width) {
    const canvas = document.createElement("canvas")
    canvas.style.height = height;
    canvas.style.width = width;
    Canvases.set(id, canvas)
    const graph = new cosmos.Graph(canvas)
    Graphs.set(id, graph)
}

// _js_mk_api_methods
globalThis.SetData = function (id, nodes, links) {
    const graph = Graphs.get(id)
    if (graph) graph.setData(nodes, links)
}
globalThis.FitView = function (id) {
    const graph = Graphs.get(id)
    if (graph) graph.fitView()
}
globalThis.AddCanvasToDivById = function (id) {
    const canvas = Canvases.get(id)
    const divElement = document.querySelector(`#${id}`)
    if (divElement && canvas) {
        divElement.appendChild(canvas)
    }
}





