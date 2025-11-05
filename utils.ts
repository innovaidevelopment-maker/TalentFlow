
import type { EvaluationScore, Factor, CalculatedScores, EvaluationLevel, LevelThreshold } from './types';

export const calculateScoresAndLevel = (
    scores: EvaluationScore[], 
    criteria: Factor[]
): CalculatedScores => {
    let totalWeightedScore = 0;
    let totalWeight = 0;

    const factorScores = criteria.map(factor => {
        let factorWeightedScore = 0;
        let factorTotalWeight = 0;
        
        factor.characteristics.forEach(char => {
            const score = scores.find(s => s.characteristicId === char.id)?.score ?? 0;
            factorWeightedScore += score * char.weight;
            factorTotalWeight += char.weight;
        });

        totalWeightedScore += factorWeightedScore;
        totalWeight += factorTotalWeight;

        const factorAverage = factorTotalWeight > 0 ? factorWeightedScore / factorTotalWeight : 0;
        
        return {
            factorId: factor.id,
            factorName: factor.name,
            score: factorAverage
        };
    });

    const overallScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;

    return {
        overall: overallScore,
        factors: factorScores
    };
};


export const getLevel = (
    score: number,
    thresholds: LevelThreshold[]
): EvaluationLevel => {
    const sortedThresholds = [...thresholds].sort((a, b) => a.threshold - b.threshold);
    for (const level of sortedThresholds) {
        if (score <= level.threshold) {
            return level.name;
        }
    }
    return 'Indeterminado'; 
};
