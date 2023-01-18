

window.cosmos__set_data = function(canvas_id, links, nodes) {
    // Note: nodes and links inverted
    const graph = Graphs.get(canvas_id)
    if (graph) graph.setData(nodes, links)
}
