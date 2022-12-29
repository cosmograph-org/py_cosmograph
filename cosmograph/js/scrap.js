




// Straight function definition
function foo(a, b="hello", c= 3) {
    return a + b.length * c
}

// function assigned to a variable of window
window.SetData = function (id, nodes, links) {
    const graph = Graphs.get(id)
    if (graph) graph.setData(nodes, links)
}

// function nested in some other function, assigned to a variable
var obj = (function (exports) {
    function bar(name) {
        return name + "__"
    }
})