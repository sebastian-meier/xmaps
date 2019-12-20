"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var d3 = require("d3");
var L = require("leaflet");
var leafletSearch = require("leaflet-search");
var colorPicker_1 = require("./colorPicker");
var render_1 = require("./render");
colorPicker_1.colorPicker("color1");
colorPicker_1.colorPicker("color2");
colorPicker_1.colorPicker("color3");
colorPicker_1.colorPicker("color4");
/* ---.--- ADDING THE MAP ---.--- */
var cache = {};
var longitude = 13.308507;
var latitude = 52.466716;
var selectionMap = L.map("map").setView([latitude, longitude], 15);
L.tileLayer("https://stamen-tiles.a.ssl.fastly.net/toner/{z}/{x}/{y}.png", {
    attribution: "Map tiles by <a href=\"http://stamen.com\" class=\" cf--modified\">Stamen Design</a>, under <a href=\"http://creativecommons.org/licenses/by/3.0\" class=\" cf--modified\">CC BY 3.0</a>. Data by <a href=\"http://openstreetmap.org\" class=\" cf--modified\">OpenStreetMap</a>, under <a href=\"http://www.openstreetmap.org/copyright\" class=\" cf--modified\">ODbL</a>.",
}).setOpacity(0.4).addTo(selectionMap);
selectionMap.addControl(new leafletSearch({
    autoCollapse: true,
    autoType: false,
    jsonpParam: "json_callback",
    marker: false,
    minLength: 2,
    propertyLoc: ["lat", "lon"],
    propertyName: "display_name",
    url: "https://nominatim.openstreetmap.org/search?format=json&q={s}",
}));
var centerControl = L.control({
    centerControl: "topright",
});
centerControl.onAdd = function (map) {
    this._div = L.DomUtil.create("div", "centerMarker");
    this._div.innerHTML = "<img src=\"images/centerMarker.svg\" width=\"50\" height=\"50\" />";
    return this._div;
};
centerControl.addTo(selectionMap);
d3.select("#btn-render").on("click", function () {
    startRender(false);
});
d3.select("#btn-render-svg").on("click", function () {
    startRender(true);
});
var startRender = function (svgOnly) {
    d3.select("#overlay").style("display", "block");
    var latLng = selectionMap.getCenter();
    var mirrorValue = d3.select('input[name="mirror"]:checked').node().value;
    render_1.render(latLng.lat, latLng.lng, d3.select("#color1").property("value"), d3.select("#color2").property("value"), d3.select("#stroke-control").property("checked"), d3.select("#label-big").property("value"), d3.select("#label-small").property("value"), mirrorValue, (svgOnly || mirrorValue !== "1") ? true : false, d3.select("#color3").property("value"), d3.select("#color4").property("value")).then(function (visID) {
        var scrollPos = document.getElementById("container_" + visID)
            .getBoundingClientRect().top;
        window.scrollTo(0, scrollPos + window.pageYOffset);
        d3.select("#overlay").style("display", "none");
    }).catch(function (err) {
        throw err;
    });
};
//# sourceMappingURL=main.js.map