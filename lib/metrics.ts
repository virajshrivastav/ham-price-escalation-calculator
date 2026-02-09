/**
 * Simple In-Memory Metrics
 * 
 * Tracks cache performance and API latency for observability.
 * Note: Metrics reset on server restart. For production,
 * consider using an external service like Datadog, New Relic, or custom logging.
 */

export interface Metrics {
    cacheHits: number;
    cacheMisses: number;
    mcpCalls: number;
    mcpSuccesses: number;
    mcpErrors: number;
    mcpTotalLatencyMs: number;
    staleServes: number;
    estimateServes: number;
    lastUpdated: string;
}

// In-memory metrics storage
const metrics: Metrics = {
    cacheHits: 0,
    cacheMisses: 0,
    mcpCalls: 0,
    mcpSuccesses: 0,
    mcpErrors: 0,
    mcpTotalLatencyMs: 0,
    staleServes: 0,
    estimateServes: 0,
    lastUpdated: new Date().toISOString(),
};

/**
 * Record a cache hit
 */
export function recordCacheHit(): void {
    metrics.cacheHits++;
    metrics.lastUpdated = new Date().toISOString();
}

/**
 * Record a cache miss
 */
export function recordCacheMiss(): void {
    metrics.cacheMisses++;
    metrics.lastUpdated = new Date().toISOString();
}

/**
 * Record an MCP API call and its result
 */
export function recordMcpCall(success: boolean, latencyMs: number): void {
    metrics.mcpCalls++;
    metrics.mcpTotalLatencyMs += latencyMs;
    if (success) {
        metrics.mcpSuccesses++;
    } else {
        metrics.mcpErrors++;
    }
    metrics.lastUpdated = new Date().toISOString();
}

/**
 * Record serving stale data
 */
export function recordStaleServe(): void {
    metrics.staleServes++;
    metrics.lastUpdated = new Date().toISOString();
}

/**
 * Record serving estimated data
 */
export function recordEstimateServe(): void {
    metrics.estimateServes++;
    metrics.lastUpdated = new Date().toISOString();
}

/**
 * Get current metrics snapshot
 */
export function getMetrics(): Metrics & {
    cacheHitRate: number;
    mcpSuccessRate: number;
    avgMcpLatencyMs: number;
} {
    const totalCacheAccesses = metrics.cacheHits + metrics.cacheMisses;
    const cacheHitRate = totalCacheAccesses > 0
        ? (metrics.cacheHits / totalCacheAccesses) * 100
        : 0;

    const mcpSuccessRate = metrics.mcpCalls > 0
        ? (metrics.mcpSuccesses / metrics.mcpCalls) * 100
        : 100;

    const avgMcpLatencyMs = metrics.mcpCalls > 0
        ? Math.round(metrics.mcpTotalLatencyMs / metrics.mcpCalls)
        : 0;

    return {
        ...metrics,
        cacheHitRate: Math.round(cacheHitRate * 10) / 10,
        mcpSuccessRate: Math.round(mcpSuccessRate * 10) / 10,
        avgMcpLatencyMs,
    };
}

/**
 * Reset all metrics (useful for testing)
 */
export function resetMetrics(): void {
    metrics.cacheHits = 0;
    metrics.cacheMisses = 0;
    metrics.mcpCalls = 0;
    metrics.mcpSuccesses = 0;
    metrics.mcpErrors = 0;
    metrics.mcpTotalLatencyMs = 0;
    metrics.staleServes = 0;
    metrics.estimateServes = 0;
    metrics.lastUpdated = new Date().toISOString();
}
