import { SimulationWorld } from "./SimulationWorld";
import { InputDriver } from "./UserInput";

export default class App {
    readonly canvas: HTMLCanvasElement;
    readonly ctx: CanvasRenderingContext2D;

    public inputDriver: InputDriver;
    public simulationWorld: SimulationWorld;

    private lastFrameTimestamp: number = Date.now();
    private _width: number;
    private _height: number;

    constructor(width: number, height: number) {
        this.canvas = document.createElement("canvas");
        this.ctx = this.canvas.getContext("2d")!;

        this.inputDriver = new InputDriver(this);

        this.width = width;
        this.height = height;

        document.body.appendChild(this.canvas);

        this.setup();
    }
    
    private setup() {
        this.simulationWorld = new SimulationWorld(this);
        this.raf();
    }

    private loop() {
        this.ctx.clearRect(0, 0, this._width, this._height);
        this.simulationWorld.step();
    }

    private raf() {
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

    set width(width: number) {
        this._width = width;
        this.canvas.width = width;
    }

    set height(height: number) {
        this._height = height;
        this.canvas.height = height;
    }

    get deltaTime(): number {
        return 1 / (Date.now() - this.lastFrameTimestamp);
    }
}