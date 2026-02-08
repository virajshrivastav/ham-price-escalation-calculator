/**
 * Index Service
 * 
 * Cache-first strategy for fetching WPI and CPI-IW indices.
 * - Check database cache first
 * - For WPI: fetch from MCP if cache miss, then cache
 * - For CPI-IW: return from seed or throw if not available
 */

import { db } from '@/lib/db';
import { indices } from '@/db/schema';
import { fetchWPI } from '@/lib/mcp-client';
import { eq, and } from 'drizzle-orm';

export interface IndexResult {
    value: number;
    source: 'cache' | 'mcp' | 'seed';
    isEstimate: boolean;
    estimateSource?: string; // Month used if estimate
}

/**
 * Get WPI for a specific month
 * Multi-tier fallback strategy:
 * 1. Check database cache
 * 2. Try MCP with 5s timeout
 * 3. Use cached seed data
 * 4. Return most recent WPI as estimate
 */
export async function getWPI(year: number, month: number): Promise<IndexResult | null> {
    // 1. Check cache first (includes both MCP-cached and seeded data)
    const cached = await db
        .select()
        .from(indices)
        .where(
            and(
                eq(indices.type, 'WPI'),
                eq(indices.year, year),
                eq(indices.month, month)
            )
        )
        .limit(1);

    if (cached.length > 0) {
        const record = cached[0];
        return {
            value: record.value,
            source: record.source === 'MoSPI MCP' ? 'mcp' : 'cache',
            isEstimate: false,
        };
    }

    // 2. Try MCP with 5s timeout
    try {
        const wpiValue = await Promise.race([
            fetchWPI(year, month),
            new Promise<null>((_, reject) =>
                setTimeout(() => reject(new Error('MCP timeout')), 5000)
            )
        ]);

        if (wpiValue !== null) {
            // Cache the result
            await db.insert(indices).values({
                type: 'WPI',
                year,
                month,
                value: wpiValue,
                source: 'MoSPI MCP',
            });

            return {
                value: wpiValue,
                source: 'mcp',
                isEstimate: false,
            };
        }
    } catch (e) {
        console.warn(`[WPI] MCP unavailable for ${year}-${month}, using fallback`);
    }

    // 3. No exact match and MCP failed - find most recent available as estimate
    const mostRecent = await db
        .select()
        .from(indices)
        .where(eq(indices.type, 'WPI'))
        .orderBy(indices.year, indices.month)
        .limit(1);

    if (mostRecent.length > 0) {
        const recent = mostRecent[0];
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const estimateMonth = `${monthNames[recent.month - 1]} ${recent.year}`;

        return {
            value: recent.value,
            source: 'cache',
            isEstimate: true,
            estimateSource: estimateMonth,
        };
    }

    // 4. No data at all
    return null;
}

/**
 * Get CPI-IW for a specific month
 * Only returns seeded data (no API available)
 * If not available, returns most recent available as estimate
 */
export async function getCPIIW(year: number, month: number): Promise<IndexResult | null> {
    // Check for exact match
    const exact = await db
        .select()
        .from(indices)
        .where(
            and(
                eq(indices.type, 'CPI-IW'),
                eq(indices.year, year),
                eq(indices.month, month)
            )
        )
        .limit(1);

    if (exact.length > 0) {
        return {
            value: exact[0].value,
            source: 'seed',
            isEstimate: false,
        };
    }

    // No exact match - find most recent available
    const mostRecent = await db
        .select()
        .from(indices)
        .where(eq(indices.type, 'CPI-IW'))
        .orderBy(indices.year, indices.month)
        .limit(1);

    if (mostRecent.length > 0) {
        const recent = mostRecent[0];
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const estimateMonth = `${monthNames[recent.month - 1]} ${recent.year}`;

        return {
            value: recent.value,
            source: 'seed',
            isEstimate: true,
            estimateSource: estimateMonth,
        };
    }

    return null;
}

/**
 * Get both WPI and CPI-IW for a month
 * Convenience function for fetching both indices at once
 */
export async function getIndicesForMonth(year: number, month: number): Promise<{
    wpi: IndexResult | null;
    cpi: IndexResult | null;
}> {
    const [wpi, cpi] = await Promise.all([
        getWPI(year, month),
        getCPIIW(year, month),
    ]);

    return { wpi, cpi };
}
