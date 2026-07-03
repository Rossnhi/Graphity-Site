/**
 * Creates a new Graphity instance.
 * 
 * Sets up a Cartesian plane for creating interactive mathematical
 * visualizations with a viewport, animation state, rendering settings and drawable components.
 *
 * @param {Object} [options={}] Configuration options.
 * @param {HTMLElement|string} [options.parent=document.body] HTML element or element ID that will contain the Graphity canvas.
 * @param {number[]} [options.canvasSize=[600,600]] Canvas size in pixels [width, height].
 * @param {number[]} [options.rangeX=[-3,3]] Initial visible x-axis range.
 * @param {number[]} [options.rangeY=[-3,3]] Initial visible y-axis range.
 * @param {number} [options.scale=0.25] Grid spacing in mathematical units.
 * @param {Object} [options.grid] Grid display options.
 * @param {boolean} [options.grid.numbered=true] Display axis labels.
 * @param {string} [options.grid.style="gridlined"] Grid rendering style.
 * @param {Animation} [options.gridAnimation] Grid entrance animation.
 */
class Graphity {
    constructor({
        parent = document.body,
        canvasSize = [600, 600],
        rangeX = [-3, 3],
        rangeY = [-3, 3],
        scale = 0.25, // represents the distance between 2 gridlines
        grid = {
            numbered: true,
            style: "gridlined"
        },
        gridAnimation = new Animation(false, 0, 1 / 100)
    } = {}) {
        // canvas
        this.parent = parent;
        this.visible = false;
        this.onVisibilityChange = () => { }; // fires everytime visibily of the graphity changes

        // p5 sketch
        this.sketch;
        this._createSketch(...canvasSize);

        // Viewport
        this.rangeX = rangeX;
        this.rangeY = rangeY;
        this.rangeSpanX = rangeX[1] - rangeX[0];
        this.rangeSpanY = rangeY[1] - rangeY[0];
        this.unitX = canvasSize[0] / this.rangeSpanX;
        this.unitY = canvasSize[1] / this.rangeSpanY;
        this.originPx = [-this.rangeX[0] * this.unitX, this.rangeY[1] * this.unitY];
        this.center = [(this.rangeX[1] + this.rangeX[0]) / 2, (this.rangeY[1] + this.rangeY[0]) / 2];

        // Appearance
        this.scale = scale;
        this.grid = grid;
        this.gridAnimation = gridAnimation;
        this.colorPalette = {
            background: 30,
            axis: 255,
            grid: this.sketch.color(50, 120, 180),
            majorGridInterval: 255
        };
        this.majorGridInterval = 1;

        // Camera animations
        this.zoom = {
            sequencer: 0,
            animations: []
        };
        this.pan = {
            sequencer: 0,
            animations: []
        }

        // Scene objects
        this.components = {
            points: [],
            plots: []
        };
    }

    _createSketch(canvasWidth, canvasHeight) {
        // Resolve the parent element
        const container = typeof this.parent === 'string'
            ? document.getElementById(this.parent)
            : this.parent;

        const s = (sketch) => {
            sketch.preload = () => {
                sketch.loadJSON('data:application/json,{}');
            }; // defer setup call by p5
            sketch.setup = () => {
                const canvas = sketch.createCanvas(canvasWidth, canvasHeight);
                // Pass the resolved element to p5
                canvas.parent(container);
                canvas.elt.graphity = this;
                observer.observe(canvas.elt)
                this._draw();
            };
        };
        // The p5 constructor accepts the container as the second argument
        this.sketch = new p5(s, container);
    }

    _draw() {
        this._drawPlane();
        this.gridAnimation.then(() => {
            this._drawPoints();
            this._drawPlots();
        });
    }

    /**
     * Registers the function to be executed once every animation frame.
     *
     * Similar to p5.js' {@code draw()} function, but Graphity automatically
     * renders the Cartesian plane and all drawable objects before invoking
     * the user callback.
     *
     * @param {Function} callback Function executed every frame.
    */
    draw(callback) {
        this.sketch.draw = () => {
            this._draw();
            this.gridAnimation.then(callback)
        };
    }

    _setup() {
        this.mousePressed();
    }

