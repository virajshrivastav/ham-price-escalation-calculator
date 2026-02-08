/**
 * Base Month Calculation for HAM Contracts
 * 
 * Rules per MCA Clause 23.2.3 + Article 42:
 * - Base Month = preceding month of the Bid Due Date
 * - Current Month = preceding month of IE Report/Invoice Date
 */

/**
 * Get base month for HAM contracts (preceding month of bid due date)
 * @param bidDueDate - The bid due date
 * @returns Month string in format 'YYYY-MM'
 */
export function getHAMBaseMonth(bidDueDate: Date): string {
    const d = new Date(bidDueDate);
    d.setMonth(d.getMonth() - 1);
    const year = d.getFullYear();
    const month = d.getMonth() + 1; // getMonth() is 0-indexed
    return `${year}-${String(month).padStart(2, '0')}`;
}

/**
 * Get current month for HAM contracts (preceding month of IE report date)
 * @param ieReportDate - The IE report or invoice date
 * @returns Month string in format 'YYYY-MM'
 */
export function getHAMCurrentMonth(ieReportDate: Date): string {
    const d = new Date(ieReportDate);
    d.setMonth(d.getMonth() - 1);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    return `${year}-${String(month).padStart(2, '0')}`;
}

/**
 * Parse month string to year and month components
 * @param monthStr - Month string in format 'YYYY-MM'
 * @returns Object with year and month numbers
 */
export function parseMonthString(monthStr: string): { year: number; month: number } {
    const [yearStr, monthNumStr] = monthStr.split('-');
    return {
        year: parseInt(yearStr, 10),
        month: parseInt(monthNumStr, 10),
    };
}

/**
 * Format month string for display
 * @param monthStr - Month string in format 'YYYY-MM'
 * @returns Human-readable format like 'March 2022'
 */
export function formatMonthDisplay(monthStr: string): string {
    const { year, month } = parseMonthString(monthStr);
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `${monthNames[month - 1]} ${year}`;
}

/**
 * Get the most recent available month before a target month
 * Used for fallback when data is not yet published
 * @param targetMonth - Target month string in format 'YYYY-MM'
 * @param availableMonths - Array of available month strings
 * @returns Most recent month before target, or null if none
 */
export function getMostRecentAvailableMonth(
    targetMonth: string,
    availableMonths: string[]
): string | null {
    const sorted = availableMonths
        .filter(m => m < targetMonth)
        .sort((a, b) => b.localeCompare(a));
    return sorted[0] || null;
}
