
export const roundsFor = (bracketSize: number) => Math.log2(bracketSize);

export const roundName = (round: number, totalRounds: number) => {
    if (round === totalRounds) return 'Final';
    if (round === totalRounds - 1) return 'Semi-Finals';
    return `Round ${round}`;
};