    /**
     * Registers a function to be executed once after the p5.js sketch
     * has been initialized.
     *
     * Similar to p5.js' {@code setup()} function. The callback is invoked
     * after Graphity has created the canvas and initialized its internal
     * state.
     *
     * @param {Function} callback Function executed once during setup.
    */
    setup(callback) {
        var cachedFunc = this.sketch.setup;
        this.sketch.setup = () => {
            cachedFunc.apply();
            callback();
            this._setup();
        };
    }

    _mousePressed() {
        for (let point of this.components.points) {
            point._mousePressed();
        }
    }

    /**
     * Registers a callback that is invoked whenever the mouse is pressed
     * within the Graphity canvas.
     *
     * Graphity automatically processes interactions with all interactive
     * objects after the user callback has been executed.
     *
     * @param {Function} [callback] Function executed when the mouse is pressed.
    */
    mousePressed(callback = () => { }) {
        this.sketch.mousePressed = () => {
            callback();
            this._mousePressed();
        };
    }

    /**
     * Converts a pixel position on the canvas into Cartesian coordinates.
     *
     * @param {number} x Horizontal pixel coordinate.
     * @param {number} y Vertical pixel coordinate.
     * @returns {number[]} The corresponding Cartesian point [a, b].
     */
    pixelToPoint(x, y) {
        let a = (x / this.unitX) + this.rangeX[0];
        let b = this.rangeY[1] - (y / this.unitY);
        return [a, b];
    }

    /**
     * Converts a Cartesian point into pixel coordinates on the canvas.
     *
     * @param {number} a Cartesian x-coordinate.
     * @param {number} b Cartesian y-coordinate.
     * @returns {number[]} The corresponding pixel position [x, y].
     */
    pointToPixel(a, b) {
        let x = this.unitX * (a - this.rangeX[0]);
        let y = this.unitY * (this.rangeY[1] - b);
        return [x, y];
    }

    /**
     * Updates the visible range of the x-axis.
     *
     * This also updates all dependent viewport properties such as the
     * pixel-to-unit conversion, origin position, and graph center.
     *
     * @param {number[]} newRange The new x-axis range [min, max].
     */
    updateRangeX(newRange) {
        this.rangeX = newRange;
        this.unitX = this.sketch.width / (this.rangeX[1] - this.rangeX[0]);
        this.rangeSpanX = this.rangeX[1] - this.rangeX[0];
        this.originPx[0] = -this.rangeX[0] * this.unitX;
        this.center[0] = (this.rangeX[1] + this.rangeX[0]) / 2;
    }

    /**
     * Updates the visible range of the y-axis.
     *
     * This also updates all dependent viewport properties such as the
     * pixel-to-unit conversion, origin position, and graph center.
     *
     * @param {number[]} newRange The new y-axis range [min, max].
     */
    updateRangeY(newRange) {
        this.rangeY = newRange;
        this.unitY = this.sketch.height / (this.rangeY[1] - this.rangeY[0]);
        this.rangeSpanY = this.rangeY[1] - this.rangeY[0];
        this.center[1] = (this.rangeY[1] + this.rangeY[0]) / 2;
        this.originPx[1] = this.rangeY[1] * this.unitY;
    }

    /**
     * Updates the spacing between adjacent grid lines.
     *
     * @param {number} newScale Distance between adjacent grid lines in
     * Cartesian units.
     */
    updateScale(newScale) {
        this.scale = newScale
    }

