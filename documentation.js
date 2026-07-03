// ============================================================================
// DOCUMENTATION
//
// A left-hand list of API entries, grouped by class. Selecting one shows
// its signature, a short description, and a small *live* Graphity canvas
// demonstrating it — in the spirit of the p5.js reference page.
// ============================================================================

const DOC_DEMO_SIZE = [260, 260];

const docGroups = [
    {
        name: "Graphity",
        entries: [
            {
                id: "constructor",
                signature: "new Graphity(options)",
                description: "Creates a Cartesian plane inside options.parent. Key options: canvasSize [w, h], rangeX / rangeY for the initial visible range, and scale for grid spacing.",
                code:
`let gr = new Graphity({
    parent: containerId,
    canvasSize: [260, 260],
    rangeX: [-3, 3],
    rangeY: [-3, 3]
});

gr.setup(() => {
    let plot = gr.addPlot((x) => x ** 2);
    plot.color = gr.sketch.color(235, 195, 52);
});

gr.draw(() => {});`
            },
            {
                id: "setup",
                signature: "gr.setup(callback)",
                description: "Runs once, right after the canvas is ready. This is where scene objects — plots and points — get created.",
                code:
`let gr = new Graphity({
    parent: containerId,
    canvasSize: [260, 260],
    rangeX: [-3, 3],
    rangeY: [-3, 3]
});

let point;

gr.setup(() => {
    // runs once
    point = gr.addPoint([1, 1]);
    point.style = "arrow";
    point.color = gr.sketch.color(83, 201, 237);
});

gr.draw(() => {});`
            },
            {
                id: "draw",
                signature: "gr.draw(callback)",
                description: "Runs every animation frame, after Graphity has redrawn the plane and everything on it. Drive animation and per-frame logic from here.",
                code:
`let gr = new Graphity({
    parent: containerId,
    canvasSize: [260, 260],
    rangeX: [-3, 3],
    rangeY: [-3, 3]
});

let angle = 0;
let point;

gr.setup(() => {
    point = gr.addPoint([1, 0]);
    point.style = "arrow";
    point.color = gr.sketch.color(247, 139, 131);
});

gr.draw(() => {
    // runs every frame
    angle += 0.02;
    point.update([Math.cos(angle) * 2, Math.sin(angle) * 2]);
});`
            },
            {
                id: "addPlot",
                signature: "gr.addPlot(func) → Plot",
                description: "Plots a function of x. Set .color, .style (\"line\" or \"dot\"), or turn on .animation.animate to have the plot draw itself in over time.",
                code:
`let gr = new Graphity({
    parent: containerId,
    canvasSize: [260, 260],
    rangeX: [-4, 4],
    rangeY: [-2, 2]
});

gr.setup(() => {
    let plot = gr.addPlot((x) => Math.sin(x));
    plot.color = gr.sketch.color(235, 195, 52);
    plot.animation.animate = true;
});

gr.draw(() => {});`
            },
            {
                id: "addParametricPlot",
                signature: "gr.addParametricPlot(range, func) → ParametricPlot",
                description: "Plots a curve traced by func(t) returning [x, y], for t across range. Good for anything that isn't a function of x, like circles or spirals.",
                code:
`let gr = new Graphity({
    parent: containerId,
    canvasSize: [260, 260],
    rangeX: [-2, 2],
    rangeY: [-2, 2]
});

gr.setup(() => {
    let circle = gr.addParametricPlot([0, Math.PI * 2], (t) => {
        return [Math.cos(t), Math.sin(t)];
    });
    circle.color = gr.sketch.color(83, 201, 237);
    circle.animation.animate = true;
});

gr.draw(() => {});`
            },
            {
                id: "addPoint",
                signature: "gr.addPoint(point) → Point",
                description: "Places a point at Cartesian coordinates [x, y]. Set .style (\"dot\" or \"arrow\"), .color, or .dropPerpendiculars to project it onto both axes.",
                code:
`let gr = new Graphity({
    parent: containerId,
    canvasSize: [260, 260],
    rangeX: [-3, 3],
    rangeY: [-3, 3]
});

gr.setup(() => {
    let point = gr.addPoint([1, 1]);
    point.dropPerpendiculars = true;
    point.color = gr.sketch.color(235, 195, 52);
});

gr.draw(() => {});`
            },
            {
                id: "zoomToCenter",
                signature: "gr.zoomToCenter(speed, targetScale) → Animation",
                description: "Animates zoom about the current center. Positive speed zooms in, negative zooms out, until the viewport reaches targetScale. Returns a chainable Animation.",
                code:
`let gr = new Graphity({
    parent: containerId,
    canvasSize: [260, 260],
    rangeX: [-4, 4],
    rangeY: [-4, 4]
});

let scene = {};

gr.setup(() => {
    let plot = gr.addPlot((x) => Math.sin(2 * x));
    plot.color = gr.sketch.color(235, 195, 52);
    scene.zoomIn = () => gr.zoomToCenter(0.3, 4).then(scene.zoomOut);
    scene.zoomOut = () => gr.zoomToCenter(-0.3, 16).then(scene.zoomIn);
});

gr.draw(() => {
    scene.zoomIn();
});`
            },
            {
                id: "panTo",
                signature: "gr.panTo(point, speed) → Animation",
                description: "Animates the view's center toward [x, y]. Also returns a chainable Animation.",
                code:
`let gr = new Graphity({
    parent: containerId,
    canvasSize: [260, 260],
    rangeX: [-4, 4],
    rangeY: [-4, 4]
});

let scene = {};

gr.setup(() => {
    let plot = gr.addPlot((x) => x ** 2 - 2);
    plot.color = gr.sketch.color(83, 201, 237);
    scene.panRight = () => gr.panTo([1.5, 0], 0.15).then(scene.panLeft);
    scene.panLeft = () => gr.panTo([-1.5, 0], 0.15).then(scene.panRight);
});

gr.draw(() => {
    scene.panRight();
});`
            }
        ]
    },
    {
        name: "Point",
        entries: [
            {
                id: "transform",
                signature: "point.transform(matrix, speed) → Animation",
                description: "Animates the point through a 2×2 linear transformation, given as [[a, b], [c, d]]. Chain transforms with .then() to build multi-step sequences.",
                code:
`let gr = new Graphity({
    parent: containerId,
    canvasSize: [260, 260],
    rangeX: [-2, 2],
    rangeY: [-2, 2]
});

let point;

gr.setup(() => {
    point = gr.addPoint([1, 1]);
    point.style = "arrow";
    point.color = gr.sketch.color(175, 235, 73);
});

gr.draw(() => {
    point.transform([[1, -1], [1, -1]], 0.2).then(() => {
        point.transform([[-0.5, 0.5], [0.5, 0.5]]);
    }, 5);
});`
            },
            {
                id: "moveWithMouse",
                signature: "point.moveWithMouse",
                description: "When true, clicking the point toggles drag mode — it follows the mouse until clicked again. Works well paired with style = \"arrow\" for vectors you can pull around.",
                code:
`let gr = new Graphity({
    parent: containerId,
    canvasSize: [260, 260],
    rangeX: [-2, 2],
    rangeY: [-2, 2]
});

gr.setup(() => {
    let point = gr.addPoint([1, 1]);
    point.style = "arrow";
    point.color = gr.sketch.color(35, 195, 255);
    point.moveWithMouse = true; // click it, then drag
});

gr.draw(() => {});`
            },
            {
                id: "slideTo",
                signature: "plotPoint.slideTo(x, speed) → Animation",
                description: "For points created with plot.addPlotPoint(x) — animates the point along the curve to a new x. Chainable the same way as transform.",
                code:
`let gr = new Graphity({
    parent: containerId,
    canvasSize: [260, 260],
    rangeX: [-3, 3],
    rangeY: [-2, 4]
});

let scene = {};

gr.setup(() => {
    scene.plot = gr.addPlot((x) => x ** 2);
    scene.plot.color = gr.sketch.color(235, 195, 52);
    scene.point = scene.plot.addPlotPoint(-1.5);
    scene.point.p.color = gr.sketch.color(247, 139, 131);
    scene.slideRight = () => scene.point.slideTo(1.5).then(scene.slideLeft);
    scene.slideLeft = () => scene.point.slideTo(-1.5).then(scene.slideRight);
});

gr.draw(() => {
    scene.slideRight();
});`
            }
        ]
    },
    {
        name: "Animation",
        entries: [
            {
                id: "then",
                signature: "animation.then(callback, delay)",
                description: "Runs callback once the animation finishes. delay is an optional number of extra beats to wait first — handy for sequencing several animations one after another.",
                code:
`let gr = new Graphity({
    parent: containerId,
    canvasSize: [260, 260],
    rangeX: [-4, 4],
    rangeY: [-4, 4]
});

let scene = {};

gr.setup(() => {
    scene.panRight = () => gr.panTo([2, 0], 0.2).then(scene.panLeft);
    scene.panLeft = () => gr.panTo([-2, 0], 0.2).then(() => {
        gr.zoomToCenter(0.5, 2).then(scene.panRight, 3);
    });
});

gr.draw(() => {
    scene.panRight();
});`
            },
            {
                id: "tillThen",
                signature: "animation.tillThen(callback)",
                description: "The inverse of .then() — runs callback every frame while the animation is still in progress, and stops as soon as it finishes.",
                code:
`let gr = new Graphity({
    parent: containerId,
    canvasSize: [260, 260],
    rangeX: [-2, 2],
    rangeY: [-2, 2]
});

let point;

gr.setup(() => {
    point = gr.addPoint([1, 1]);
    point.style = "arrow";
    point.color = gr.sketch.color(235, 195, 52);
});

gr.draw(() => {
    let anim = point.transform([[0, -1], [1, 0]], 0.5); // quarter turn

    // fires every frame while the transform is still animating —
    // color eases from gold to blue as anim.val climbs from 0 to 1
    anim.tillThen(() => {
        point.color = gr.sketch.lerpColor(
            gr.sketch.color(235, 195, 52),
            gr.sketch.color(35, 195, 255),
            anim.val
        );
    });

    // fires exactly once, the moment the transform finishes
    anim.then(() => {
        point.color = gr.sketch.color(247, 139, 131);
    });
});`
            }
        ]
    }
];

