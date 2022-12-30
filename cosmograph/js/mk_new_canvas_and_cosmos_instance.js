window.CreateCanvasAndCosmosById = function (id, height, width) {
    const canvas = document.createElement("canvas")
    canvas.style.height = height;
    canvas.style.width = width;
    Canvases.set(id, canvas)
    const graph = new cosmos.Graph(canvas)
    Graphs.set(id, graph)
}