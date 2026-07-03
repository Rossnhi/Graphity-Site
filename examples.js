// ============================================================================
// EXAMPLES
//
// Each entry in `exampleConfigs` is one example block. Nothing about the
// examples is hardcoded in index.html — this file builds the DOM, wires up
// a Graphity instance, and renders a small editable code block for every
// entry. Sides alternate automatically (canvas/editor, then editor/canvas).
//
// Each example is split into two pieces of source:
//   - preamble: sets up the container, instantiates Graphity, and declares
//     any state the example needs. Shown read-only, for context.
//   - code: the gr.setup(...) and gr.draw(...) calls. Shown fully editable.
//     This is the single source of truth — it's rendered with Prism for
//     display AND executed to drive the canvas, so there's nothing to keep
//     in sync.
//
// When the editable block loses focus, the example's Graphity instance is
// torn down and rebuilt from scratch using the (possibly edited) code. If
// the edited code throws — a syntax error or a runtime error — the old
// canvas is left running untouched and an inline error message is shown.
// ============================================================================

const exampleConfigs = [
    {
        title: "Plot",
        size: [400, 400],
        preamble:
`const container = document.getElementById(containerId);
const width = container.clientWidth;
const height = container.clientHeight;

let gr = new Graphity({
    parent: containerId,
    canvasSize: [width, height],
    rangeX: [-width / height * 4, width / height * 4],
    rangeY: [-4, 4]
});
graphities.push(gr);

let scene = {
    plot: null,
    point: null
};`,
        code:
`gr.setup(() => {
    scene.plot = gr.addPlot((x) => Math.sin(4 * x));
    scene.plot.color = gr.sketch.color(235, 195, 52);
    scene.plot.animation.animate = true;
    scene.point = scene.plot.addPlotPoint(2);
    scene.point.p.color = gr.sketch.color(247, 139, 131);
});

gr.draw(() => {
    scene.plot.animation.then(() => {
        scene.point.slideTo(-1, 4);
    });
});`
    },
    {
        title: "Animate",
        size: [450, 350],
        preamble:
`const container = document.getElementById(containerId);
const width = container.clientWidth;
const height = container.clientHeight;

let gr = new Graphity({
    parent: containerId,
    canvasSize: [width, height],
    rangeX: [-width / height * 2.5, width / height * 2.5],
    rangeY: [-2, 3]
});
graphities.push(gr);

let scene = {
    plot: null
};`,
        code:
`gr.setup(() => {
    scene.plot = gr.addPlot((x) => {
        return ((Math.abs(x) ** (2 / 3)) + (((3.3 - (x ** 2)) ** 0.5) * Math.sin(scene.plot.data[0] * Math.PI * x)));
    });
    scene.plot.color = gr.sketch.color(235, 195, 52);
    scene.plot.animation.animate = true;
    scene.plot.data.push(50);
});

gr.draw(() => {
    scene.plot.data[0] += 0.01;
});`
    },
    {
        title: "Zoom and Pan",
        size: [600, 600],
        preamble:
`const container = document.getElementById(containerId);
const width = container.clientWidth;
const height = container.clientHeight;

let gr = new Graphity({
    parent: containerId,
    canvasSize: [width, height],
    rangeX: [-width / height * 5, width / height * 5],
    rangeY: [-5, 5]
});
graphities.push(gr);`,
        code:
`gr.setup(() => {
    gr.colorPalette = {
        background: gr.sketch.color(120, 150, 80),
        axis: 30,
        majorGridInterval: 40,
        grid: gr.sketch.color(20, 60, 40)
    };
    gr.gridAnimation.animate = true;
    let reimann = gr.addPlot((x) => {
        let sum = 0;
        for (let i = 1; i < 800; i++) {
            sum += Math.sin((i ** 2) * x) / (i ** 2);
        }
        return sum;
    });
    reimann.color = gr.sketch.color(255, 220, 80);
});

gr.draw(() => {
    gr.zoomToCenter(1, 4).then(() => {
        gr.panTo([3.1, 0]).then(() => {
            gr.zoomToCenter().then(() => {
                gr.zoomToCenter(-1, 10);
                gr.panTo([0, 0], 0.1);
            }, 5);
        });
    });
});`
    },
    {
        title: "Transform",
        size: [500, 300],
        preamble:
`const container = document.getElementById(containerId);
const width = container.clientWidth;
const height = container.clientHeight;

let gr = new Graphity({
    parent: containerId,
    canvasSize: [width, height],
    rangeX: [-width / height * 2, width / height * 2],
    rangeY: [-2, 2]
});
graphities.push(gr);

let gridPoints = [];`,
        code:
`gr.setup(() => {
    for (let i = -5; i <= 5; i += 0.125) {
        for (let j = -3; j <= 3; j += 0.1) {
            let pt = gr.addPoint([i, j]);
            pt.size = 1.5;
            if (i.round(5) == 1 && j.toFixed(5) == 0) {
                pt.style = "arrow";
                pt.color = gr.sketch.color(175, 235, 73);
            }
            if (i.toFixed(5) == 0 && j.round(5) == 1) {
                pt.style = "arrow";
                pt.color = gr.sketch.color(83, 201, 237);
            }
            gridPoints.push(pt);
        }
    }
    for (let i = 0; i < 7; i++) {
        let pt = gr.addPoint([-3 + i, 3 - i]);
        pt.size = 1.5;
        pt.style = "arrow";
        pt.color = gr.sketch.color(235, 52, 155);
        gridPoints.push(pt);
    }
});

gr.draw(() => {
    for (let pt of gridPoints) {
        pt.transform([[1, -1], [1, -1]], 0.2).then(() => {
            pt.transform([[-0.5, 0.5], [0.5, 0.5]]);
        }, 5);
    }
});`
    },
    {
        title: "Interact",
        size: [420, 420],
        preamble:
`const container = document.getElementById(containerId);
const width = container.clientWidth;
const height = container.clientHeight;

let gr = new Graphity({
    parent: containerId,
    canvasSize: [width, height],
    rangeX: [-width / height * 2, width / height * 2],
    rangeY: [-2, 2]
});
graphities.push(gr);`,
        code:
`gr.setup(() => {
    let thomae = gr.addPlot((x) => {
        if (Calculus.isRational(x)) {
            let frac = Calculus.fraction(x);
            return 1 / frac[1];
        } else {
            return 0;
        }
    });
    thomae.style = "dot";
    thomae.color = gr.sketch.color(235, 195, 52);
    thomae.analysisMode = true;

    let point = gr.addPoint([1, 1]);
    point.color = gr.sketch.color(35, 195, 255);
    point.style = "arrow";
    point.moveWithMouse = true;
});

gr.draw(() => {

});`
    }
];

