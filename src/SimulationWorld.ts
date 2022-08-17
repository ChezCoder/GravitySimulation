import App from "./App";
import PhysicsBody from "./PhysicsBody";
import { Vector2 } from "./util";

export const DEFAULT_MASS = 100000000000;
export const DEFAULT_DENSITY = 0.0000000001;


export class SimulationWorld {
    readonly app: App;
    
    private dragState: boolean;
    private dragStart: Vector2;

    public bodies: PhysicsBody[];

    constructor(app: App) {
        this.dragState = false;
        this.dragStart = Vector2.ORIGIN;
        this.app = app;
        this.bodies = [];
    }

    public step() {
        if (this.app.inputDriver.mouseDown) {
            if (this.dragState) {
                const differenceVector = Vector2.difference(this.dragStart, this.app.inputDriver.mousePos);
                const dragEndDifference = Vector2.dot(differenceVector, new Vector2(-1, -1));
                const dragEnd = Vector2.add(this.dragStart, dragEndDifference);

                this.app.ctx.beginPath();
                this.app.ctx.strokeStyle = "#aaaaaa";
                this.app.ctx.moveTo(this.dragStart.x, this.dragStart.y);
                this.app.ctx.lineTo(dragEnd.x, dragEnd.y);
                this.app.ctx.lineWidth = 2;
                this.app.ctx.stroke();
                this.app.ctx.closePath();
            } else {
                this.dragState = true;
                this.dragStart = this.app.inputDriver.mousePos.clone();
            }

            this.app.ctx.beginPath();
            this.app.ctx.fillStyle = "white";
            this.app.ctx.arc(this.dragStart.x, this.dragStart.y, DEFAULT_MASS * DEFAULT_DENSITY / 2, 0, Math.PI * 2);
            this.app.ctx.fill();
            this.app.ctx.closePath();
        } else if (this.dragState) {
            const differenceVector = Vector2.difference(this.dragStart, this.app.inputDriver.mousePos);
            const dragEndDifference = Vector2.dot(differenceVector, new Vector2(-1, -1));

            const body = new PhysicsBody(this.app, DEFAULT_MASS, this.dragStart, DEFAULT_DENSITY);
            
            body.velocity = dragEndDifference.toForce();
            body.velocity.magnitude /= 10;
            
            this.bodies.push(body);
            this.dragState = false;
        }

        this.bodies.forEach(body => body.step());
    }
}