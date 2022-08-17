/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/App.ts":
/*!********************!*\
  !*** ./src/App.ts ***!
  \********************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const SimulationWorld_1 = __webpack_require__(/*! ./SimulationWorld */ "./src/SimulationWorld.ts");
const UserInput_1 = __webpack_require__(/*! ./UserInput */ "./src/UserInput.ts");
class App {
    constructor(width, height) {
        this.lastFrameTimestamp = Date.now();
        this.canvas = document.createElement("canvas");
        this.ctx = this.canvas.getContext("2d");
        this.inputDriver = new UserInput_1.InputDriver(this);
        this.width = width;
        this.height = height;
        document.body.appendChild(this.canvas);
        this.setup();
    }
    setup() {
        this.simulationWorld = new SimulationWorld_1.SimulationWorld(this);
        this.raf();
    }
    loop() {
        this.ctx.clearRect(0, 0, this._width, this._height);
        this.simulationWorld.step();
    }
    raf() {
        window.requestAnimationFrame(this.raf.bind(this));
        this.inputDriver.step();
        this.loop();
        this.lastFrameTimestamp = Date.now();
    }
    get width() {
        return this._width;
    }
    get height() {
        return this._height;
    }
    set width(width) {
        this._width = width;
        this.canvas.width = width;
    }
    set height(height) {
        this._height = height;
        this.canvas.height = height;
    }
    get deltaTime() {
        return 1 / (Date.now() - this.lastFrameTimestamp);
    }
}
exports["default"] = App;


/***/ }),

/***/ "./src/Physics.ts":
/*!************************!*\
  !*** ./src/Physics.ts ***!
  \************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Physics = void 0;
const util_1 = __webpack_require__(/*! ./util */ "./src/util.ts");
var Physics;
(function (Physics) {
    Physics.GRAVITATIONAL_CONSTANT = 6.67 * Math.pow(10, -11);
    function gravitationalForceBetween(body1, body2) {
        return new util_1.Force(body1.position.toForce(body2.position).radians, (-Physics.GRAVITATIONAL_CONSTANT * body2.mass * body1.mass) / body1.position.distanceTo(body2.position));
    }
    Physics.gravitationalForceBetween = gravitationalForceBetween;
})(Physics = exports.Physics || (exports.Physics = {}));


/***/ }),

/***/ "./src/PhysicsBody.ts":
/*!****************************!*\
  !*** ./src/PhysicsBody.ts ***!
  \****************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const Physics_1 = __webpack_require__(/*! ./Physics */ "./src/Physics.ts");
const TrailComponent_1 = __webpack_require__(/*! ./TrailComponent */ "./src/TrailComponent.ts");
const util_1 = __webpack_require__(/*! ./util */ "./src/util.ts");
class PhysicsBody {
    constructor(app, mass, position, density) {
        this.id = PhysicsBody.id++;
        this.mass = mass;
        this.position = position;
        this.density = density;
        this.app = app;
        this.velocity = new util_1.Force(0, 0);
        this.trail = new TrailComponent_1.TrailComponent(this);
    }
    step() {
        const resultingForce = this.velocity.clone();
        for (let i = 0; i < this.app.simulationWorld.bodies.length; i++) {
            const body = this.app.simulationWorld.bodies[i];
            if (body.id == this.id)
                continue;
            if (body.position.distanceTo(this.position) < (this.visualRadius * 0.75)) {
                if (this.mass >= body.mass) {
                    const index = this.app.simulationWorld.bodies.findIndex(b => b.id == body.id);
                    const slowdownPercentage = body.mass / this.mass;
                    resultingForce.magnitude *= 1 - slowdownPercentage;
                    this.app.simulationWorld.bodies.splice(index, 1);
                    this.mass += body.mass;
                }
            }
            else {
                const gravitationalForce = Physics_1.Physics.gravitationalForceBetween(this, body);
                gravitationalForce.magnitude /= this.mass;
                gravitationalForce.magnitude *= this.app.deltaTime;
                resultingForce.add(gravitationalForce);
            }
        }
        this.velocity = resultingForce;
        this.position.add(this.velocity.toVector());
        this.trail.step();
        this.render();
    }
    render() {
        this.renderedMass = util_1.LerpUtils.lerp(this.renderedMass || this.mass, this.mass, 0.1);
        this.app.ctx.beginPath();
        this.app.ctx.fillStyle = "white";
        this.app.ctx.arc(this.position.x, this.position.y, this.visualRadius, 0, Math.PI * 2);
        this.app.ctx.fill();
        this.app.ctx.closePath();
        this.trail.render();
    }
    get visualRadius() {
        return this.renderedMass * this.density / 2;
    }
}
exports["default"] = PhysicsBody;
PhysicsBody.id = 0;


