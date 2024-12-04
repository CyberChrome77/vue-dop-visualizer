<template>
  <div>
    <div id="mapid" style="height:563px; width:1000px"></div>
  </div>
</template>

<script>
import L from 'leaflet';
import 'leaflet-contour';
import "leaflet/dist/leaflet.css";

export default {
  data() {
    return {
      data: {
        x: [],
        y: [],
        z: []
      },
      latMin: -91.44,
      latMax: 91.44,
      lngMin: -181.44,
      lngMax: 181.44,
      interval: 0.72,
      // colors: [
      //   { color: "#0B873D", point: 0 },
      //   { color: "#70B829", point: 0.2 },
      //   { color: "#FFD208", point: 0.4 },
      //   { color: "#FFF73B", point: 0.6 },
      //   { color: "#FF7E14", point: 0.8 },
      //   { color: "#FF0801", point: 1 }
      // ]
      colors: [
        { color: "#00008f", point: 0.1 },
        { color: "#0000ef", point: 0.2},
        { color: "#005fff", point: 0.3},
        { color: "#00cfff", point: 0.4},
        { color: "#4fffaf", point: 0.5},
        { color: "#bfff3f", point: 0.6},
        { color: "#ffcf00", point: 0.7},
        { color: "#ff5f00", point: 0.8},
        { color: "#ef0000", point: 0.9},
        { color: "#7f0000", point: 0.10},

      ]
    };
  },
  async mounted() {
    await this.generateData();
    await this.updateZValues("/dop_output_2.txt");
    this.initializeMap();
  },
  methods: {
    async parseTextFile(filePath) {
      const response = await fetch(filePath);
      const text = await response.text();
      const rows = text.split("\n").filter((line) => line.trim() !== "");
      const parsedData = [];
      rows.forEach((row) => {
        const [lat, lng, gdop, pdop, hdop, vdop, tdop, numInView] = row.split(/\s+/);
        parsedData.push({
          latitude: parseFloat(lat),
          longitude: parseFloat(lng),
          gdop: parseFloat(gdop),
          pdop: parseFloat(pdop),
          hdop: parseFloat(hdop),
          vdop: parseFloat(vdop),
          tdop: parseFloat(tdop),
          numInView: parseFloat(numInView)
        });
      });
      return parsedData;
    },
    getIndices(lat, lng, latMax, lngMin, interval) {
      const i = Math.round((latMax - lat) / interval);
      const j = Math.round((lng - lngMin) / interval);
      return { i, j };
    },
    generateData() {
      const numRows = Math.floor((this.latMax - this.latMin) / this.interval) + 1;
      const numCols = Math.floor((this.lngMax - this.lngMin) / this.interval) + 1;

      for (let i = 0; i < numRows; i++) {
        const rowX = [];
        const rowY = [];
        const rowZ = [];

        const lat = this.latMax - i * this.interval;

        for (let j = 0; j < numCols; j++) {
          const lng = this.lngMin + j * this.interval;

          rowX.push(lng);
          rowY.push(lat);
          rowZ.push(null);

        }

        this.data.x.push(rowX);
        this.data.y.push(rowY);
        this.data.z.push(rowZ);
      }

      console.log(this.data);
    },
    async updateZValues(filePath) {
      const parsedData = await this.parseTextFile(filePath);
      parsedData.forEach(({ latitude, longitude, pdop }) => {
        const { i, j } = this.getIndices(latitude, longitude, this.latMax, this.lngMin, this.interval);
        if (i >= 0 && i < this.data.z.length && j >= 0 && j < this.data.z[i].length) {
          this.data.z[i][j] = pdop;
        }
      });

    },
    getColor(value, min, max, colors) {
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
    },
    initializeMap() {
      var map = L.map("mapid", {
        worldCopyJump: true,
        maxBounds: [
          [-90, -180],
          [90, 180]
        ],
        minZoom: 1,
        maxBoundsViscosity: 1,
      }).setView([0, 0], 2);

      L.tileLayer(
        "https://tiles.stadiamaps.com/tiles/stamen_toner_lite/{z}/{x}/{y}{r}.{ext}",
        {
          maxZoom: 18,
          ext: 'png',
          tileSize: 512,
          zoomOffset: -1,
        }
      ).addTo(map);


      fetch('/worldmap.json')
        .then(response => response.json())
        .then(data => {
          const geojsonLayer = L.geoJSON(data, {
            style: function () {
              return {
                color: "white",
                weight: 1,
                fillOpacity: 0,
                interactive: false
              };
            }
          });
          geojsonLayer.addTo(map);
        })

      L.contour(this.data, {
        thresholds: 10,
        style: (feature) => {
          return {
            color: this.getColor(feature.geometry.value, 1, 10, this.colors),
            opacity: 0,
            fillOpacity: 1,
          };
        },
        onEachFeature: this.onEachContour(),
      }).addTo(map);

      const legend = L.control({ position: 'bottomright' });

      legend.onAdd = function () {
        const div = L.DomUtil.create('div', 'info legend');
        const grades = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];  // Adjust as per threshold
        const colors = [
          "#FF0801", "#FF7E14", "#FFF73B", "#FFD208", "#70B829", "#0B873D"
        ];

        let gradient = 'linear-gradient(to top,';
        for (let i = colors.length - 1; i >= 0; i--) {
          gradient += ` ${colors[i]},`;
        }
        gradient = gradient.slice(0, -1) + ')';

        div.innerHTML = `
    <div style="background: ${gradient}; height: 150px; width: 20px; position: relative;">
      ${grades.map((value, i) => `<div style="position: absolute; bottom: ${(i / (grades.length - 1)) * 100}%; color: black; font-size: 10px; right: 25px;">${value}</div>`).join('')}
    </div>
  `;
        return div;
      };

      legend.addTo(map);

    },

    onEachContour() {
      return function onEachFeature(feature, layer) {
        layer.bindPopup(
          `<table>
              <tbody>
                <tr><td>PDOP: ${feature.value}</td></tr>
              </tbody>
            </table>`
        );
      };
    }
  }
};
</script>

<style>
#mapid {
  background-color: white;
}
</style>