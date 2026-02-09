/**
 * Metrics API Endpoint
 * 
 * Returns cache performance and MCP API metrics for monitoring.
 * GET /api/metrics
 */

import { NextResponse } from 'next/server';
import { getMetrics } from '@/lib/metrics';

export async function GET() {
    const metrics = getMetrics();

    return NextResponse.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        metrics: {
            cache: {
                hits: metrics.cacheHits,
                misses: metrics.cacheMisses,
                hitRate: `${metrics.cacheHitRate}%`,
            },
            mcp: {
                totalCalls: metrics.mcpCalls,
                successes: metrics.mcpSuccesses,
                errors: metrics.mcpErrors,
                successRate: `${metrics.mcpSuccessRate}%`,
                avgLatencyMs: metrics.avgMcpLatencyMs,
            },
            fallbacks: {
                staleServes: metrics.staleServes,
                estimateServes: metrics.estimateServes,
            },
            lastUpdated: metrics.lastUpdated,
        },
    });
}
