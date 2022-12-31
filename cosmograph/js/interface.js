

set_data = function(canvas_id, links, nodes) {
    // Note: nodes and links inverted
    if (window.SetData) window.SetData(canvas_id, nodes, links)
}
