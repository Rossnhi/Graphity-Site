const graphities = [];
let heroGr = new Graphity({
    parent: "hero-canvas-container",
    canvasSize: [document.body.clientWidth, window.innerHeight],
    rangeX: [- document.body.clientWidth / window.innerHeight * 4, document.body.clientWidth / window.innerHeight * 4],
    rangeY: [-4, 4]
})
graphities.push(heroGr)

let scene = {
    plot : null,
    point : null,
    pan2 : () => {
        heroGr.panTo([2, 1.077], 0.07).then(scene.pan0)
    },
    pan0 : () => {
        heroGr.panTo([0, 0], 0.07).then(scene.pan2)
    },
    slide1 : () => {
        scene.point.slideTo(1).then(scene.slide2)
    },
    slide2 : () => {
        scene.point.slideTo(2).then(scene.slide1)
    },
    zoomIn : () => {
        heroGr.zoomToCenter(0.25, 4).then(scene.zoomOut)
    },
    zoomOut : () => {
        heroGr.zoomToCenter(-0.25, 16).then(scene.zoomIn)
    }
}

heroGr.setup(() => {
    scene.plot = heroGr.addPlot((x) => {
        let sum = 0;
        for ( let i = 1; i < 800; i++) {
            sum += Math.sin((i ** 2) * x)/(i ** 2);
        }
        return sum;
    })
    scene.plot.color = heroGr.sketch.color(235, 195, 52);
    scene.point = scene.plot.addPlotPoint(2);
    scene.point.p.color =  heroGr.sketch.color(247, 139, 131);
});


heroGr.draw(() => {
    scene.zoomIn();
    scene.slide1();
    scene.pan2();
});
