/**
 * MoSPI MCP Client
 * 
 * Session-aware client for fetching WPI data from MoSPI MCP server.
 * The MCP protocol requires a handshake before tool calls:
 * 1. POST initialize → get mcp-session-id header
 * 2. POST notifications/initialized (with session ID)
 * 3. POST tools/call (with session ID)
 * 
 * Note: FastMCP 3.0 returns SSE (text/event-stream) format with CRLF line endings.
 */

const MCP_URL = process.env.MCP_URL || 'http://localhost:8000/mcp';

let sessionId: string | null = null;
let requestId = 0;

/**
 * Initialize MCP session
 */
async function initializeSession(): Promise<void> {
    if (sessionId) return; // Already initialized

    const initResponse = await fetch(MCP_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/event-stream',
        },
        body: JSON.stringify({
            jsonrpc: '2.0',
            id: ++requestId,
            method: 'initialize',
            params: {
                protocolVersion: '2024-11-05',
                capabilities: {},
                clientInfo: { name: 'contractor-calc', version: '1.0.0' },
            },
        }),
    });

    if (!initResponse.ok) {
        throw new Error(`MCP init failed: ${initResponse.status}`);
    }

    // Extract session ID - handle case sensitivity
    sessionId = initResponse.headers.get('mcp-session-id') ||
        initResponse.headers.get('Mcp-Session-Id');

    if (!sessionId) {
        throw new Error('No session ID from MCP server');
    }

    await initResponse.text(); // Consume body (SSE format)

    // Send initialized notification
    await fetch(MCP_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/event-stream',
            'Mcp-Session-Id': sessionId,
        },
        body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'notifications/initialized',
            params: {},
        }),
    });
}

/**
 * Reset session (useful for error recovery)
 */
export function resetSession(): void {
    sessionId = null;
}

/**
 * Fetch WPI (All Commodities) from MoSPI MCP
 * 
 * @param year - Year (e.g., 2024)
 * @param month - Month (1-12)
 * @returns WPI value or null if not available
 */
export async function fetchWPI(year: number, month: number): Promise<number | null> {
    try {
        await initializeSession();

        const response = await fetch(MCP_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json, text/event-stream',
                'Mcp-Session-Id': sessionId!,
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: ++requestId,
                method: 'tools/call',
                params: {
                    name: '4_get_data',
                    arguments: {
                        dataset: 'WPI',
                        filters: {
                            year: year.toString(),
                            month_code: month.toString(),
                            major_group_code: '1000000000', // All Commodities
                        },
                    },
                },
            }),
        });

        if (!response.ok) {
            console.error(`[MCP] Request failed: ${response.status}`);
            return null;
        }

        // FastMCP 3.0 returns SSE format: "event: message\r\ndata: {...}\r\n\r\n"
        const text = await response.text();
        const lines = text.split(/\r?\n/);
        const dataLine = lines.find(l => l.startsWith('data: '));

        let data: Record<string, unknown>;

        if (dataLine) {
            const jsonStr = dataLine.slice(6).trim();
            data = JSON.parse(jsonStr);
        } else {
            console.error('[MCP] No data line in SSE response');
            return null;
        }

        // Check for JSON-RPC error
        if (data.error) {
            console.error('[MCP] JSON-RPC error:', data.error);
            return null;
        }

        if (!data.result) {
            return null;
        }

        const result = data.result as Record<string, unknown>;

        // Check for isError flag
        if (result.isError) {
            console.error('[MCP] Tool returned error');
            return null;
        }

        // Parse content array (standard MCP format)
        if (result.content && Array.isArray(result.content) && result.content.length > 0) {
            const content = result.content as Array<{ type?: string; text?: string }>;
            const textContent = content[0].text;

            if (!textContent) {
                return null;
            }

            const innerJson = JSON.parse(textContent);

            if (!innerJson.statusCode || !innerJson.data?.length) {
                return null;
            }

            return parseFloat(innerJson.data[0].index_value);
        }

        // Fallback: result might contain data directly
        if (result.data && Array.isArray(result.data)) {
            const directData = result.data as Array<{ index_value?: string }>;
            return parseFloat(directData[0]?.index_value || '');
        }

        return null;
    } catch (error) {
        console.error('[MCP] Fetch error:', error);
        resetSession();
        return null;
    }
}
