var netData = {};
var oldSelectedData = [];

function callMakeGraph() {
  let newSelectedData = _.map(container.getSelected(), function (row) {
    return row[0];
  });
  newSelectedData.sort();
  if (!_.isEqual(newSelectedData, oldSelectedData)) {
    oldSelectedData = newSelectedData;
    let edges = getEdgesFromCliques(container.getSelected());
    getFullGraph(edges);
  }
}

function edgeDId(e) {
  return e[0] + "#" + e[1];
}

function getAdj(edges) {
  var adj = {};
  _.each(edges, function (e) {
    for (i in [0, 1]) {
      if (adj[e[i]] === undefined) adj[e[i]] = [];
      adj[e[i]].push(e[1 - i]);
    }
  });
  return adj;
}
function connComp(adj, r) {
  var comp = new Set([r]);
  var stack = [r];
  while (stack.length > 0) {
    v = stack.pop();
    if (adj[v] !== undefined)
      for (i in adj[v]) {
        w = adj[v][i];
        if (!comp.has(w)) {
          stack.push(+w);
          comp.add(w);
        }
      }
  }
  console.log("comp", comp);
  return comp;
}

function getComponents(adj) {
  var components = [];
  var componentNodes = new Set();
  _.each(adj, function (a, v) {
    if (!componentNodes.has(+v)) {
      var component = connComp(adj, +v);
      components.push(component);
      componentNodes = new Set(_.union([...component], [...componentNodes]));
    }
  });
  return components;
}

function bitmapToTissues(currMask) {
  let tisBits = container.allData.tisBits;
  let ar = [];
  _.each(tisBits, function (mask, tis) {
    if ((currMask & mask) == mask) {
      ar.push(tis);
    }
  });
  return ar;
}

function GOtoString(GO) {
  let GOString = GO[0] + "\t" + GO[1];
  _.each(GO.slice(2), function (v) {
    GOString += ";" + v;
  });
  return GOString;
}

function downloadArray(array) {
  var csvData = new Blob([array], { type: "text/csv;charset=utf-8;" });
  var csvURL = null;
  if (navigator.msSaveBlob) {
    csvURL = navigator.msSaveBlob(csvData, "download.csv");
  } else {
    csvURL = window.URL.createObjectURL(csvData);
  }

  var tempLink = document.createElement("a");
  tempLink.href = csvURL;
  tempLink.setAttribute("download", "download.csv");
  tempLink.click();
}

function createGraph(edges, components, nodeCount) {
  var nodePos = {};
  var n = nodeCount;
  var r = (64 * n) / Math.PI / 4;
  var a = (2 * Math.PI) / n;
  var R = 10;
  var nodeDeg = getNodeDegs(edges);
  var graph = { nodes: [], edges: [] };
  var nodeSet = new Set();
  var edgeSet = new Set();
  var k = 0;
  var GOCompList = [];
  _.each(components, function (s, i) {
    let componentGO = new Set();
    let iii = 0;
    let sList = [...s];
    let sizeOfS = _.size(sList);
    let m = k + _.size(sList) / 2;
    k += _.size(sList);
    let nodePos = [r * Math.cos(m * a), r * Math.sin(m * a)];
    _.each(sList, function (v) {
      let jjj = 1;
      let shape = "dot";
      if (container.GOData) {
        // var iii = container.GOData[container.curChr].segmentGeneInds;
        var segmentGO = container.GOData[container.curChr].segmentGeneInds[+v];
        if (segmentGO) {
          shape = "diamond";
          _.each(segmentGO, function (i) {
            componentGO.add(
              GOtoString(container.GOData[container.curChr].geneList[i])
            );
          });
        }
      }

      var node = {
        id: v,
        size: Math.sqrt(nodeDeg[v]) * R,
        x: nodePos[0],
        y: nodePos[1],
        title: v,
        color: d3.interpolatePuOr(v / container.maxC),
        shape: shape,
      };
      graph.nodes.push(node);
      nodeSet.add(v);
    });
    console.log("\nnew component", sizeOfS);

    _.each([...componentGO], function (go) {
      console.log("\t", go);
      GOCompList.push(go);
    });
  });
  // downloadArray(GOCompList);

  _.each(edges, function (e) {
    if (!edgeSet.has(edgeDId(e))) {
      edgeSet.add(e);
      let tissues = bitmapToTissues(e[2]);
      graph.edges.push({
        id: edgeDId(e),
        from: e[0],
        to: e[1],
        length: nodeDeg[e[0]] + nodeDeg[e[1]] + R * 4,
        title: tissues.toString(),
      });
    }
  });

  return graph;
}

function sortedEdge(A, B) {
  return [Math.min(A, B), Math.max(A, B)];
}

