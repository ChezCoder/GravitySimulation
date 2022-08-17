import PhysicsBody from "./PhysicsBody";
import { Force } from "./util";

export namespace Physics {
    export const GRAVITATIONAL_CONSTANT = 6.67 * Math.pow(10, -11);

    export function gravitationalForceBetween(body1: PhysicsBody, body2: PhysicsBody): Force {
        return new Force(body1.position.toForce(body2.position).radians, (-GRAVITATIONAL_CONSTANT * body2.mass * body1.mass) / body1.position.distanceTo(body2.position))
    }
}