/***/ }),

/***/ "./src/SimulationWorld.ts":
/*!********************************!*\
  !*** ./src/SimulationWorld.ts ***!
  \********************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SimulationWorld = exports.DEFAULT_DENSITY = exports.DEFAULT_MASS = void 0;
const PhysicsBody_1 = __importDefault(__webpack_require__(/*! ./PhysicsBody */ "./src/PhysicsBody.ts"));
const util_1 = __webpack_require__(/*! ./util */ "./src/util.ts");
exports.DEFAULT_MASS = 100000000000;
exports.DEFAULT_DENSITY = 0.0000000001;
class SimulationWorld {
    constructor(app) {
        this.dragState = false;
        this.dragStart = util_1.Vector2.ORIGIN;
        this.app = app;
        this.bodies = [];
    }
    step() {
        if (this.app.inputDriver.mouseDown) {
            if (this.dragState) {
                const differenceVector = util_1.Vector2.difference(this.dragStart, this.app.inputDriver.mousePos);
                const dragEndDifference = util_1.Vector2.dot(differenceVector, new util_1.Vector2(-1, -1));
                const dragEnd = util_1.Vector2.add(this.dragStart, dragEndDifference);
                this.app.ctx.beginPath();
                this.app.ctx.strokeStyle = "#aaaaaa";
                this.app.ctx.moveTo(this.dragStart.x, this.dragStart.y);
                this.app.ctx.lineTo(dragEnd.x, dragEnd.y);
                this.app.ctx.lineWidth = 2;
                this.app.ctx.stroke();
                this.app.ctx.closePath();
            }
            else {
                this.dragState = true;
                this.dragStart = this.app.inputDriver.mousePos.clone();
            }
            this.app.ctx.beginPath();
            this.app.ctx.fillStyle = "white";
            this.app.ctx.arc(this.dragStart.x, this.dragStart.y, exports.DEFAULT_MASS * exports.DEFAULT_DENSITY / 2, 0, Math.PI * 2);
            this.app.ctx.fill();
            this.app.ctx.closePath();
        }
        else if (this.dragState) {
            const differenceVector = util_1.Vector2.difference(this.dragStart, this.app.inputDriver.mousePos);
            const dragEndDifference = util_1.Vector2.dot(differenceVector, new util_1.Vector2(-1, -1));
            const body = new PhysicsBody_1.default(this.app, exports.DEFAULT_MASS, this.dragStart, exports.DEFAULT_DENSITY);
            body.velocity = dragEndDifference.toForce();
            body.velocity.magnitude /= 10;
            this.bodies.push(body);
            this.dragState = false;
        }
        this.bodies.forEach(body => body.step());
    }
}
exports.SimulationWorld = SimulationWorld;


/***/ }),

