// ============================================================================
// SHARED RUNTIME
//
// Small utilities shared by examples.js, documentation.js, and playground.js:
// executing a string of Graphity source against a container, tearing down
// old instances cleanly, and lazy-loading Prism once for the whole page.
// ============================================================================

// Removes a Graphity instance's canvas and drops it from the shared
// `graphities` array (declared in hero.js) so it stops being drawn/observed.
function disposeGraphity(gr) {
    if (!gr) return;
    if (gr.sketch) gr.sketch.remove();
    const i = graphities.indexOf(gr);
    if (i > -1) graphities.splice(i, 1);
}

// Hooks pause/resume into the IntersectionObserver-driven visibility switch,
// same pattern as cleanup.js, so off-screen instances stop animating.
function wireLifecycle(gr) {
    gr.onVisibilityChange = (visible) => {
        if (visible) gr.resume();
        else gr.pause();
    };
}

// Executes `source` — a string of code that declares `let gr = new
// Graphity(...)` — against `containerId`. Catches synchronous throws (e.g.
// syntax errors) immediately, and briefly listens for asynchronous ones
// too, since p5 runs setup()/draw() on its own schedule rather than inline.
//
// Returns the new Graphity instance synchronously (or null if it threw
// synchronously). `onSettled(error)` fires ~60ms later once we know whether
// the async setup actually succeeded; `error` is null on success.
function runGraphitySource(source, containerId, onSettled) {
    let asyncCaught = null;
    const onWindowError = (event) => {
        asyncCaught = event.error || new Error(event.message);
        event.preventDefault();
    };
    window.addEventListener("error", onWindowError);

    try {
        const factory = new Function("containerId", source);
        const gr = factory(containerId);
        wireLifecycle(gr);

        setTimeout(() => {
            window.removeEventListener("error", onWindowError);
            if (onSettled) onSettled(asyncCaught, gr);
        }, 60);

        return gr;
    } catch (err) {
        window.removeEventListener("error", onWindowError);
        if (onSettled) onSettled(err, null);
        return null;
    }
}

// ----------------------------------------------------------------------------
// Prism loading — cached so every consumer shares one load.
// ----------------------------------------------------------------------------
const PRISM_VERSION = "1.29.0";
const PRISM_BASE = `https://cdnjs.cloudflare.com/ajax/libs/prism/${PRISM_VERSION}`;

let prismLoadPromise = null;

function loadPrism() {
    if (prismLoadPromise) return prismLoadPromise;

    prismLoadPromise = new Promise((resolve) => {
        const core = document.createElement("script");
        core.src = `${PRISM_BASE}/components/prism-core.min.js`;
        core.onload = () => {
            const lang = document.createElement("script");
            lang.src = `${PRISM_BASE}/components/prism-javascript.min.js`;
            lang.onload = () => resolve(window.Prism);
            document.head.appendChild(lang);
        };
        document.head.appendChild(core);
    });

    return prismLoadPromise;
}