    /**
     * Animates the graph by zooming about the current center of the view.
     *
     * The animation continues until the specified target scale or target
     * range has been reached.
     *
     * @param {number} [speed=1] Positive to zoom in, negative to zoom out.
     * @param {number} [targetScale=1] Target zoom level relative to the grid scale - will zoom till the viewport displays a graph that ranges to targetScale * scale in all directions from center 
     * @param {?number[]} [targetRange=null] Optional target x-axis range used
     * to terminate the animation.
     * @returns {Animation} Animation object representing this zoom operation.
     */
    zoomToCenter(speed = 1, targetScale = 1, targetRange = null) {
        if (typeof this.zoom.animations[this.zoom.sequencer] == "undefined") {
            this.zoom.animations[this.zoom.sequencer] = new Animation();
        }
        if (this.zoom.animations[this.zoom.sequencer].animate != false) {
            if ((!targetRange || (targetRange[0] * Math.sign(speed) > this.rangeX[0] * Math.sign(speed))) && this.scale * Math.sign(speed) < (this.rangeX[1] - this.rangeX[0]) / (2 * targetScale) * Math.sign(speed)) {
                this.zoom.animations[this.zoom.sequencer].animate = true;
                this.updateRangeX([this.rangeX[0] + (.002 * this.rangeSpanX * speed), this.rangeX[1] - (.002 * this.rangeSpanX * speed)]);
                this.updateRangeY([this.rangeY[0] + (.002 * this.rangeSpanY * speed), this.rangeY[1] - (.002 * this.rangeSpanY * speed)]);
            }
            else {
                this.zoom.animations[this.zoom.sequencer].animate = false;
            }
        }
        this.zoom.sequencer++;
        return this.zoom.animations[this.zoom.sequencer - 1];
    }

    /**
     * Animates the graph by moving its center toward the specified point.
     *
     * @param {number[]} point Target center of the graph.
     * @param {number} [speed=0.5] Speed of the panning animation.
     * @returns {Animation} Animation object representing this pan operation.
     */
    panTo(point, speed = 0.5) {
        if (typeof this.pan.animations[this.pan.sequencer] == "undefined") {
            this.pan.animations[this.pan.sequencer] = new Animation();
        }
        if (this.pan.animations[this.pan.sequencer].animate != false) {
            let v = new Vector(point);
            if (!v.isEqual(new Vector(this.center))) {
                this.pan.animations[this.pan.sequencer].animate = true;
                let cen = new Vector(this.center);

                let vel = v.subtract(cen).unit().mult(0.1 * speed);
                if (Vector.length(v, cen) < vel.mag) {
                    vel.resizeTo(Vector.length(v, cen));
                }
                this.updateRangeX([this.rangeX[0] + vel.x, this.rangeX[1] + vel.x]);
                this.updateRangeY([this.rangeY[0] + vel.y, this.rangeY[1] + vel.y]);
            }
            else {
                this.pan.animations[this.pan.sequencer].animate = false;
            }
        }
        this.pan.sequencer++;
        return this.pan.animations[this.pan.sequencer - 1];
    }

    _resetAnimationSequencer() {
        this.zoom.sequencer = 0;
        this.pan.sequencer = 0;
    }

