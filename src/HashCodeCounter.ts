// src/HashCodeCounter.ts
export const MaxHashCodeValue = Math.pow(2, 53) - 1;

export class HashCodeCounter {
    private static hashCodeCounter: number = 1;

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