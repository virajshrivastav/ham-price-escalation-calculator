/**
 * HAM Formula Unit Tests
 * 
 * Test 1: Formula Validation (Old Series) - IJCRT paper benchmark
 * Test 2: Real-World Validation (Current Series) - Verified current data
 */

import { describe, it, expect } from 'vitest';
import { calculateHAM, WPI_WEIGHT, CPI_WEIGHT } from '@/lib/formulas/ham';

describe('HAM Formula', () => {
    describe('Constants', () => {
        it('should have correct weights', () => {
            expect(WPI_WEIGHT).toBe(0.70);
            expect(CPI_WEIGHT).toBe(0.30);
            expect(WPI_WEIGHT + CPI_WEIGHT).toBe(1.0);
        });
    });

    describe('Test 1: Formula Validation (Old Series - IJCRT Benchmark)', () => {
        /**
         * Uses IJCRT paper values to prove formula MATH is correct.
         * Uses old CPI-IW series (2001=100) but formula is the same.
         * Ratios cancel out base year differences.
         */
        it('should calculate PIM = 1.20 with IJCRT benchmark values', () => {
            const result = calculateHAM(5368728668, {
                wpiBase: 123,
                cpiBase: 405,
                wpiCurrent: 149.6,
                cpiCurrent: 479.16,
            });

            // P0 = (0.7 × 123) + (0.3 × 405) = 86.1 + 121.5 = 207.6
            expect(result.p0).toBeCloseTo(207.6, 1);

            // Pc = (0.7 × 149.6) + (0.3 × 479.16) = 104.72 + 143.748 = 248.468
            expect(result.pc).toBeCloseTo(248.468, 1);

            // PIM = 248.468 / 207.6 ≈ 1.197
            expect(result.pim).toBeCloseTo(1.20, 2);

            // This is NOT de-escalation
            expect(result.isDeEscalation).toBe(false);
        });
    });

    describe('Test 2: Real-World Validation (Current Series)', () => {
        /**
         * Uses verified current data.
         * wpiBase=148.8 (Mar 2022, verified from OEA)
         * cpiBase=126.0 (Mar 2022, from seed)
         * wpiCurrent=156.7 (Oct 2024, MCP verified)
         * cpiCurrent=144.5 (Oct 2024, from seed)
         * workValue=8745000
         */
        it('should calculate correct escalation with real indices', () => {
            const result = calculateHAM(8745000, {
                wpiBase: 148.8,
                cpiBase: 126.0,
                wpiCurrent: 156.7,
                cpiCurrent: 144.5,
            });

            // P0 = (0.7 × 148.8) + (0.3 × 126.0) = 104.16 + 37.8 = 141.96
            expect(result.p0).toBeCloseTo(141.96, 2);

            // Pc = (0.7 × 156.7) + (0.3 × 144.5) = 109.69 + 43.35 = 153.04
            expect(result.pc).toBeCloseTo(153.04, 2);

            // PIM = 153.04 / 141.96 = 1.0780
            expect(result.pim).toBeCloseTo(1.0780, 3);

            // Expected: P0 = 141.96, Pc = 153.04, PIM = 1.0780
            // Escalation = 8745000 × (PIM - 1) = 8745000 × 0.07804 ≈ 682,549
            expect(result.escalationAmount).toBeCloseTo(682549, -1); // Within 10

            // Total = 8745000 + escalation
            expect(result.totalAmount).toBeCloseTo(9427549, -1);

            expect(result.isDeEscalation).toBe(false);
        });
    });

    describe('Edge Cases', () => {
        it('should return zero escalation for zero work value', () => {
            const result = calculateHAM(0, {
                wpiBase: 148.8,
                cpiBase: 126.0,
                wpiCurrent: 156.7,
                cpiCurrent: 144.5,
            });

            expect(result.workDone).toBe(0);
            expect(result.escalationAmount).toBe(0);
            expect(result.totalAmount).toBe(0);
        });

        it('should correctly handle de-escalation (PIM < 1.0)', () => {
            // Reversed: current < base means deflation
            const result = calculateHAM(10000000, {
                wpiBase: 156.7,
                cpiBase: 144.5,
                wpiCurrent: 148.8,
                cpiCurrent: 126.0,
            });

            expect(result.pim).toBeLessThan(1.0);
            expect(result.isDeEscalation).toBe(true);
            expect(result.escalationAmount).toBeLessThan(0);
        });

        it('should throw error for negative work value', () => {
            expect(() =>
                calculateHAM(-1000, {
                    wpiBase: 148.8,
                    cpiBase: 126.0,
                    wpiCurrent: 156.7,
                    cpiCurrent: 144.5,
                })
            ).toThrow('Work value cannot be negative');
        });

        it('should throw error for zero or negative indices', () => {
            expect(() =>
                calculateHAM(1000000, {
                    wpiBase: 0,
                    cpiBase: 126.0,
                    wpiCurrent: 156.7,
                    cpiCurrent: 144.5,
                })
            ).toThrow('All index values must be positive');
        });
    });

    describe('Breakdown Calculation', () => {
        it('should provide correct weighted breakdown', () => {
            const result = calculateHAM(1000000, {
                wpiBase: 100,
                cpiBase: 100,
                wpiCurrent: 110,
                cpiCurrent: 105,
            });

            expect(result.breakdown.wpiBaseWeighted).toBe(70);  // 0.7 × 100
            expect(result.breakdown.cpiBaseWeighted).toBe(30);  // 0.3 × 100
            expect(result.breakdown.wpiCurrentWeighted).toBe(77); // 0.7 × 110
            expect(result.breakdown.cpiCurrentWeighted).toBe(31.5); // 0.3 × 105
        });
    });

    describe('Stress Tests - Extreme Values', () => {
        it('should handle very large work values (₹1000 crore)', () => {
            const result = calculateHAM(10000000000, { // 1000 crore
                wpiBase: 148.8,
                cpiBase: 126.0,
                wpiCurrent: 156.7,
                cpiCurrent: 144.5,
            });

            // PIM should still be calculated correctly
            expect(result.pim).toBeCloseTo(1.0780, 3);
            // Escalation = 10 billion × 0.078 ≈ 780 million
            expect(result.escalationAmount).toBeGreaterThan(700000000);
            expect(result.escalationAmount).toBeLessThan(900000000);
            expect(Number.isFinite(result.totalAmount)).toBe(true);
        });

        it('should handle very small work values (₹1)', () => {
            const result = calculateHAM(1, {
                wpiBase: 148.8,
                cpiBase: 126.0,
                wpiCurrent: 156.7,
                cpiCurrent: 144.5,
            });

            expect(result.pim).toBeCloseTo(1.0780, 3);
            // Escalation should be ~0.078
            expect(result.escalationAmount).toBeCloseTo(0.078, 2);
            expect(result.totalAmount).toBeCloseTo(1.078, 2);
        });

        it('should handle fractional paise values', () => {
            const result = calculateHAM(8745123.45, {
                wpiBase: 148.8,
                cpiBase: 126.0,
                wpiCurrent: 156.7,
                cpiCurrent: 144.5,
            });

            expect(Number.isFinite(result.escalationAmount)).toBe(true);
            expect(Number.isFinite(result.totalAmount)).toBe(true);
        });

        it('should handle identical base and current indices (no change)', () => {
            const result = calculateHAM(10000000, {
                wpiBase: 150.0,
                cpiBase: 130.0,
                wpiCurrent: 150.0,
                cpiCurrent: 130.0,
            });

            expect(result.pim).toBe(1.0);
            expect(result.escalationAmount).toBe(0);
            expect(result.totalAmount).toBe(10000000);
            expect(result.isDeEscalation).toBe(false);
        });

        it('should handle very high inflation scenario (50% increase)', () => {
            const result = calculateHAM(10000000, {
                wpiBase: 100.0,
                cpiBase: 100.0,
                wpiCurrent: 150.0,
                cpiCurrent: 150.0,
            });

            expect(result.pim).toBe(1.5);
            expect(result.escalationAmount).toBe(5000000);
            expect(result.isDeEscalation).toBe(false);
        });

        it('should handle severe deflation scenario (30% decrease)', () => {
            const result = calculateHAM(10000000, {
                wpiBase: 100.0,
                cpiBase: 100.0,
                wpiCurrent: 70.0,
                cpiCurrent: 70.0,
            });

            expect(result.pim).toBe(0.7);
            expect(result.escalationAmount).toBe(-3000000);
            expect(result.isDeEscalation).toBe(true);
        });
    });

    describe('Stress Tests - Precision & Floating Point', () => {
        it('should maintain precision with repeating decimals', () => {
            const result = calculateHAM(10000000, {
                wpiBase: 100.0,
                cpiBase: 100.0,
                wpiCurrent: 133.33333333,
                cpiCurrent: 133.33333333,
            });

            // PIM should be approximately 1.333...
            expect(result.pim).toBeCloseTo(1.3333, 3);
        });

        it('should handle very small index differences', () => {
            const result = calculateHAM(100000000, { // 10 crore
                wpiBase: 100.00,
                cpiBase: 100.00,
                wpiCurrent: 100.01,
                cpiCurrent: 100.01,
            });

            // PIM should be 1.0001
            expect(result.pim).toBeCloseTo(1.0001, 4);
            // Escalation = 10 crore × 0.0001 = 10,000
            expect(result.escalationAmount).toBeCloseTo(10000, 0);
        });

        it('should not produce NaN or Infinity', () => {
            const result = calculateHAM(1000000, {
                wpiBase: 0.001, // Very small but positive
                cpiBase: 0.001,
                wpiCurrent: 0.002,
                cpiCurrent: 0.002,
            });

            expect(Number.isNaN(result.pim)).toBe(false);
            expect(Number.isNaN(result.escalationAmount)).toBe(false);
            expect(Number.isFinite(result.totalAmount)).toBe(true);
        });
    });

    describe('Stress Tests - Asymmetric Scenarios', () => {
        it('should handle WPI increasing while CPI decreasing', () => {
            const result = calculateHAM(10000000, {
                wpiBase: 100.0,
                cpiBase: 100.0,
                wpiCurrent: 120.0, // +20%
                cpiCurrent: 90.0,  // -10%
            });

            // P0 = 70 + 30 = 100
            // Pc = 84 + 27 = 111
            // PIM = 1.11
            expect(result.pim).toBeCloseTo(1.11, 2);
            expect(result.isDeEscalation).toBe(false);
        });

        it('should handle CPI increasing while WPI decreasing', () => {
            const result = calculateHAM(10000000, {
                wpiBase: 100.0,
                cpiBase: 100.0,
                wpiCurrent: 80.0,  // -20%
                cpiCurrent: 130.0, // +30%
            });

            // P0 = 70 + 30 = 100
            // Pc = 56 + 39 = 95
            // PIM = 0.95
            expect(result.pim).toBeCloseTo(0.95, 2);
            expect(result.isDeEscalation).toBe(true);
        });

        it('should weight WPI more heavily (70%)', () => {
            // WPI up 10%, CPI unchanged
            const wpiOnlyResult = calculateHAM(10000000, {
                wpiBase: 100.0,
                cpiBase: 100.0,
                wpiCurrent: 110.0,
                cpiCurrent: 100.0,
            });

            // WPI unchanged, CPI up 10%
            const cpiOnlyResult = calculateHAM(10000000, {
                wpiBase: 100.0,
                cpiBase: 100.0,
                wpiCurrent: 100.0,
                cpiCurrent: 110.0,
            });

            // WPI change should have more impact (7% vs 3%)
            expect(wpiOnlyResult.escalationAmount).toBeGreaterThan(cpiOnlyResult.escalationAmount);
            expect(wpiOnlyResult.escalationAmount).toBeCloseTo(700000, -3); // ~7 lakh
            expect(cpiOnlyResult.escalationAmount).toBeCloseTo(300000, -3); // ~3 lakh
        });
    });

    describe('Stress Tests - Boundary Months', () => {
        it('should calculate for earliest possible date (Jan 2015)', () => {
            // Testing with reasonable historical values
            const result = calculateHAM(10000000, {
                wpiBase: 110.0,
                cpiBase: 240.0,
                wpiCurrent: 156.7,
                cpiCurrent: 144.5,
            });

            expect(Number.isFinite(result.pim)).toBe(true);
            expect(Number.isFinite(result.escalationAmount)).toBe(true);
        });

        it('should handle December to January transition', () => {
            // This tests the base month calculation when bid is in January
            // Base month should be December of previous year
            const result = calculateHAM(10000000, {
                wpiBase: 155.0, // Dec 2023
                cpiBase: 140.0,
                wpiCurrent: 157.0, // Feb 2024 current
                cpiCurrent: 142.0,
            });

            expect(result.pim).toBeGreaterThan(1.0);
            expect(result.isDeEscalation).toBe(false);
        });
    });

    describe('Stress Tests - Real Contract Scenarios', () => {
        it('should handle 1-month old contract (minimal change)', () => {
            const result = calculateHAM(50000000, {
                wpiBase: 156.5,
                cpiBase: 144.3,
                wpiCurrent: 156.7,
                cpiCurrent: 144.5,
            });

            // Very small PIM change
            expect(result.pim).toBeCloseTo(1.001, 2);
            expect(result.escalationAmount).toBeLessThan(100000);
        });

        it('should handle multi-year contract (significant change)', () => {
            // 3 year old contract: base from 2021, current in 2024
            // Using consistent 2016=100 CPI-IW series throughout
            const result = calculateHAM(500000000, { // 50 crore
                wpiBase: 135.0, // 2021 level
                cpiBase: 120.0, // 2021 CPI-IW (2016=100)
                wpiCurrent: 157.0,
                cpiCurrent: 145.0,
            });

            // Significant escalation expected (inflation scenario)
            expect(result.pim).toBeGreaterThan(1.0);
            expect(result.pim).toBeLessThan(1.25);
            expect(Number.isFinite(result.escalationAmount)).toBe(true);
            expect(result.escalationAmount).toBeGreaterThan(0);
        });

        it('should handle typical RA bill amount (₹87.45 lakh)', () => {
            const result = calculateHAM(8745000, {
                wpiBase: 148.8,
                cpiBase: 126.0,
                wpiCurrent: 156.7,
                cpiCurrent: 144.5,
            });

            // Allow for minor variations in actual WPI values
            expect(result.pim).toBeGreaterThan(1.07);
            expect(result.pim).toBeLessThan(1.09);
            expect(result.escalationAmount).toBeGreaterThan(600000);
            expect(result.escalationAmount).toBeLessThan(750000);
        });
    });
});