    _drawPlane() {
        this._resetAnimationSequencer();
        this.sketch.background(this.colorPalette.background);

        if (this.gridAnimation.animate) {
            if (this.gridAnimation.val < 1) {
                this.gridAnimation.val += this.gridAnimation.inc;
            }
            else {
                this.gridAnimation.animate = false;
            }
        }
        else {
            this.gridAnimation.val = 1;
        }

        for (let i = parseInt(this.rangeX[0] / this.scale) * this.scale; i <= this.rangeX[1]; i += this.scale) {
            this.sketch.strokeWeight(0.5);
            this.sketch.stroke(this.colorPalette.grid);

            if ((i / this.majorGridInterval).round(5) % 1 == 0 && i.toFixed() != 0) {
                this.sketch.strokeWeight(1);
            }
            if (this.grid.style == "gridlined") {
                this.sketch.line(this.pointToPixel(i, 0)[0], this.sketch.height - (this.gridAnimation.val * this.sketch.height), this.pointToPixel(i, 0)[0], this.sketch.height);
            }
            else {
                this.sketch.line(this.pointToPixel(i, 0)[0], this.originPx[1] - 5, this.pointToPixel(i, 0)[0], this.originPx[1] + 5);
            }

            if (i.toFixed(10) == 0) {
                this.sketch.strokeWeight(1);
                this.sketch.stroke(this.colorPalette.axis);
                this.sketch.line(this.pointToPixel(i, 0)[0], this.sketch.height - (this.gridAnimation.val * this.sketch.height), this.pointToPixel(i, 0)[0], this.sketch.height);
            }

            if ((i / this.majorGridInterval).round(5) % 1 == 0 || i.toFixed(10) == 0) {
                this.sketch.textSize(17);
                this.sketch.fill(this.colorPalette.majorGridInterval);
                this.sketch.noStroke();
                this.sketch.textAlign(this.sketch.CENTER, this.sketch.TOP);
                if (i.toFixed(10) == 0) {
                    this.sketch.textAlign(this.sketch.RIGHT, this.sketch.TOP);
                    if (this.grid.numbered) {
                        if (i <= this.rangeX[0] + (this.gridAnimation.val * this.rangeSpanX)) {
                            this.sketch.text(0, this.pointToPixel(i, 0)[0] - 10, this.originPx[1] + 10);
                        }
                    }
                    continue;
                }
                if (this.grid.numbered) {
                    if (i <= this.rangeX[0] + (this.gridAnimation.val * this.rangeSpanX)) {
                        this.sketch.text(i.round(3), this.pointToPixel(i, 0)[0], this.originPx[1] + 10);
                    }
                }
            }
        }

        for (let j = parseInt(this.rangeY[1] / this.scale) * this.scale; j >= this.rangeY[0]; j -= this.scale) {
            this.sketch.strokeWeight(0.5);
            this.sketch.stroke(this.colorPalette.grid);
            if (j.toFixed(10) == 0) {
                this.sketch.strokeWeight(1);
                this.sketch.stroke(this.colorPalette.axis);
            }
            if ((j / this.majorGridInterval).round(5) % 1 == 0 && j.toFixed(10) != 0) {
                this.sketch.strokeWeight(1);
            }

            if (this.grid.style == "gridlined") {
                this.sketch.line(0, this.pointToPixel(0, j)[1], this.sketch.width * this.gridAnimation.val, this.pointToPixel(0, j)[1]);

            }
            else {
                this.sketch.line(this.originPx[0] - 5, this.pointToPixel(0, j)[1], this.originPx[0] + 5, this.pointToPixel(0, j)[1]);

            }

            if ((j / this.majorGridInterval).round(5) % 1 == 0 && j.toFixed(10) != 0) {
                this.sketch.textSize(17);
                this.sketch.fill(this.colorPalette.majorGridInterval);
                this.sketch.noStroke();
                this.sketch.textAlign(this.sketch.RIGHT, this.sketch.CENTER);
                if (this.grid.numbered) {
                    if (j <= this.rangeY[0] + (this.gridAnimation.val * this.rangeSpanY)) {
                        this.sketch.text(j.round(3), this.originPx[0] - 10, this.pointToPixel(0, j)[1]);
                    }
                }
            }
        }
    }

    /**
     * Creates a new point and adds it to the graph.
     *
     * @param {number[]} point Cartesian coordinates of the point [x, y].
     * @returns {Point} The newly created point.
     */
    addPoint(pt) {
        let point = new Point(pt, this);
        this.components.points.push(point);
        return point;
    }

    _drawPoints() {
        for (let point of this.components.points) {
            point.draw();
        }
    }

    /**
     * Creates a function plot and adds it to the graph.
     *
     * @param {Function} func Function describing the plot.
     * @returns {Plot} The newly created plot.
     */
    addPlot(func) {
        let plot = new Plot(func, this);
        this.components.plots.push(plot);
        return plot;
    }

    /**
     * Creates a parametric plot and adds it to the graph.
     *
     * @param {number[]} range Parameter range [min, max].
     * @param {Function} func Function mapping the parameter to Cartesian
     * coordinates.
     * @returns {ParametricPlot} The newly created parametric plot.
     */
    addParametricPlot(range, func) {
        let plot = new ParametricPlot(range, func, this);
        this.components.plots.push(plot);
        return plot;
    }

    _drawPlots() {
        for (let plot of this.components.plots) {
            plot.draw();
            plot.animation.then(() => {
                for (let plotPoint of plot.plotPoints) {
                    plotPoint.p.draw();
                }
            });
        }
    }

    pause() {
        if (this.sketch) this.sketch.noLoop();
    }

    resume() {
        if (this.sketch) this.sketch.loop();
    }
}

class Vector {
    constructor(v) {
        this.x = v[0];
        this.y = v[1];
        this.mag = Math.sqrt(this.dotProduct(this));
    }

    static createVector(a = 0) {
        return new Vector([a, a]);
    }

    index(i) {
        switch (i) {
            case 0:
                return this.x;
            case 1:
                return this.y;
        }
    }

