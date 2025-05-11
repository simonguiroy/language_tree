const svg = d3.select("svg");
const width = window.innerWidth;
const height = 1000;

// Add zoom and pan support
const zoom = d3.zoom().on("zoom", (event) => {
    g.attr("transform", event.transform);
});

const g = svg.append("g")
    .attr("transform", `translate(100, ${height / 2})`);  // initial transform

svg.call(zoom)
   .call(zoom.transform, d3.zoomIdentity.translate(100, height / 2));  // also tell zoom behavior

const treeLayout = d3.tree().nodeSize([12, 180]); // tighter spacing

d3.json("glottolog_named_tree_rich.json").then(data => {
    console.log("Loaded root object:", data);  // Optional debug

    let i = 0; // node ID counter — must be here!

    //const root = d3.hierarchy(data);
    const root = d3.hierarchy({
        name: "virtual-root",
        children: data.children
    });

    root.x0 = height / 2;
    root.y0 = 0;

    // Safely collapse all children initially
    if (root.children) {
        root.children.forEach(collapse);
    }

    update(root);

    function collapse(d) {
        if (d.children) {
            d._children = d.children;
            d._children.forEach(collapse);
            d.children = null;
        }
    }

    function expandAll(d) {
        if (d._children) {
            d.children = d._children;
            d._children = null;
        }
        if (d.children) {
            d.children.forEach(expandAll);
        }
    }

    function collapseAll(d) {
        if (d.children) {
            d.children.forEach(collapseAll);
            d._children = d.children;
            d.children = null;
        }
    }

    function update(source) {
        const treeData = treeLayout(root);
        const nodes = treeData.descendants();
        //const links = treeData.links();
        const links = treeData.links().filter(l => l.source.depth > 0);

        nodes.forEach(d => d.y = d.depth * 180);

        // ===== NODES =====
        const node = g.selectAll("g.node")
            .data(nodes, d => d.id || (d.id = ++i));

        const nodeEnter = node.enter().append("g")
            .filter(d => d.depth > 0) // hide virtual root
            .attr("class", "node")
            .attr("transform", d => `translate(${source.y},${source.x})`)
            /* // disabling clicking on gray dot to expand/collapse node
            .on("click", (event, d) => {
                // Left click: toggle
                if (d.children) {
                    d._children = d.children;
                    d.children = null;
                } else {
                    d.children = d._children;
                    d._children = null;
                }
                update(d);
            })
            .on("contextmenu", (event, d) => {
                event.preventDefault(); // prevent browser menu
                const hasVisibleChildren = d.children && d.children.length > 0;
                if (hasVisibleChildren) {
                    collapseAll(d);  // If already expanded — collapse
                } else {
                    expandAll(d);    // If collapsed — expand all
                }
                update(d);
            })
            */
            ;
        // Gray dots for collapsed nodes (currently unused):
        /*
        nodeEnter.filter(d => d._children && d._children.length > 0)
            .append("circle")
            .attr("r", 2.5)
            .attr("fill", "#555");
        */

        nodeEnter.append("text")
            .attr("dy", 3)
            .attr("x", d => d.children || d._children ? -6 : 6)
            .attr("text-anchor", d => d.children || d._children ? "end" : "start")
            .text(d => d.data.name)
            .on("click", (event, d) => {
                // Left click on text toggles node
                if (d.children) {
                    d._children = d.children;
                    d.children = null;
                } else {
                    d.children = d._children;
                    d._children = null;
                }
                // Update coordinate display
                /*
                if (!d.children && !d._children) {
                    const lat = d.data.latitude;
                    const lon = d.data.longitude;

                    const latText = lat != null ? lat : "--";
                    const lonText = lon != null ? lon : "--";

                    document.getElementById("lat").textContent = latText;
                    document.getElementById("lon").textContent = lonText;

                    // Remove any previous dot
                    mapSvg.selectAll(".lang-dot").remove();

                    if (lat != null && lon != null) {
                        const [x, y] = projection([lon, lat]);
                        mapSvg.append("circle")
                            .attr("class", "lang-dot")
                            .attr("cx", x)
                            .attr("cy", y)
                            .attr("r", 4)
                            .attr("fill", "red")
                            .attr("stroke", "#fff")
                            .attr("stroke-width", 1);
                    }
                }
                */
                if (d.data.latitude != null && d.data.longitude != null) {
                    const lat = d.data.latitude;
                    const lon = d.data.longitude;

                    document.getElementById("lat").textContent = lat;
                    document.getElementById("lon").textContent = lon;

                    mapSvg.selectAll(".lang-dot").remove();

                    const [x, y] = projection([lon, lat]);
                    mapSvg.append("circle")
                        .attr("class", "lang-dot")
                        .attr("cx", x)
                        .attr("cy", y)
                        .attr("r", 4)
                        .attr("fill", "red")
                        .attr("stroke", "#fff")
                        .attr("stroke-width", 1);
                } else {
                    document.getElementById("lat").textContent = "--";
                    document.getElementById("lon").textContent = "--";
                    mapSvg.selectAll(".lang-dot").remove();
                }
                update(d);
            })
            .on("contextmenu", (event, d) => {
                event.preventDefault(); // prevent browser menu
                const hasVisibleChildren = d.children && d.children.length > 0;
                if (hasVisibleChildren) {
                    collapseAll(d);  // If already expanded — collapse
                } else {
                    expandAll(d);    // If collapsed — expand all
                }
                update(d);
            })
            ;

        // Add highlight behind text for leaf nodes
        nodeEnter.filter(d => !d.children && !d._children)
            .each(function (d) {
                const g = d3.select(this);
                const text = g.select("text");

                const bbox = text.node().getBBox();

                const isLanguage = d.data.level === "language"; // else: "dialect"
                const fillColor = isLanguage ? "#000" : "#ddd";
                const textColor = isLanguage ? "#fff" : "#000";

                g.insert("rect", "text")
                    .attr("x", bbox.x - 2)
                    .attr("y", bbox.y - 1)
                    .attr("width", bbox.width + 4)
                    .attr("height", bbox.height + 2)
                    .attr("fill", fillColor)
                    .attr("rx", 2)
                    .attr("ry", 2);

                text.attr("fill", textColor);  // set text color
            });

        const nodeUpdate = nodeEnter.merge(node);

        nodeUpdate.transition().duration(300)
            .attr("transform", d => `translate(${d.y},${d.x})`);

        // EXIT nodes
        const nodeExit = node.exit().transition().duration(300)
            .attr("transform", d => `translate(${source.y},${source.x})`)
            .remove();

        nodeExit.select("circle").attr("r", 0);
        nodeExit.select("text").style("fill-opacity", 0);

        // ===== LINKS =====
        const link = g.selectAll("path.link")
            .data(links, d => d.target.id);

        const linkEnter = link.enter().insert("path", "g")
            .attr("class", "link")
            .attr("d", d => {
                const o = { x: source.x, y: source.y };
                return d3.linkHorizontal()
                    .x(d => d.y)
                    .y(d => d.x)({ source: o, target: o }); // <-- this line is crucial
            });

        linkEnter.merge(link).transition().duration(300)
            .attr("d", d3.linkHorizontal()
                .x(d => d.y)
                .y(d => d.x));

        // EXIT links
        link.exit().transition().duration(300)
            .attr("d", d => {
                const o = { x: source.x, y: source.y };
                return d3.linkHorizontal().x(() => o.y).y(() => o.x);
            })
            .remove();

        // Store positions
        nodes.forEach(d => {
            d.x0 = d.x;
            d.y0 = d.y;
        });
    
    console.log("Links:", links);
    }

    const mapSvg = d3.select("#mini-map");
    const mapWidth = +mapSvg.attr("width");
    const mapHeight = +mapSvg.attr("height");

    const projection = d3.geoMercator()
        .scale(mapWidth / (2 * Math.PI)) // auto-scale for Mercator's unit sphere
        .translate([mapWidth / 2, mapHeight / 1.5]); // center visually

    // === WORLD MAP (BOTTOM RIGHT CORNER) ===
    // source geojson file : https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson
    d3.json("world.geojson").then(world => {

        const path = d3.geoPath().projection(projection);

        mapSvg.append("g")
            .selectAll("path")
            .data(world.features)
            .enter()
            .append("path")
            .attr("d", path)
            .attr("fill", "#ccc")
            .attr("stroke", "#999")
            .attr("stroke-width", 0.5);
    });
});