//graphData -
function getEdgesFromCliques(graphData) {
  let edgeIDSet = new Set();
  let edges = [];
  for (let i in graphData) {
    let K3 = graphData[i];
    let verticePairs = [
      [1, 2],
      [1, 3],
      [2, 3],
    ];
    verticePairs.forEach(function (endpoint) {
      let edge = sortedEdge(K3[endpoint[0]], K3[endpoint[1]]).concat([K3[6]]);
      let edgeID = edgeDId(edge);
      if (!edgeIDSet.has(edgeID)) {
        edges.push(edge);
        edgeIDSet.add(edgeID);
      }
    });
  }
  console.log("edges", edges);
  return edges;
}

function getNodeDegs(edges) {
  let nodeDeg = {};
  _.each(edges, function (e) {
    for (i in [0, 1]) {
      if (!nodeDeg[e[i]]) {
        nodeDeg[e[i]] = 0;
      }
      nodeDeg[e[i]] += 1;
    }
  });
  return nodeDeg;
}

function filterEdgesWithBigDeg(edges) {
  let nodeDeg = getNodeDegs(edges);
  let nodesDeg2 = new Set();
  _.each(nodeDeg, function (d, v) {
    if (d < 3) {
      nodesDeg2.add(+v);
    }
  });
  let filteredEdges = _.filter(edges, function (e) {
    return !(nodesDeg2.has(e[0]) || nodesDeg2.has(e[1]));
  });
  return filteredEdges;
}

function getFullGraph(edges) {
  var adj = getAdj(edges);
  var components = getComponents(adj);
  var nodeCount = _.size(adj);
  $("#graphDescription").text(
    `Graph with ${nodeCount} nodes, ${_.size(edges)} edges, 
    split into ${_.size(components)} components.`
  );
  clearDiv($("#mygraph"));
  if (nodeCount > 1000) {
    console.log("getFullGraph number of components:", _.size(components));
    // $("#mygraph").
    $("#mygraph").text("Graph is too large to display!");
  } else {
    var graph = createGraph(edges, components, nodeCount);
    console.log("graph", graph);
    drawGraph(graph);
  }
}

function drawGraph(graph) {
  var nodes = new vis.DataSet({});
  var objMap = {};
  _.each(graph.nodes, function (node) {
    var info = node;
    nodes.add(info);
    objMap[node.id] = node;
  });
  var edges = new vis.DataSet({});
  _.each(graph.edges, function (link) {
    var info = link;
    edges.add(info);
  });
  /* create a network */
  var container = document.getElementById("mygraph");
  var data = {
    nodes: nodes,
    edges: edges,
  };
  var options = {
    nodes: {
      // size: 10,
      borderWidth: 1.75,
      shape: "dot",
      scaling: {
        min: 10,
        max: 36,
      },
      font: {
        multi: "html",
        size: 12,
        face: "Tahoma",
      },
      color: {
        background: "blue",
        border: "white",
        highlight: { background: "darkblue", border: "orange" },
        hover: { background: "mediumblue", border: "gold" },
      },
    },
    edges: {
      width: 6,
      color: {
        color: "rgba(30,144,255,1)",
        inherit: false,
      },
      smooth: false,
      scaling: {
        min: 1,
        max: 20,
      },
      font: {
        multi: "html",
        size: 16,
        face: "Tahoma",
      },
    },
    physics: {
      forceAtlas2Based: {
        gravitationalConstant: -640,
        centralGravity: 0.01,
        springLength: 230,
        springConstant: 0.18,
        avoidOverlap: 0.3,
      },
      maxVelocity: 146,
      solver: "forceAtlas2Based",
      timestep: 0.35,
      stabilization: { iterations: 150 },
    },
    interaction: {
      tooltipDelay: 200,
      hover: true,
      multiselect: true,
    },
  };
  var network = new vis.Network(container, data, options);
  network.on("dragEnd", function (params) {
    for (var i = 0; i < params.nodes.length; i++) {
      var nodeId = params.nodes[i];
      nodes.update({ id: nodeId, fixed: { x: true, y: true } });
      objMap[nodeId].freeze = true;
    }
  });
  network.on("dragStart", function (params) {
    for (var i = 0; i < params.nodes.length; i++) {
      var nodeId = params.nodes[i];
      nodes.update({ id: nodeId, fixed: { x: false, y: false } });
    }
  });
  netData.network = network;
  netData.data = data;
  netData.graph = graph;
  netData.freeze = false;
  netData.objMap = objMap;
}

function freezeNodes() {
  netData.freeze = !netData.freeze;
  var updatedNodes = _.map(netData.graph.nodes, function (node) {
    var freeze = (netData.freeze | netData.objMap[node.id].freeze) == 1;
    return { id: node.id, fixed: { x: freeze, y: freeze } };
  });
  netData.data.nodes.update(updatedNodes);
}

function selectComponent() {
  var component = connComp(adj, +v);
}