/***/ "./src/TrailComponent.ts":
/*!*******************************!*\
  !*** ./src/TrailComponent.ts ***!
  \*******************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TrailComponent = void 0;
const util_1 = __webpack_require__(/*! ./util */ "./src/util.ts");
class TrailComponent {
    constructor(body) {
        this.trailAngleDifferenceThreshold = util_1.Angle.toRadians(1);
        this.trail = [];
        this.physicsBody = body;
    }
    step() {
        /**
         * 1. Initialize lastTrailPoint and lastTrailAngle if not already
         * 2. If lastTrailAngle and angle between lastTrailPoint and physics body position differ more than the threshold:
         * 2.1 -> Set lastTrailPoint and lastTrailAngle to the nessecary values
         * 2.2 -> Push the position to the trail list to be rendered later
         */
        if (!this.lastTrailPoint) {
            this.lastTrailPoint = this.physicsBody.position.clone();
            this.lastTrailAngle = this.physicsBody.velocity.radians;
        }
        const angleRelativeToLastTrail = this.physicsBody.position.toForce(this.lastTrailPoint);
        if (!util_1.Utils.between(Math.abs(angleRelativeToLastTrail.radians - this.lastTrailAngle), 0, this.trailAngleDifferenceThreshold)) {
            this.lastTrailAngle = angleRelativeToLastTrail.radians;
            this.trail.push(this.physicsBody.position.clone());
        }
    }
    render() {
        const ctx = this.physicsBody.app.ctx;
        if (this.trail.length > 0) {
            ctx.beginPath();
            ctx.strokeStyle = "#dddddd";
            ctx.lineWidth = 1;
            ctx.moveTo(this.trail[0].x, this.trail[0].y);
            for (let i = 1; i < this.trail.length; i++) {
                ctx.lineTo(this.trail[i].x, this.trail[i].y);
            }
            ctx.lineTo(this.physicsBody.position.x, this.physicsBody.position.y);
            ctx.stroke();
            ctx.closePath();
        }
    }
}
exports.TrailComponent = TrailComponent;


/***/ }),

/***/ "./src/UserInput.ts":
/*!**************************!*\
  !*** ./src/UserInput.ts ***!
  \**************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.InputDriver = void 0;
const util_1 = __webpack_require__(/*! ./util */ "./src/util.ts");
class InputDriver {
    constructor(app) {
        this.mousePos = new util_1.Vector2(0, 0);
        this.mouseDown = false;
        this.mouseClick = false;
        this.keysDown = [];
        this.keyPress = "";
        this.mouseClickFrames = 0;
        this.keyPressFrames = 0;
        this.keyPressEnable = true;
        this.lastKeyPress = "";
        this.app = app;
        const driver = this;
        $(window).on("mousemove", function (e) {
            driver.mousePos.x = e.clientX;
            driver.mousePos.y = e.clientY;
        });
        $(window).on("mousedown", function () {
            driver.mouseDown = true;
            driver.mouseClickFrames = 1;
        });
        $(window).on("mouseup", function () {
            driver.mouseDown = false;
        });
        $(window).on("keydown", function (e) {
            !driver.keysDown.includes(e.key) ? driver.keysDown.push(e.key) : "";
            driver.keyPress = (driver.keyPressEnable || (e.key != driver.lastKeyPress)) ? e.key : "";
            driver.lastKeyPress = e.key;
            driver.keyPressFrames = 1;
            driver.keyPressEnable = false;
        });
        $(window).on("keyup", function (e) {
            driver.keysDown.includes(e.key) ? driver.keysDown.splice(driver.keysDown.indexOf(e.key), 1) : "";
            driver.keyPressEnable = true;
        });
    }
    step() {
        this.mouseClick = !!this.mouseClickFrames;
        this.keyPress = !!this.keyPressFrames ? this.keyPress : "";
        this.mouseClickFrames = Math.max(0, this.mouseClickFrames - 1);
        this.keyPressFrames = Math.max(0, this.keyPressFrames - 1);
    }
}
exports.InputDriver = InputDriver;


/***/ }),