    insert(i, val) {
        switch (i) {
            case 0:
                this.x = val;
            case 1:
                this.y = val;
        }

        return this;
    }

    isEqual(v) {
        return (this.x == v.x && this.y == v.y);
    }

    isZero() {
        return (this.mag == 0);
    }

    clone() {
        return new Vector([this.x, this.y]);
    }

    add(v) {
        return new Vector([v.x + this.x, v.y + this.y]);
    }

    addScalar(a) {
        return new Vector([a + this.x, a + this.y]); // this.add(Vector.createVector(a));
    }

    subtract(v) {
        return new Vector([this.x - v.x, this.y - v.y]);
    }

    // scalar multiplication
    mult(a) {
        return new Vector([a * this.x, a * this.y]);
    }

    scale(a) {
        Object.assign(this, this.mult(a));
        return this;
    }

    resizeTo(a) {
        Object.assign(this, this.unit().mult(a));
        return this;
    }

    dotProduct(v) {
        let dot = (this.x * v.x) + (this.y * v.y);
        return dot;
    }

    unit() {
        if (this.mag == 0) {
            return this;
        }
        return this.mult(1 / this.mag);
    }

    isNormal(v) {
        return (this.dotProduct(v) == 0);
    }

    normal(dir = 1) {
        return new Vector([-this.y * dir, this.x * dir]);
    }

    rotate(t) {
        t = t * Math.PI / 180;
        let rot = new Matrix([new Vector([Math.cos(t), -Math.sin(t)]), new Vector([Math.sin(t), Math.cos(t)])]);
        return rot.vectorMult(this).mult(1 / this.mag);
    }

    static length(v1, v2 = new Vector([0, 0])) {
        let len = Math.sqrt((v1.x - v2.x) ** 2 + (v1.y - v2.y) ** 2);
        return len;
    }

}

class Matrix {
    constructor(matrix) {
        this.matrix = matrix;
    }

    det() {
        return ((this.matrix[0].index(0) * this.matrix[1].index(1)) - (this.matrix[1].index(0) * this.matrix[0].index(1)));
    }

    adj() {
        return new Matrix([new Vector([this.matrix[1].index(1), -this.matrix[0].index(1)]), new Vector([-this.matrix[1].index(0), this.matrix[0].index(0)])]);
    }

    inv() {
        if (this.det() != 0) {
            return this.adj().scalarMult(1 / this.det());
        }
    }

    transpose() {
        return new Matrix([new Vector([this.matrix[0].index(0), this.matrix[1].index(0)]), new Vector([this.matrix[0].index(1), this.matrix[1].index(1)])]);
    }

    add(m) {
        let res = new Matrix([]);
        for (let i = 0; i < 2; i++) {
            res.matrix.push(new Vector([0, 0]));
            for (let j = 0; j < 2; j++) {
                res.matrix[i].insert(j, this.matrix[i].index(j) + m.matrix[i].index(j));
            }
        }
        return res;
    }

    scalarMult(a) {
        let res = new Matrix([]);
        for (let i = 0; i < 2; i++) {
            res.matrix.push(new Vector([0, 0]));
            for (let j = 0; j < 2; j++) {
                res.matrix[i].insert(j, this.matrix[i].index(j) * a);
            }
        }
        return res;
    }

    subtract(m) {
        return this.add(m.scalarMult(-1));
    }

    matMult(m) {
        let res = new Matrix([new Vector([0, 0]), new Vector([0, 0])]);
        for (let i = 0; i < 2; i++) {
            for (let j = 0; j < 2; j++) {
                let dot = this.matrix[i].dotProduct(new Vector([m.matrix[0].index(j), m.matrix[1].index(j)]));
                res.matrix[i].insert(j, dot);
            }
        }
        return res;
    }

    vectorMult(v) {
        let res = new Vector([0, 0]);
        for (let i = 0; i < 2; i++) {
            let dot = this.matrix[i].dotProduct(v);
            res.insert(i, dot);
        }
        return res;
    }
}

Number.prototype.round = function (places) {
    return +(Math.round(this + "e+" + places) + "e-" + places);
}

