import PhysicsBody from "./PhysicsBody";
import { Angle, Utils, Vector2 } from "./util";

export class TrailComponent {
    readonly physicsBody: PhysicsBody;
    readonly trailAngleDifferenceThreshold = Angle.toRadians(1);

    public trail: Vector2[] = [];

    public lastTrailPoint: Vector2;
    public lastTrailAngle: number;

    constructor(body: PhysicsBody) {
        this.physicsBody = body;
    }

    public step() {
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

        if (!Utils.between(Math.abs(angleRelativeToLastTrail.radians - this.lastTrailAngle), 0, this.trailAngleDifferenceThreshold)) {
            this.lastTrailAngle = angleRelativeToLastTrail.radians;
            this.trail.push(this.physicsBody.position.clone());
        }
    }

    public render() {
        const ctx = this.physicsBody.app.ctx;

        if (this.trail.length > 0) {
            ctx.beginPath();
            ctx.strokeStyle = "#dddddd";
            ctx.lineWidth = 1;
            ctx.moveTo(this.trail[0].x, this.trail[0].y);
    
            for (let i = 1;i < this.trail.length;i++) {
                ctx.lineTo(this.trail[i].x, this.trail[i].y);
            }
            
            ctx.lineTo(this.physicsBody.position.x, this.physicsBody.position.y);
            ctx.stroke();
            ctx.closePath();
        }
    }
}