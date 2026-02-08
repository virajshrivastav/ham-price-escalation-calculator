/**
 * HAM (Hybrid Annuity Model) Price Escalation Calculator
 * 
 * Formula: PIM = Pc / P0
 * Where:
 *   Pc = (0.70 × WPI_current) + (0.30 × CPI-IW_current)
 *   P0 = (0.70 × WPI_base) + (0.30 × CPI-IW_base)
 *   Escalation = Work Done × (PIM - 1)
 * 
 * Source: MCA Clause 23.4 (Model Concession Agreement, Article 23)
 */

export const WPI_WEIGHT = 0.70;
export const CPI_WEIGHT = 0.30;

export interface HAMIndices {
    wpiBase: number;
    cpiBase: number;
    wpiCurrent: number;
    cpiCurrent: number;
}

export interface HAMResult {
    p0: number;
    pc: number;
    pim: number;
    workDone: number;
    escalationAmount: number;
    totalAmount: number;
    isDeEscalation: boolean;
    breakdown: {
        wpiBaseWeighted: number;
        cpiBaseWeighted: number;
        wpiCurrentWeighted: number;
        cpiCurrentWeighted: number;
    };
}

/**
 * Round to specified decimal places
 */
function roundToDecimals(value: number, decimals: number): number {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
}

/**
 * Calculate HAM escalation
 * 
 * @param workValue - Work done value in rupees
 * @param indices - WPI and CPI-IW values for base and current periods
 * @returns HAMResult with all calculated values
 * @throws Error if any index value is invalid
 */
export function calculateHAM(workValue: number, indices: HAMIndices): HAMResult {
    // Validate inputs
    if (workValue < 0) {
        throw new Error('Work value cannot be negative');
    }

    if (indices.wpiBase <= 0 || indices.cpiBase <= 0 ||
        indices.wpiCurrent <= 0 || indices.cpiCurrent <= 0) {
        throw new Error('All index values must be positive');
    }

    // Calculate weighted base values
    const wpiBaseWeighted = WPI_WEIGHT * indices.wpiBase;
    const cpiBaseWeighted = CPI_WEIGHT * indices.cpiBase;

    // Calculate weighted current values
    const wpiCurrentWeighted = WPI_WEIGHT * indices.wpiCurrent;
    const cpiCurrentWeighted = CPI_WEIGHT * indices.cpiCurrent;

    // Calculate P0 (Base Period Composite Index)
    const p0 = wpiBaseWeighted + cpiBaseWeighted;

    // Calculate Pc (Current Period Composite Index)
    const pc = wpiCurrentWeighted + cpiCurrentWeighted;

    // Calculate PIM (Price Index Multiple)
    const pim = pc / p0;

    // Calculate Escalation Amount
    const escalationAmount = workValue * (pim - 1);

    // Calculate Total Amount
    const totalAmount = workValue + escalationAmount;

    // Determine if this is de-escalation (PIM < 1.0)
    const isDeEscalation = pim < 1;

    return {
        p0: roundToDecimals(p0, 2),
        pc: roundToDecimals(pc, 2),
        pim: roundToDecimals(pim, 4),
        workDone: workValue,
        escalationAmount: roundToDecimals(escalationAmount, 2),
        totalAmount: roundToDecimals(totalAmount, 2),
        isDeEscalation,
        breakdown: {
            wpiBaseWeighted: roundToDecimals(wpiBaseWeighted, 2),
            cpiBaseWeighted: roundToDecimals(cpiBaseWeighted, 2),
            wpiCurrentWeighted: roundToDecimals(wpiCurrentWeighted, 2),
            cpiCurrentWeighted: roundToDecimals(cpiCurrentWeighted, 2),
        },
    };
}

/**
 * Format PIM for display (2 decimal places)
 */
export function formatPIM(pim: number): string {
    return pim.toFixed(2);
}