class Animation {
    constructor(animate = null, val = 0, inc = 0, wait = 0) {
        this.animate = animate;
        this.val = val;
        this.inc = inc;
        this.data = [];
        this.wait = wait;
    }

    // a.then(b) will execute b sequentially after a is done animating. b starts after a.
    then(f, s = 0) {
        if (!this.animate) {
            if (this.wait > s * 55) {
                f();
            }
        }
        this.wait++;
    }

    // a.tillThen(b) will execute b while a is animating and will continue only till a is done animating. b stops as soon as a stops
    tillThen(f) {
        if (this.animate) {
            f();
        }
    }
}

class Point {
    constructor(p, cart, size = 7, color = null, style = "dot", dropPerpendiculars = false) {
        this.point = new Vector(p);
        this.c = cart; // object of class cartesian
        this.pointPx = this.c.pointToPixel(this.point.x, this.point.y);
        this.size = size;
        this.color = color == null ? this.c.sketch.color(235, 195, 52) : color;
        this.style = style;
        this.dropPerpendiculars = style == "dot" ? dropPerpendiculars : false;
        this.moveWithMouse = false;
        this.move = false;
        this.transforms = {
            sequencer: 0,
            animations: []
        };
    }

    _moveWithMouse() {
        if (this.move && this.moveWithMouse) {
            this.update([this.c.pixelToPoint(this.c.sketch.mouseX, this.c.sketch.mouseY)[0], this.c.pixelToPoint(this.c.sketch.mouseX, this.c.sketch.mouseY)[1]]);
        }
    }

    update(p) {
        this.point = new Vector(p);
        this.pointPx = this.c.pointToPixel(this.point.x, this.point.y);
    }

    modify() {
        this._moveWithMouse();
    }

    draw() {
        this.modify();

        this.transforms.sequencer = 0;

        this.pointPx = this.c.pointToPixel(this.point.x, this.point.y);

        if (this.style == "dot") {
            this.c.sketch.noStroke();
            this.c.sketch.fill(this.color);
            this.c.sketch.ellipse(this.pointPx[0], this.pointPx[1], this.size, this.size);

            if (this.dropPerpendiculars) {
                this.c.sketch.stroke(this.color);
                this.c.sketch.strokeWeight(1.5);
                this.c.sketch.line(this.pointPx[0], this.pointPx[1], this.pointPx[0], this.c.originPx[1]);
                this.c.sketch.line(this.pointPx[0], this.pointPx[1], this.c.originPx[0], this.pointPx[1]);
            }
        }
        else {
            this.c.sketch.stroke(this.color);
            this.c.sketch.strokeWeight(1.5);
            this.c.sketch.line(this.c.originPx[0], this.c.originPx[1], this.pointPx[0], this.pointPx[1]);

            let arrow1 = this.point.mult(-1).rotate(30).unit().mult(10 / this.c.unitX).add(this.point);
            this.c.sketch.line(this.pointPx[0], this.pointPx[1], this.c.pointToPixel(arrow1.x, arrow1.y)[0], this.c.pointToPixel(arrow1.x, arrow1.y)[1]);

            let arrow2 = this.point.mult(-1).rotate(-30).unit().mult(10 / this.c.unitX).add(this.point);
            this.c.sketch.line(this.pointPx[0], this.pointPx[1], this.c.pointToPixel(arrow2.x, arrow2.y)[0], this.c.pointToPixel(arrow2.x, arrow2.y)[1]);
        }
    }

    _mousePressed() {
        if ((this.pointPx[0] < this.c.sketch.mouseX + 5 && this.pointPx[0] > this.c.sketch.mouseX - 5) && (this.pointPx[1] < this.c.sketch.mouseY + 5 && this.pointPx[1] > this.c.sketch.mouseY - 5)) {
            this.move = !this.move;
        }
    }

