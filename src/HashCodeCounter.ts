// src/HashCodeCounter.ts
export const MaxHashCodeValue = Math.pow(2, 53) - 1;

export class HashCodeCounter {
    private static hashCodeCounter: number = 1;

    public static getHashCode(): number {
        if (this.hashCodeCounter >= MaxHashCodeValue) {
            this.hashCodeCounter = 1;
        }
        return this.hashCodeCounter++;
    }
}

export default HashCodeCounter;