// Flat list for easy indexing, built once.
const docEntries = docGroups.flatMap((g) => g.entries.map((e) => ({ ...e, group: g.name })));

let docInstance = null;
let docActiveId = docEntries.length ? docEntries[0].id : null;

function renderDocumentation() {
    const sidebar = document.getElementById("doc-sidebar");
    const content = document.getElementById("doc-content");
    if (!sidebar || !content) return;

    loadPrism().then((Prism) => {
        // Build the sidebar once.
        docGroups.forEach((group) => {
            const groupTitle = document.createElement("div");
            groupTitle.className = "doc-sidebar-group-title";
            groupTitle.textContent = group.name;
            sidebar.appendChild(groupTitle);

            group.entries.forEach((entry) => {
                const item = document.createElement("button");
                item.className = "doc-sidebar-item";
                item.id = `doc-nav-${entry.id}`;
                item.textContent = entry.signature.split("(")[0].split(" → ")[0];
                item.addEventListener("click", () => selectDocEntry(entry.id, Prism));
                sidebar.appendChild(item);
            });
        });

        selectDocEntry(docActiveId, Prism);
    });
}

function selectDocEntry(id, Prism) {
    const entry = docEntries.find((e) => e.id === id);
    if (!entry) return;
    docActiveId = id;

    // Sidebar active state.
    docEntries.forEach((e) => {
        const el = document.getElementById(`doc-nav-${e.id}`);
        if (el) el.classList.toggle("active", e.id === id);
    });

    const content = document.getElementById("doc-content");
    content.innerHTML = "";

    const signature = document.createElement("div");
    signature.className = "doc-entry-signature";
    signature.textContent = entry.signature;

    const description = document.createElement("p");
    description.textContent = entry.description;

    const demoRow = document.createElement("div");
    demoRow.className = "doc-demo";

    const codePane = document.createElement("div");
    codePane.className = "snippet doc-demo-code";
    const pre = document.createElement("pre");
    const code = document.createElement("code");
    code.className = "language-javascript";
    code.textContent = entry.code;
    pre.appendChild(code);
    codePane.appendChild(pre);

    const canvasPane = document.createElement("div");
    canvasPane.className = "doc-demo-canvas";
    canvasPane.id = "doc-canvas";
    canvasPane.style.width = DOC_DEMO_SIZE[0] + "px";
    canvasPane.style.height = DOC_DEMO_SIZE[1] + "px";

    demoRow.appendChild(codePane);
    demoRow.appendChild(canvasPane);

    content.appendChild(signature);
    content.appendChild(description);
    content.appendChild(demoRow);

    Prism.highlightElement(code);

    const gr = runGraphitySource(entry.code + "\nreturn gr;", "doc-canvas");
    if (docInstance) disposeGraphity(docInstance);
    docInstance = gr;
}

renderDocumentation();
