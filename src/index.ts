import App from "./App";

let app: App;

$(function() {
    app = new App(window.innerWidth, window.innerHeight);
});

$(window).on("resize", function() {
    app.width = window.innerWidth;
    app.height = window.innerHeight;
});