// Live Graphity instance currently backing each example (by index), so we
// can tear it down cleanly before rebuilding.
const exampleInstances = [];

// ----------------------------------------------------------------------------
// Running / rebuilding an example
// ----------------------------------------------------------------------------

// Tears down the example's current Graphity instance (if any) and rebuilds
// it by executing preamble + code. Shows an inline error and leaves the old
// instance running if the code throws.
function runExample(index, code) {
    const cfg = exampleConfigs[index];
    const canvasId = `example-${index + 1}-canvas`;
    const errorEl = document.getElementById(`example-${index + 1}-error`);

    const showError = (err) => {
        if (!errorEl) return;
        errorEl.textContent = err.message || String(err);
        errorEl.classList.add("visible");
    };
    const clearError = () => {
        if (!errorEl) return;
        errorEl.textContent = "";
        errorEl.classList.remove("visible");
    };

    const source = `${cfg.preamble}\n${code}\nreturn gr;`;

    const gr = runGraphitySource(source, canvasId, (err) => {
        if (err) {
            showError(err);
            return;
        }
        clearError();
    });

    if (!gr) return; // synchronous throw — old instance left running

    // Swap in the new instance now that it built without a synchronous error.
    const old = exampleInstances[index];
    if (old && old !== gr) disposeGraphity(old);
    exampleInstances[index] = gr;
}

// ----------------------------------------------------------------------------
// Render — builds every example block from exampleConfigs, no hardcoded
// example markup in index.html.
// ----------------------------------------------------------------------------
function renderExamples() {
    const list = document.getElementById("examples-list");
    if (!list) return;

    loadPrism().then((Prism) => {
        exampleConfigs.forEach((cfg, i) => {
            const id = `example-${i + 1}`;

            const example = document.createElement("div");
            example.className = "example" + (i % 2 === 1 ? " reverse" : "");
            example.id = id;

            const header = document.createElement("div");
            header.className = "example-header";
            header.textContent = cfg.title || `Example ${i + 1}`;

            const canvasPane = document.createElement("div");
            canvasPane.className = "example-canvas";
            canvasPane.id = `${id}-canvas`;
            canvasPane.style.flex = "1 1 " + cfg.size[0] + "px";
            canvasPane.style.aspectRatio = cfg.size[0] / cfg.size[1];
            canvasPane.style.height = "auto";

            const editorPane = document.createElement("div");
            editorPane.className = "example-editor";
            editorPane.style.height = cfg.size[1] + "px";

            // Editable setup/draw. The preamble (container + Graphity
            // instantiation) still runs behind the scenes but is never
            // shown — only the part meant to be played with.
            const editLabel = document.createElement("div");
            editLabel.className = "code-editable-label";
            editLabel.textContent = "edit me";

            const editBlock = document.createElement("pre");
            editBlock.className = "code-block code-editable";
            const editCode = document.createElement("code");
            editCode.className = "language-javascript";
            editCode.contentEditable = "true";
            editCode.spellcheck = false;
            editCode.textContent = cfg.code;
            editBlock.appendChild(editCode);

            const errorBox = document.createElement("div");
            errorBox.className = "code-error";
            errorBox.id = `${id}-error`;

            editCode.addEventListener("blur", () => {
                const newCode = editCode.textContent;
                runExample(i, newCode);
                // Re-render highlighting on the (possibly edited) text.
                editCode.textContent = newCode;
                Prism.highlightElement(editCode);
            });

            // Keep tab from jumping focus out of the editor unexpectedly.
            editCode.addEventListener("keydown", (e) => {
                if (e.key === "Tab") {
                    e.preventDefault();
                    document.execCommand("insertText", false, "    ");
                }
            });

            editorPane.appendChild(editLabel);
            editorPane.appendChild(editBlock);
            editorPane.appendChild(errorBox);

            example.appendChild(header);
            example.appendChild(canvasPane);
            example.appendChild(editorPane);
            list.appendChild(example);

            // Run the actual Graphity setup for this example.
            runExample(i, cfg.code);
        });

        // Highlight every code block on the page — the examples built above
        // as well as any static snippets in Get Started / Documentation.
        Prism.highlightAll();
    });
}

renderExamples();
