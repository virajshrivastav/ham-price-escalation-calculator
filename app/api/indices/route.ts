import { NextResponse } from 'next/server';
import { getIndicesForMonth } from '@/lib/index-service';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const year = parseInt(searchParams.get('year') || '0', 10);
        const month = parseInt(searchParams.get('month') || '0', 10);

        if (!year || !month || month < 1 || month > 12) {
            return NextResponse.json(
                { error: 'Invalid year or month' },
                { status: 400 }
            );
        }

        const { wpi, cpi } = await getIndicesForMonth(year, month);

        return NextResponse.json({
            wpi,
            cpi,
            year,
            month,
        });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch indices' },
            { status: 500 }
        );
    }
}
