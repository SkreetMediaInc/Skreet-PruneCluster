// src/HashCodeCounter.ts
export const MaxHashCodeValue = Math.pow(2, 53) - 1;

/**
 * A class to generate unique hash codes.
 * The hash codes are generated sequentially and reset after reaching the maximum value.
 */
export class HashCodeCounter {
    /**
     * The current value of the hash code counter.
     * @private
     * @type {number}
     */
    private static hashCodeCounter: number = 1;

    /**
     * Generates and returns the next hash code.
     * The hash code is incremented sequentially and resets to 1 after reaching the maximum value.
     *
     * @returns {number} The next hash code.
     */
    public static getHashCode(): number {
        const currentHash = this.hashCodeCounter;
        this.hashCodeCounter++;

        if (currentHash >= MaxHashCodeValue) {
            this.hashCodeCounter = 1;  // Reset only after returning the max value
        }

        return currentHash;
    }
}

export default HashCodeCounter;