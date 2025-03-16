<template>
    <div class="map-container">
        <div id="mapid"></div>
    </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick, defineProps } from 'vue';
import L from 'leaflet';
import 'leaflet-contour';
import 'leaflet/dist/leaflet.css';

const props = defineProps(['selectedDate']);

const map = ref(null);

const latMin = -91.44, latMax = 91.44;
const lngMin = -181.44, lngMax = 181.44;
const interval = 0.72;

const colors = ref([
    { color: "#00008f", point: 0 },
    { color: "#0000ef", point: 0.11111111111 },
    { color: "#005fff", point: 0.22222222222 },
    { color: "#00cfff", point: 0.33333333333 },
    { color: "#4fffaf", point: 0.44444444444 },
    { color: "#bfff3f", point: 0.55555555556 },
    { color: "#ffcf00", point: 0.66666666667 },
    { color: "#ff5f00", point: 0.77777777778 },
    { color: "#ef0000", point: 0.88888888889 },
    { color: "#7f0000", point: 1.0 },
]);

const data = ref({
    x: [], y: [], z: []
});

const getIndices = (lat, lng, latMax, lngMin, interval) => {
    const i = Math.round((latMax - lat) / interval);
    const j = Math.round((lng - lngMin) / interval);
    return { i, j };
};

const generateData = () => {
    const numRows = Math.floor((latMax - latMin) / interval) + 1;
    const numCols = Math.floor((lngMax - lngMin) / interval) + 1;

    for (let i = 0; i < numRows; i++) {
        const rowX = [];
        const rowY = [];
        const rowZ = [];

        const lat = latMax - i * interval;

        for (let j = 0; j < numCols; j++) {
            const lng = lngMin + j * interval;

            rowX.push(lng);
            rowY.push(lat);
            rowZ.push(null);

        }
        data.value.x.push(rowX);
        data.value.y.push(rowY);
        data.value.z.push(rowZ);
    }
};

function getColor(value, min, max, colors) {
    function hex(c) {
        var s = "0123456789abcdef";
        var i = parseInt(c, 10);
        if (i === 0 || isNaN(c)) return "00";
        i = Math.round(Math.min(Math.max(0, i), 255));
        return s.charAt((i - (i % 16)) / 16) + s.charAt(i % 16);
    }
    function trim(s) {
        return s.charAt(0) === "#" ? s.substring(1, 7) : s;
    }
    function convertToRGB(hex) {
        var color = [];
        color[0] = parseInt(trim(hex).substring(0, 2), 16);
        color[1] = parseInt(trim(hex).substring(2, 4), 16);
        color[2] = parseInt(trim(hex).substring(4, 6), 16);
        return color;
    }
    function convertToHex(rgb) {
        return hex(rgb[0]) + hex(rgb[1]) + hex(rgb[2]);
    }

    if (value === null || isNaN(value)) {
        return "#ffffff";
    }
    if (value > max) {
        return colors[colors.length - 1].color;
    }
    if (value < min) {
        return colors[0].color;
    }
    var loc = (value - min) / (max - min);
    if (loc < 0 || loc > 1) {
        return "#fff";
    } else {
        var index = 0;
        for (var i = 0; i < colors.length - 1; i++) {
            if (loc >= colors[i].point && loc <= colors[i + 1].point) {
                index = i;
            }
        }
        var color1 = convertToRGB(colors[index].color);
        var color2 = convertToRGB(colors[index + 1].color);

        var f =
            (loc - colors[index].point) /
            (colors[index + 1].point - colors[index].point);
        var rgb = [
            color1[0] + (color2[0] - color1[0]) * f,
            color1[1] + (color2[1] - color1[1]) * f,
            color1[2] + (color2[2] - color1[2]) * f,
        ];

        return `#${convertToHex(rgb)}`;
    }
}

