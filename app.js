const MAPTILER_API_KEY = "jM8uyesHy2rG8yl6ICzy";

const map = new maplibregl.Map({
    container: "map",

    style: `https://api.maptiler.com/maps/streets-v4/style.json?key=${MAPTILER_API_KEY}`,

    center: [0, 20],

    zoom: 1.4,

    minZoom: 1
});