    transform(transformation, speed = 1) {
        let transMat = new Matrix([new Vector([transformation[0][0], transformation[1][0]]), new Vector([transformation[0][1], transformation[1][1]])]);
        if (typeof this.transforms.animations[this.transforms.sequencer] == "undefined") {
            this.transforms.animations[this.transforms.sequencer] = new Animation(null, 0, 0.01 * speed);
            this.transforms.animations[this.transforms.sequencer].data.push(this.point);
        }

        if (this.transforms.animations[this.transforms.sequencer].animate != false) {
            if (this.transforms.animations[this.transforms.sequencer].val < 1) {
                this.transforms.animations[this.transforms.sequencer].animate = true;
                this.transforms.animations[this.transforms.sequencer].val += this.transforms.animations[this.transforms.sequencer].inc;
                this.point = this.transforms.animations[this.transforms.sequencer].data[0].mult(1 - this.transforms.animations[this.transforms.sequencer].val).add(transMat.vectorMult(this.transforms.animations[this.transforms.sequencer].data[0]).mult(this.transforms.animations[this.transforms.sequencer].val));
            }
            else {
                this.transforms.animations[this.transforms.sequencer].animate = false
                this.transforms.animations[this.transforms.sequencer].val = 1;
                this.point = this.transforms.animations[this.transforms.sequencer].data[0].mult(1 - this.transforms.animations[this.transforms.sequencer].val).add(transMat.vectorMult(this.transforms.animations[this.transforms.sequencer].data[0]).mult(this.transforms.animations[this.transforms.sequencer].val));
            }
        }

        this.transforms.sequencer++;
        return this.transforms.animations[this.transforms.sequencer - 1];
    }

}

class Plot {
    constructor(func, cart, color = null, step = 1000, style = "line") {
        this.func = func;
        this.c = cart;
        this.color = color == null ? this.c.sketch.color(69, 205, 255) : color;
        this.plotPoints = [];
        this.step = step;
        this.style = style;
        this.animation = new Animation(false, this.c.rangeX[0], this.c.rangeSpanX / 50);
        this.analysisMode = false; // make true to plot function of rationals and irrationals
        this.data = [];
    }

    draw() {
        if (this.animation.animate) {
            if (this.animation.val < this.c.rangeX[1]) {
                this.animation.val += this.animation.inc;
            }
            else {
                this.animation.animate = false;
            }
        }
        else {
            this.animation.val = this.c.rangeX[1];
        }

        for (let plotPoint of this.plotPoints) {
            plotPoint.slides.sequencer = 0;
        }

        let ratSpan = this.c.rangeSpanX / this.step;
        let irratSpan = this.c.rangeSpanX / (this.step + 7) * Math.sqrt(2);
        let rational = true;
        let prevX = this.c.rangeX[0];
        for (let x = this.c.rangeX[0]; x <= this.animation.val; x) {
            this.c.sketch.strokeWeight(1.1);
            this.c.sketch.stroke(this.color);
            if (this.style == "line") {
                this.c.sketch.line(this.c.pointToPixel(prevX, this.func(prevX))[0], this.c.pointToPixel(prevX, this.func(prevX))[1], this.c.pointToPixel(x, this.func(x))[0], this.c.pointToPixel(x, this.func(x))[1]);
            }
            else {
                this.c.sketch.ellipse(this.c.pointToPixel(x, this.func(x))[0], this.c.pointToPixel(x, this.func(x))[1], 1, 1);
            }
            prevX = x;

            if (rational) {
                x = (x + ratSpan).round(5);
            }
            else {
                x += irratSpan;
            }
            rational = !rational;
        }

        let span = this.c.scale / 30;
        prevX = this.c.rangeX[0];

        if (this.analysisMode) {
            for (let x = parseInt(this.c.rangeX[0]) - 1; x <= this.c.rangeX[1]; x += span) {
                this.c.sketch.strokeWeight(1.1);
                this.c.sketch.stroke(this.color);
                this.c.sketch.ellipse(this.c.pointToPixel(x, this.func(x))[0], this.c.pointToPixel(x, this.func(x))[1], 1, 1);
                prevX = x;
            }
        }

    }

    addPlotPoint(x) {
        let p = new PlotPoint(new Point([x, this.func(x)], this.c), this.func);
        p.p.dropPerpendiculars = true;
        this.plotPoints.push(p);
        return p;
    }
}

class PlotPoint {
    constructor(p, func) {
        this.p = p;
        this.func = func;
        this.slides = {
            sequencer: 0,
            animations: []
        };
    }

