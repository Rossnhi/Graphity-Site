for (let graphity of graphities) {
    graphity.onVisibilityChange = (visible) => {
        if (graphity.visible) {
            graphity.resume()
        }
        else {
            graphity.pause()
        }
    }
}