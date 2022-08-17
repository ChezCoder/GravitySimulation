import App from "./App";
import { Vector2 } from "./util";

export class InputDriver {
    public mousePos: Vector2 = new Vector2(0, 0);
    public mouseDown: boolean = false;
    public mouseClick: boolean = false;
    public keysDown: string[] = [];
    public keyPress: string = "";
    public app: App;
    
    private mouseClickFrames = 0;
    private keyPressFrames = 0;
    private keyPressEnable = true;
    private lastKeyPress: string = "";

    constructor(app: App) {
        this.app = app;

        const driver = this;

        

        $(window).on("mousemove", function(e) {
            driver.mousePos.x = e.clientX;
            driver.mousePos.y = e.clientY;
        });
        
        $(window).on("mousedown", function() {
            driver.mouseDown = true;
            driver.mouseClickFrames = 1;
        });
        
        $(window).on("mouseup", function() {
            driver.mouseDown = false;
        });
        
        $(window).on("keydown", function(e) {
            !driver.keysDown.includes(e.key) ? driver.keysDown.push(e.key) : "";
            driver.keyPress = (driver.keyPressEnable || (e.key != driver.lastKeyPress)) ? e.key : "";
            driver.lastKeyPress = e.key;
            driver.keyPressFrames = 1;
            driver.keyPressEnable = false;
        });
        
        $(window).on("keyup", function(e) {
            driver.keysDown.includes(e.key) ? driver.keysDown.splice(driver.keysDown.indexOf(e.key), 1) : "";
            driver.keyPressEnable = true;
        });
    }

    public step() {
        this.mouseClick = !!this.mouseClickFrames;
        this.keyPress = !!this.keyPressFrames ? this.keyPress : "";
        this.mouseClickFrames = Math.max(0, this.mouseClickFrames - 1);
        this.keyPressFrames = Math.max(0, this.keyPressFrames - 1);
    }
}