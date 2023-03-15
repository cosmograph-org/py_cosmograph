

globalThis.cosmos__set_data = function(canvas_id, links, nodes, config) {
    // Note: nodes and links inverted
    const graph = Graphs.get(canvas_id)
    if (graph) {
        graph.setData(nodes, links)
        graph.setConfig(config)
    }
}

globalThis.cosmos__set_config = function(canvas_id, config) {
    const graph = Graphs.get(canvas_id)
    if (graph) graph.setConfig(config)    
}
