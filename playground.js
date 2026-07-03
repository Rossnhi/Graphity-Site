// ============================================================================
// PLAYGROUND
//
// One big editable block of Graphity source next to a live canvas. Unlike
// the examples, nothing is hidden or split out — the whole instantiation,
// setup, and draw are yours to rewrite. Rebuilds on blur, or on demand via
// the Run button.
// ============================================================================

const PLAYGROUND_STARTER = `let gr = new Graphity({
    parent: "playground-canvas",
    canvasSize: [width, height],
    rangeX: [-width / height * 4, width / height * 4],
    rangeY: [-4, 4]
});

let scene = {
    plot: null,
    point: null
};

gr.setup(() => {
    scene.plot = gr.addPlot((x) => Math.sin(x));
    scene.plot.color = gr.sketch.color(235, 195, 52);
    scene.plot.animation.animate = true;
    scene.point = scene.plot.addPlotPoint(-3);
    scene.point.p.color = gr.sketch.color(247, 139, 131);
});

gr.draw(() => {
    scene.plot.animation.then(() => {
        scene.point.slideTo(3, 2).then(() => {
            scene.point.slideTo(-3, 2);
        }, 3);
    });
});`;

let playgroundInstance = null;

function runPlayground() {
    const codeEl = document.getElementById("playground-code");
    const errorEl = document.getElementById("playground-error");
    if (!codeEl) return;

    const code = codeEl.textContent;
    const canvasPane = document.getElementById("playground-canvas");
    const width = canvasPane ? canvasPane.clientWidth : 600;
    const height = canvasPane ? canvasPane.clientHeight : 600;

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

    // `width`/`height` are made available to the snippet so starter code
    // (and anything the user writes) can size itself off the actual canvas.
    const source = `const width = ${width};\nconst height = ${height};\n${code}\nreturn gr;`;

    const gr = runGraphitySource(source, "playground-canvas", (err) => {
        if (err) showError(err);
        else clearError();
    });

    if (!gr) return; // synchronous throw — old instance left running

    if (playgroundInstance && playgroundInstance !== gr) disposeGraphity(playgroundInstance);
    playgroundInstance = gr;
}

function renderPlayground() {
    const codeEl = document.getElementById("playground-code");
    const runBtn = document.getElementById("playground-run");
    if (!codeEl) return;

    codeEl.textContent = PLAYGROUND_STARTER;

    loadPrism().then((Prism) => {
        Prism.highlightElement(codeEl);

        codeEl.addEventListener("blur", () => {
            const code = codeEl.textContent;
            runPlayground();
            codeEl.textContent = code;
            Prism.highlightElement(codeEl);
        });

        codeEl.addEventListener("keydown", (e) => {
            if (e.key === "Tab") {
                e.preventDefault();
                document.execCommand("insertText", false, "    ");
            }
        });

        if (runBtn) {
            runBtn.addEventListener("click", () => {
                const code = codeEl.textContent;
                runPlayground();
                codeEl.textContent = code;
                Prism.highlightElement(codeEl);
            });
        }

        runPlayground();
    });
}

renderPlayground();