    slideTo(x, speed = 1) {
        if (typeof this.slides.animations[this.slides.sequencer] == "undefined") {
            this.slides.animations[this.slides.sequencer] = new Animation();
        }
        if (this.slides.animations[this.slides.sequencer].animate != false) {
            if (Math.abs(x - this.p.point.x) > 0.0005 * speed * this.p.c.rangeSpanX) {
                this.slides.animations[this.slides.sequencer].animate = true;
                if (x > this.p.point.x) {
                    let newX = this.p.point.x + 0.0005 * speed * this.p.c.rangeSpanX;
                    this.p.update([newX, this.func(newX)]);
                }
                else {
                    let newX = this.p.point.x - 0.0005 * speed * this.p.c.rangeSpanX;
                    this.p.update([newX, this.func(newX)]);
                }
            }
            else {
                // this.p.update([x, this.func(x)]);
                this.slides.animations[this.slides.sequencer].animate = false
            }
        }
        this.slides.sequencer++;
        return this.slides.animations[this.slides.sequencer - 1];
    }

    style(s) {
        this.p.style = s;
    }
}

class Calculus {
    static continuedFraction(n, cutoff = 10) {
        let res = [];
        let cf = Math.abs(n);
        while ((cf - parseInt(cf)).round(12) > 0) {
            res.push(parseInt(cf));
            cf = (cf - parseInt(cf)).round(12);
            cf = 1 / cf.round(12);

            if (res.length == cutoff) {
                break;
            }
        }
        res.push(parseInt(cf));

        if (n < 0 && res.length > 1) {
            res[0] = -res[0] - 1;
            res[1] -= 1;
            res.splice(1, 0, 1);
        }

        return res;
    }

    static fraction(n) {
        let cf = Calculus.continuedFraction(n);
        let frac = Calculus.CFtoFraction(cf);
        return frac;
    }

    static CFtoFraction(cf) {
        let res = [0, 1];
        for (let i = cf.length - 1; i >= 0; i--) {
            res[0] = (res[1] * cf[i]) + res[0];
            if (i != 0) {
                res = [res[1], res[0]];
            }
        }
        return res;
    }


    static isRational(n) {
        let CF = Calculus.continuedFraction(n);
        if (CF.length >= 10) {
            return false;
        }
        return true;
    }
}

class ParametricPlot {
    constructor(paraRange, func, cart, color = null, step = 1000, style = "line") {
        this.paraRange = paraRange;
        this.func = func;
        this.c = cart;
        this.color = color == null ? this.c.sketch.color(69, 205, 255) : color;
        this.plotPoints = [];
        this.step = step;
        this.style = style;
        this.animation = new Animation(false, this.paraRange[0], (this.paraRange[1] - this.paraRange[0]) / 200);
        this.data = [];
    }

    draw() {
        if (this.animation.animate) {
            if (this.animation.val < this.paraRange[1]) {
                this.animation.val += this.animation.inc;
            }
            else {
                this.animation.animate = false;
            }
        }
        else {
            this.animation.val = this.paraRange[1];
        }

        for (let plotPoint of this.plotPoints) {
            plotPoint.slides.sequencer = 0;
        }

        let span = (this.paraRange[1] - this.paraRange[0]) / this.step;
        let prevT = this.paraRange[0];
        for (let t = this.paraRange[0]; t <= this.animation.val; t += span) {
            this.c.sketch.strokeWeight(1.1);
            this.c.sketch.stroke(this.color);
            if (this.style == "line") {
                this.c.sketch.line(this.c.pointToPixel(this.func(prevT)[0], this.func(prevT)[1])[0], this.c.pointToPixel(this.func(prevT)[0], this.func(prevT)[1])[1], this.c.pointToPixel(this.func(t)[0], this.func(t)[1])[0], this.c.pointToPixel(this.func(t)[0], this.func(t)[1])[1]);
            }
            else {
                this.c.sketch.ellipse(this.c.pointToPixel(this.func(t)[0], this.func(t)[1])[0], this.c.pointToPixel(this.func(t)[0], this.func(t)[1])[1], 1, 1);
            }
            prevT = t;
        }
    }

}

// utility - for optimization
const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
        entry.target.graphity.visible = entry.isIntersecting;
        entry.target.graphity.onVisibilityChange(entry.target.graphity.visible);
    }
});