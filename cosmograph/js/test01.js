


// Straight function definition
function foo(a, b="hello", c= 3) {
    return a + b.length * c
}

// Straight function definition
function bar(green, eggs = 'food', and= true, ham= 4) {
    if (and) return eggs.length * ham
}

add_one = function (x) {
    return x + 1
}

let with_let = function (x) {
    return x + 2
}

const with_const = function (x) {
    return x + 2
}


// function assigned to a property of window
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