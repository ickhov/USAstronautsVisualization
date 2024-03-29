
var radius = 7;

function drawNetworkGraph(astronautName, data) {

    d3.selectAll(".graphNode").remove();
    d3.selectAll(".graphLink").remove();

    var nodes_ = [], nodeIndex = 0;
    var links_ = [], linkIndex = 0;

    var svg = d3.select("#network");

    var boundingBox = svg.node().getBoundingClientRect();

    //  grab the width and height of our containing SVG
    var height = boundingBox.height;
    var width = boundingBox.width;

    var simulation = d3.forceSimulation()
        .force("link", d3.forceLink().id(function(d) { return d.name; }))
        .force("charge", d3.forceManyBody().strength(-10))
        .force("center", d3.forceCenter(width / 2, height / 2));

    var findIndexOfNode = function(name) {
        return nodes_.findIndex(function(obj) {
            return obj.name == name;
        });
    }
    // Create nodes for each unique source and target.
    data.forEach(function(d) {
        // group 0 = name; group 1 = mission
        // add in the node; no duplicates allowed so use dictionary
        if (astronautName[d.Name] != undefined) {
            nodes_[nodeIndex] = {"name": d.Name, "group": 0, "spacewalks": d.SpaceWalks, "spacewalkshr": d.SpaceWalksHR, "state": d.State};
            nodeIndex++;

            // get the links (missions); duplicate allowed so use array with index
            var missions = d.Missions.split(",");
    
            for (let mission of missions) {
                // avoid duplicate nodes
                if (findIndexOfNode(mission) < 0) {
                    nodes_[nodeIndex] = {"name": mission, "group": 1};
                    nodeIndex++;
                }

                links_[linkIndex] = {"source": mission, "target": d.Name};
                linkIndex++;
            }
        }
    });

    // define the tooltip behavior
    var tooltip = d3.select('#myTooltip');

    // show tooltip function
    var showTooltip = function(d) {
        tooltip.style('display', 'block');

        // set the initial position of the tooltip
        tooltip.style('left', d3.event.pageX + 'px');
        tooltip.style('top', d3.event.pageY + 'px');

        if (d.group == 0)
        {
            var sw, swhr;
            if (d.spacewalks <= 1)
                sw = "spacewalk";
            else
                sw = "spacewalks";

            if (d.spacewalks <= 1)
                swhr = "hr.";
            else
                swhr = "hrs.";

            tooltip.html("<strong>" + d.name + " (" + d.state + ")" +
            "</strong> did " + d.spacewalks + " " + sw +
            " for a total of " + d.spacewalkshr + " " + swhr);
        } else {
            tooltip.html("<strong>Mission:</strong> " + d.name);
        }
    }

    // hide tooltip function
    var hideTooltip = function(d) {
        tooltip.style('display', 'none');
    }
    
    var link = svg.append("g")
        .attr("class", "graphLink")
        .selectAll("line");

    var node = svg.append("g")
        .attr("class", "graphNode")
        .selectAll("g");

    function ticked() {
        link.attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });

        node.attr("transform", function(d) {
            return "translate(" + (d.x = Math.max(radius, Math.min(width - radius, d.x))) + "," 
                + (d.y = Math.max(radius, Math.min(height - radius, d.y))) + ")";
        })
    }

    function dragStarted(d) {
        if (!d3.event.active) 
            simulation.alphaTarget(0.3).restart();

        d.fx = d.x;
        d.fy = d.y;
    }
      
    function dragged(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    }
      
    function dragEnded(d) {
        if (!d3.event.active) 
            simulation.alphaTarget(0);

        d.fx = null;
        d.fy = null;
    }

    restart();

    function restart() {
        // Apply the general update pattern to the nodes.
        node = node.data(nodes_, function(d) { return d.name;});

        node.exit().remove();

        node = node.enter().append("g");
    
        node.append("circle")
            .attr("r", 7)
            .attr("fill", function(d) { 
                if (d.group == 0)
                {
                    return "#9b1a3c"; 
                }

                return "white";
            })
            .on("mouseover", showTooltip)
            .on("mouseleave", hideTooltip)
            .call(d3.drag()
                .on("start", dragStarted)
                .on("drag", dragged)
                .on("end", dragEnded));

        node.append("text")
            .text(function(d) {
                if (d.group == 0)
                    return d.name;

                return "";
            })
            .attr('x', 8)
            .attr('y', 3)
            .attr("pointer-events", "none");

        node = node.merge(node);
      
        // Apply the general update pattern to the links.
        link = link.data(links_, function(d) { return d.source.name + "-" + d.target.name; });
        link.exit().remove();
        link = link.enter().append("line").attr("stroke-width", 1).merge(link);
      
        // Update and restart the simulation.
        simulation.nodes(nodes_).on("tick", ticked);
        simulation.force("link").links(links_);
        simulation.alpha(1).restart();
      }
    
}