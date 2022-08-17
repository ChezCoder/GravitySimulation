import App from "./App";
import { Physics } from "./Physics";
import { TrailComponent } from "./TrailComponent";
import { Force, LerpUtils, Vector2 } from "./util";

export default class PhysicsBody {
    private static id: number = 0;

    private renderedMass: number;

    readonly id: number;
    readonly trail: TrailComponent;

    public app: App;
    public density: number;
    public mass: number;
    public position: Vector2;
    public velocity: Force;
    public enabled: boolean;
    
    constructor(app: App, mass: number, position: Vector2, density: number) {
        this.id = PhysicsBody.id++;
        this.mass = mass;
        this.position = position;
        this.density = density;
        this.app = app;
        this.velocity = new Force(0, 0);
        this.trail = new TrailComponent(this);
    }

    public step() {
        const resultingForce = this.velocity.clone();

        for (let i = 0;i < this.app.simulationWorld.bodies.length;i++) {
            const body = this.app.simulationWorld.bodies[i];
            if (body.id == this.id) continue;

            if (body.position.distanceTo(this.position) < (this.visualRadius * 0.75)) {
                if (this.mass >= body.mass) {
                    const index = this.app.simulationWorld.bodies.findIndex(b => b.id == body.id);
                    const slowdownPercentage = body.mass / this.mass;
                    
                    resultingForce.magnitude *= 1 - slowdownPercentage;
                    
                    this.app.simulationWorld.bodies.splice(index, 1);
                    this.mass += body.mass;
                }
            } else {
                const gravitationalForce = Physics.gravitationalForceBetween(this, body);
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

    private render() {
        this.renderedMass = LerpUtils.lerp(this.renderedMass || this.mass, this.mass, 0.1);

        this.app.ctx.beginPath();
        this.app.ctx.fillStyle = "white";
        this.app.ctx.arc(this.position.x, this.position.y, this.visualRadius, 0, Math.PI * 2);
        this.app.ctx.fill();
        this.app.ctx.closePath();

        this.trail.render();
    }

    public get visualRadius(): number {
        return this.renderedMass * this.density / 2;
    }
}