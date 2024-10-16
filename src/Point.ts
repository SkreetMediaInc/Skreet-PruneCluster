/**
 * Represents a point in a 2D coordinate system.
 *
 * This interface defines a point with `x` and `y` coordinates, which can be used
 * to represent positions in a 2D space. It is commonly used in graphical applications,
 * mapping libraries, and other contexts where 2D coordinates are needed.
 *
 * @interface Point
 * @property {number} x - The x-coordinate of the point.
 * @property {number} y - The y-coordinate of the point.
 *
 * @example
 * // Creating a point at coordinates (10, 20)
 * const point: Point = { x: 10, y: 20 };
 *
 * @example
 * // Function that takes a Point and logs its coordinates
 * function logPoint(point: Point): void {
 *     console.log(`Point coordinates are (${point.x}, ${point.y})`);
 * }
 */
export interface Point {
    x: number;
    y: number;
}