/***/ "./src/index.ts":
/*!**********************!*\
  !*** ./src/index.ts ***!
  \**********************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const App_1 = __importDefault(__webpack_require__(/*! ./App */ "./src/App.ts"));
let app;
$(function () {
    app = new App_1.default(window.innerWidth, window.innerHeight);
});
$(window).on("resize", function () {
    app.width = window.innerWidth;
    app.height = window.innerHeight;
});


/***/ }),

/***/ "./src/util.ts":
/*!*********************!*\
  !*** ./src/util.ts ***!
  \*********************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.LerpUtils = exports.Utils = exports.Angle = exports.Force = exports.Vector2 = void 0;
class Vector2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    distanceTo(vector) {
        return Math.sqrt(((this.x - vector.x) ** 2) + ((this.y - vector.y) ** 2));
    }
    toForce(fromVector = Vector2.ORIGIN) {
        return new Force(Math.atan2(this.y - fromVector.y, this.x - fromVector.x), this.distanceTo(fromVector));
    }
    add(vector) {
        this.x += vector.x;
        this.y += vector.y;
    }
    static difference(from, to) {
        return new Vector2(to.x - from.x, to.y - from.y);
    }
    static dot(vector1, vector2) {
        return new Vector2(vector1.x * vector2.x, vector1.y * vector2.y);
    }
    clone() {
        return new Vector2(this.x, this.y);
    }
    static get ORIGIN() {
        return new Vector2(0, 0);
    }
    static add(vector1, vector2) {
        return new Vector2(vector1.x + vector2.x, vector1.y + vector2.y);
    }
}
exports.Vector2 = Vector2;
class Force {
    constructor(radians, magnitude) {
        this.radians = radians;
        this.magnitude = magnitude;
    }
    toVector() {
        return new Vector2(Math.cos(this.radians) * this.magnitude, Math.sin(this.radians) * this.magnitude);
    }
    clone() {
        return new Force(this.radians, this.magnitude);
    }
    add(force) {
        const resultant = Vector2.add(this.toVector(), force.toVector()).toForce(Vector2.ORIGIN);
        this.radians = resultant.radians;
        this.magnitude = resultant.magnitude;
    }
    get degrees() {
        return Angle.toDegrees(this.radians);
    }
    set degrees(degrees) {
        this.radians = Angle.toRadians(degrees);
    }
    static add(force1, force2) {
        return Vector2.add(force1.toVector(), force2.toVector()).toForce(Vector2.ORIGIN);
    }
}
exports.Force = Force;
var Angle;
(function (Angle) {
    function toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }
    Angle.toRadians = toRadians;
    function toDegrees(radians) {
        return radians * (180 / Math.PI);
    }
    Angle.toDegrees = toDegrees;
})(Angle = exports.Angle || (exports.Angle = {}));
var Utils;
(function (Utils) {
    function random(min = 0, max = 100) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }
    Utils.random = random;
    function weightedRandom(weightMap) {
        let dcWeightMap = {};
        Object.assign(dcWeightMap, weightMap);
        let sum = 0;
        let random = Math.random();
        for (let i in dcWeightMap) {
            sum += dcWeightMap[i];
            if (random <= sum)
                return i;
        }
        return Object.keys(dcWeightMap).filter(item => dcWeightMap[item] == (Math.max(...Object.values(dcWeightMap))))[0];
    }
    Utils.weightedRandom = weightedRandom;
    function sample(array, amount = 1) {
        return array.sort(() => 0.5 - Math.random()).slice(0, amount);
    }
    Utils.sample = sample;
    function measureTextMetrics(ctx, text, fontStyle) {
        const oldFont = ctx.font;
        ctx.font = fontStyle;
        const textm = ctx.measureText(text);
        ctx.font = oldFont;
        return textm;
    }
    Utils.measureTextMetrics = measureTextMetrics;
    function measureTextHeight(ctx, text, fontStyle) {
        const metrics = measureTextMetrics(ctx, text, fontStyle);
        return metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
    }
    Utils.measureTextHeight = measureTextHeight;
    function measureTextWidth(ctx, text, fontStyle) {
        return measureTextMetrics(ctx, text, fontStyle).width;
    }
    Utils.measureTextWidth = measureTextWidth;
    function rbgToHex(red, blue, green) {
        return `#${prefixSpacing(red.toString(16), "0", 2)}${prefixSpacing(blue.toString(16), "0", 2)}${prefixSpacing(green.toString(16), "0", 2)}`;
    }
    Utils.rbgToHex = rbgToHex;
    function rbgaToHex(red, blue, green, alpha) {
        return `#${prefixSpacing(red.toString(16), "0", 2)}${prefixSpacing(blue.toString(16), "0", 2)}${prefixSpacing(green.toString(16), "0", 2)}${prefixSpacing((Math.round(255 * alpha)).toString(16), "0", 2)}`;
    }
    Utils.rbgaToHex = rbgaToHex;
    function clamp(n, min = 0, max = 1) {
        return Math.max(min, Math.min(n, max));
    }
    Utils.clamp = clamp;
    function wrapClamp(n, min = 0, max = 1) {
        const clamped = clamp(n, min, max);
        if (clamped === n) {
            return clamped;
        }
        else {
            const difference = clamped - n;
            console.log(difference);
            if (difference < 0)
                return min + difference;
            return max + difference;
        }
    }
    Utils.wrapClamp = wrapClamp;
    function prefixSpacing(text, prefix, length) {
        if (text.length >= length)
            return text;
        return prefix.repeat(length - text.length) + text;
    }
    Utils.prefixSpacing = prefixSpacing;
    function suffixSpacing(text, suffix, length) {
        if (text.length >= length)
            return text;
        return text + suffix.repeat(length - text.length);
    }
    Utils.suffixSpacing = suffixSpacing;
    function between(n, min, max) {
        return n >= min && n <= max;
    }
    Utils.between = between;
    function normalize(n, max = 1, min = 0) {
        return (n - min) / (max - min);
    }
    Utils.normalize = normalize;
    function isPositionOnLine(pos, linePos1, linePos2, fault = 1) {
        const posFromLinePoints = pos.distanceTo(linePos1) + pos.distanceTo(linePos2);
        const lineLength = linePos1.distanceTo(linePos2);
        return between(posFromLinePoints, lineLength - fault, lineLength + fault);
    }
    Utils.isPositionOnLine = isPositionOnLine;
    function isLineIntersectingLine(lp1, lp2, lp3, lp4) {
        let a = lp1.x, b = lp1.y, c = lp2.x, d = lp2.y, p = lp3.x, q = lp3.y, r = lp4.x, s = lp4.y;
        var det, gamma, lambda;
        det = (c - a) * (s - q) - (r - p) * (d - b);
        if (det === 0) {
            return false;
        }
        else {
            lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
            gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;
            return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
        }
    }
    Utils.isLineIntersectingLine = isLineIntersectingLine;
    function isPointInRectangle(point, rectPos, width, height) {
        return between(point.x, rectPos.x, rectPos.x + width) && between(point.y, rectPos.y, rectPos.y + height);
    }
    Utils.isPointInRectangle = isPointInRectangle;
    function isPointInPolygon(point, polygon, globalWidth, globalHeight) {
        let xIntersections = 0;
        let yIntersections = 0;
        let testLineX = [point, new Vector2(globalWidth, point.y)];
        let testLineY = [point, new Vector2(point.x, globalHeight)];
        polygon.forEach((position, posi) => {
            if (posi == (polygon.length - 1))
                return;
            if (isLineIntersectingLine(testLineX[0], testLineX[1], position, polygon[posi + 1]))
                xIntersections++;
            if (isLineIntersectingLine(testLineY[0], testLineY[1], position, polygon[posi + 1]))
                yIntersections++;
        });
        return (xIntersections % 2 === 1) && (yIntersections % 2 === 1);
    }
    Utils.isPointInPolygon = isPointInPolygon;
    function pointCircleCollide(point, circle, radius) {
        if (radius === 0)
            return false;
        var dx = circle.x - point.x;
        var dy = circle.y - point.y;
        return dx * dx + dy * dy <= radius;
    }
    Utils.pointCircleCollide = pointCircleCollide;
    function lineCircleCollide(lineSegment, circle, radius) {
        let t = new Vector2(0, 0);
        let nearest = new Vector2(0, 0);
        if (pointCircleCollide(lineSegment[0], circle, radius) || pointCircleCollide(lineSegment[1], circle, radius)) {
            return true;
        }
        let x1 = lineSegment[0].x, y1 = lineSegment[0].y, x2 = lineSegment[1].x, y2 = lineSegment[1].y, cx = circle.x, cy = circle.y;
        let dx = x2 - x1;
        let dy = y2 - y1;
        let lcx = cx - x1;
        let lcy = cy - y1;
        let dLen2 = dx * dx + dy * dy;
        let px = dx;
        let py = dy;
        if (dLen2 > 0) {
            let dp = (lcx * dx + lcy * dy) / dLen2;
            px *= dp;
            py *= dp;
        }
        if (!nearest)
            nearest = t;
        nearest.x = x1 + px;
        nearest.y = y1 + py;
        let pLen2 = px * px + py * py;
        return pointCircleCollide(nearest, circle, radius) && pLen2 <= dLen2 && (px * dx + py * dy) >= 0;
    }
    Utils.lineCircleCollide = lineCircleCollide;
    function setMouseCursor(cursorSource = "default") {
        document.body.style.cursor = cursorSource || "default";
    }
    Utils.setMouseCursor = setMouseCursor;
    function safeDivide(x, y) {
        return isFinite(x / y) ? x / y : 0;
    }
    Utils.safeDivide = safeDivide;
})(Utils = exports.Utils || (exports.Utils = {}));
var LerpUtils;
(function (LerpUtils) {
    class Lerper {
        constructor(from, to, duration, clamped = true) {
            this.lerpFunction = Functions.Linear;
            this.from = from;
            this.to = to;
            this.duration = duration;
            this.clamped = clamped;
            this.startTime = Date.now();
        }
        value(currentTime = Date.now()) {
            if (this.clamped)
                return LerpUtils.lerp(this.from, this.to, this.lerpFunction(Utils.clamp((currentTime - this.startTime) / this.duration)));
            else
                return LerpUtils.lerp(this.from, this.to, this.lerpFunction((currentTime - this.startTime) / this.duration));
        }
        reset() {
            this.startTime = Date.now();
        }
        get done() {
            return (this.startTime + this.duration) < Date.now();
        }
    }
    LerpUtils.Lerper = Lerper;
    function lerp(from, to, rate) {
        return from + (to - from) * rate;
    }
    LerpUtils.lerp = lerp;
    let Functions;
    (function (Functions) {
        Functions.Linear = x => x;
        Functions.Reverse = x => 1 - x;
        Functions.EaseIn = x => x * x;
        Functions.EaseOut = x => Functions.EaseIn(Functions.Reverse(x));
        Functions.EaseInOut = x => LerpUtils.lerp(Functions.EaseIn(x), Functions.EaseOut(x), x);
        Functions.Spike = x => x <= 0.5 ? Functions.EaseIn(x / 0.5) : Functions.EaseIn(Functions.Reverse(x) / 0.5);
    })(Functions = LerpUtils.Functions || (LerpUtils.Functions = {}));
})(LerpUtils = exports.LerpUtils || (exports.LerpUtils = {}));


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__("./src/index.ts");
/******/ 	
/******/ })()
;
//# sourceMappingURL=bundle.js.map