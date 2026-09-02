// Kept out of the components so each joust file exports only its component,
// which is what lets Fast Refresh hot-swap them.

export const roundsFor = (bracketSize: number) => Math.log2(bracketSize);

export const roundName = (round: number, totalRounds: number) => {
    if (round === totalRounds) return 'Final';
    if (round === totalRounds - 1) return 'Semi-Finals';
    return `Round ${round}`;
};