const initializeMap = () => {
    console.log(data.value);
    map.value = L.map("mapid", {
        worldCopyJump: true,
        maxBounds: [[-90, -180], [90, 205]],
        minZoom: 1,
        maxBoundsViscosity: 1,
        preferCanvas: true,
        inertia: false
    }).setView([0, 0], 1);

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png}", {
        maxZoom: 5,
        ext: "png",
        tileSize: 512,
        zoomOffset: -1
    }).addTo(map.value);

    fetch("/worldmap.json")
        .then(response => response.json())
        .then(data => {
            const geojsonLayer = L.geoJSON(data, {
                style: () => ({
                    color: "white",
                    weight: 1,
                    fillOpacity: 0,
                    interactive: false
                })
            });
            geojsonLayer.addTo(map.value);
        });

    L.contour(data.value, {
        thresholds: 10,
        style: (feature) => {
            return {
                color: getColor(feature.geometry.value, 1, 10, colors.value),
                opacity: 0,
                fillOpacity: 1
            };
        },
        onEachFeature: onEachContour(),
    }).addTo(map.value);


    function onEachContour() {
        return function (feature, layer) {
            // let roundedDOP = Math.round(feature.value);
            layer.bindPopup(`<table><tbody><tr><td>PDOP: ${feature.value}</td></tr></tbody></table>`);
        };
    }

    const legend = L.control({ position: "bottomright" });

    legend.onAdd = function () {
        const div = L.DomUtil.create("div", "info legend");
        const grades = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        const colors = ["#7f0000", "#ef0000", "#ff5f00", "#ffcf00", "#bfff3f", "#4fffaf", "#00cfff", "#005fff", "#0000ef", "#00008f"];

        let gradient = "linear-gradient(to top,";
        for (let i = colors.length - 1; i >= 0; i--) {
            gradient += ` ${colors[i]},`;
        }
        gradient = gradient.slice(0, -1) + ")";

        div.innerHTML = `
          <div style="background: ${gradient}; height: 460px; width: 20px; position: relative;">
            ${grades.map((value, i) => `<div style="position: absolute; bottom: ${(i / (grades.length - 1)) * 100}%; color: white; font-size: 10px; right: 25px;">${value}</div>`).join("")}
          </div>
        `;
        return div;
    };

    legend.addTo(map.value);
};

const restartMap = () => {
    if (map.value) {
        map.value.stop();
        // map.value.eachLayer(layer => map.value.removeLayer(layer));
        // map.value.off();
        map.value.remove();
        map.value = null;
    }

    nextTick(() => {
        if (!map.value) {
            initializeMap();
        }
    });
};


const fetchDataFromFastAPI = async () => {
    try {
        const response = await fetch("http://localhost:8000/data/dop");
        const jsonResponse = await response.json();
        const dopData = jsonResponse.results;

        data.value.z.forEach(row => row.fill(null));

        dopData.forEach(({ time, Latitude, Longitude, PDOP }) => {
            const lat = parseFloat(Latitude);
            const lng = parseFloat(Longitude);
            const pdop = parseFloat(PDOP);

            const timestamp = new Date(time);
            const selectedDate = new Date(props.selectedDate);

            const timeDiff = Math.abs(timestamp - selectedDate);
            const threshold = 60 * 60 * 1000; //1 hour

            if (timeDiff <= threshold) {
                const { i, j } = getIndices(lat, lng, latMax, lngMin, interval);

                if (i >= 0 && i < data.value.z.length && j >= 0 && j < data.value.z[i].length) {
                    data.value.z[i][j] = Math.floor(pdop);
                }

            }
        });

    } catch (error) {
        console.error("Error fetching data from FastAPI:", error);
    }
};

const generateDOP = async (selectedDate) => {
    try {
        const formattedDate = new Date(selectedDate).toISOString().split('.')[0] + "Z";
        console.log(`Generating DOP data for ${formattedDate}`);
        await fetch(`http://localhost:8000/generate-dop?date=${formattedDate}`);
    } catch (error) {
        console.error("Error generating DOP data:", error);
    }
};

onMounted(async () => {
    generateData();
    await generateDOP(props.selectedDate);
    await fetchDataFromFastAPI();
    nextTick(() => {
        initializeMap();
    });
});

watch(() => props.selectedDate, async (newDate) => {
    await generateDOP(newDate);
    await fetchDataFromFastAPI();
    restartMap();
    console.log("Refreshed map for: ", newDate)
});
</script>

<style>
.map-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
}

#mapid {
    width: 90vw;
    height: 80vh;
    max-width: 1200px;
    max-height: 800px;
    border: 5px solid gray;
    background-color: black;
    margin: 10px auto;
    padding: 10px
}
</style>