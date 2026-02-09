'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CalendarIcon, Loader2, AlertTriangle, CheckCircle2, Zap, Database } from 'lucide-react';
import { format } from 'date-fns';
import { getHAMCurrentMonth, formatMonthDisplay, parseMonthString } from '@/lib/formulas/base-month';
import { cn } from '@/lib/utils';
import type { ContractData } from './ContractForm';

interface BillFormProps {
    contract: ContractData;
    onComplete: (data: BillData) => void;
    onBack: () => void;
}

export interface IndexData {
    value: number;
    source: 'cache' | 'mcp' | 'seed';
    isEstimate: boolean;
    estimateSource?: string;
}

export interface BillData {
    reportDate: Date;
    currentMonth: string;
    workValue: number;
    wpiBase: IndexData;
    wpiCurrent: IndexData;
    cpiBase: IndexData;
    cpiCurrent: IndexData;
    isProvisional: boolean;
}

export function BillForm({ contract, onComplete, onBack }: BillFormProps) {
    const [reportDate, setReportDate] = useState<Date | undefined>(undefined);
    const [currentMonth, setCurrentMonth] = useState<string>('');
    const [workValue, setWorkValue] = useState<string>('');
    const [calendarOpen, setCalendarOpen] = useState(false);

    // Index states
    const [wpiBase, setWpiBase] = useState<IndexData | null>(null);
    const [wpiCurrent, setWpiCurrent] = useState<IndexData | null>(null);
    const [cpiBase, setCpiBase] = useState<IndexData | null>(null);
    const [cpiCurrent, setCpiCurrent] = useState<IndexData | null>(null);

    // Loading states
    const [loadingBase, setLoadingBase] = useState(false);
    const [loadingCurrent, setLoadingCurrent] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Calculate current month when report date changes
    useEffect(() => {
        if (reportDate) {
            const month = getHAMCurrentMonth(reportDate);
            setCurrentMonth(month);
        } else {
            setCurrentMonth('');
        }
    }, [reportDate]);

    // Fetch base indices when component mounts or contract changes
    const fetchBaseIndices = useCallback(async () => {
        if (!contract.baseMonth) return;

        setLoadingBase(true);
        setError(null);

        try {
            const { year, month } = parseMonthString(contract.baseMonth);
            const res = await fetch(`/api/indices?year=${year}&month=${month}`);
            const data = await res.json();

            if (data.error) throw new Error(data.error);

            if (data.wpi) setWpiBase(data.wpi);
            if (data.cpi) setCpiBase(data.cpi);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch base indices');
        } finally {
            setLoadingBase(false);
        }
    }, [contract.baseMonth]);

    useEffect(() => {
        fetchBaseIndices();
    }, [fetchBaseIndices]);

    // Fetch current indices when current month changes
    const fetchCurrentIndices = useCallback(async () => {
        if (!currentMonth) return;

        setLoadingCurrent(true);
        setError(null);

        try {
            const { year, month } = parseMonthString(currentMonth);
            const res = await fetch(`/api/indices?year=${year}&month=${month}`);
            const data = await res.json();

            if (data.error) throw new Error(data.error);

            if (data.wpi) setWpiCurrent(data.wpi);
            if (data.cpi) setCpiCurrent(data.cpi);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch current indices');
        } finally {
            setLoadingCurrent(false);
        }
    }, [currentMonth]);

    useEffect(() => {
        if (currentMonth) {
            fetchCurrentIndices();
        }
    }, [currentMonth, fetchCurrentIndices]);

    // Parse work value (handles Indian number format with commas)
    const parseWorkValue = (val: string): number => {
        const cleaned = val.replace(/,/g, '').replace(/₹/g, '').trim();
        return parseFloat(cleaned) || 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValid) return;

        const isProvisional =
            wpiBase?.isEstimate ||
            wpiCurrent?.isEstimate ||
            cpiBase?.isEstimate ||
            cpiCurrent?.isEstimate ||
            false;

        onComplete({
            reportDate: reportDate!,
            currentMonth,
            workValue: parseWorkValue(workValue),
            wpiBase: wpiBase!,
            wpiCurrent: wpiCurrent!,
            cpiBase: cpiBase!,
            cpiCurrent: cpiCurrent!,
            isProvisional,
        });
    };

    const isLoading = loadingBase || loadingCurrent;
    const hasAllIndices = wpiBase && wpiCurrent && cpiBase && cpiCurrent;
    const isValid = reportDate && currentMonth && parseWorkValue(workValue) > 0 && hasAllIndices;

    const IndexBadge = ({ data, label }: { data: IndexData | null; label: string }) => {
        if (!data) return null;

        const getBadge = () => {
            if (data.isEstimate) {
                return (
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Estimated
                    </Badge>
                );
            }

            switch (data.source) {
                case 'mcp':
                    return (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                            <Zap className="w-3 h-3 mr-1" />
                            Live
                        </Badge>
                    );
                case 'seed':
                    return (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Official
                        </Badge>
                    );
                case 'cache':
                default:
                    return (
                        <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-300">
                            <Database className="w-3 h-3 mr-1" />
                            Cached
                        </Badge>
                    );
            }
        };

        return (
            <div className="flex items-center gap-2">
                <span className="font-mono text-lg">{data.value.toFixed(1)}</span>
                {getBadge()}
            </div>
        );
    };

    return (
        <Card className="w-full max-w-lg">
            <CardHeader>
                <CardTitle className="text-xl">Step 2: Bill Details</CardTitle>
                <CardDescription>
                    Enter the IE report date and work value
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Contract Summary */}
                    <div className="rounded-lg bg-muted p-3 text-sm">
                        <p className="font-medium">{contract.name}</p>
                        <p className="text-muted-foreground">
                            Base Month: {formatMonthDisplay(contract.baseMonth)}
                        </p>
                    </div>

                    {/* IE Report Date */}
                    <div className="space-y-2">
                        <Label>IE Report / Invoice Date</Label>
                        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        'w-full justify-start text-left font-normal',
                                        !reportDate && 'text-muted-foreground'
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {reportDate ? format(reportDate, 'PPP') : 'Select date'}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={reportDate}
                                    onSelect={(date) => {
                                        setReportDate(date);
                                        setCalendarOpen(false);
                                    }}
                                    disabled={(date) => date < contract.bidDueDate}
                                    captionLayout="dropdown"
                                    fromYear={2015}
                                    toYear={new Date().getFullYear() + 1}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                        {currentMonth && (
                            <p className="text-sm text-muted-foreground">
                                Index Reference Month: <strong>{formatMonthDisplay(currentMonth)}</strong>
                            </p>
                        )}
                    </div>

                    {/* Work Value */}
                    <div className="space-y-2">
                        <Label htmlFor="workValue">Work Done Value (₹)</Label>
                        <Input
                            id="workValue"
                            placeholder="e.g., 87,45,000"
                            value={workValue}
                            onChange={(e) => setWorkValue(e.target.value)}
                            className="text-base font-mono"
                        />
                        {parseWorkValue(workValue) > 0 && (
                            <p className="text-sm text-muted-foreground">
                                ₹ {parseWorkValue(workValue).toLocaleString('en-IN')}
                            </p>
                        )}
                    </div>

                    <Separator />

                    {/* Index Values */}
                    <div className="space-y-4">
                        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                            Index Values
                        </h4>

                        {isLoading && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Fetching indices...</span>
                            </div>
                        )}

                        {error && (
                            <div className="rounded-lg bg-red-50 p-3 text-red-700 text-sm">
                                {error}
                            </div>
                        )}

                        {!isLoading && hasAllIndices && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">WPI Base ({formatMonthDisplay(contract.baseMonth)})</p>
                                    <IndexBadge data={wpiBase} label="WPI Base" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">WPI Current ({currentMonth ? formatMonthDisplay(currentMonth) : '—'})</p>
                                    <IndexBadge data={wpiCurrent} label="WPI Current" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">CPI-IW Base ({formatMonthDisplay(contract.baseMonth)})</p>
                                    <IndexBadge data={cpiBase} label="CPI Base" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">CPI-IW Current ({currentMonth ? formatMonthDisplay(currentMonth) : '—'})</p>
                                    <IndexBadge data={cpiCurrent} label="CPI Current" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3">
                        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
                            Back
                        </Button>
                        <Button type="submit" className="flex-1" disabled={!isValid || isLoading}>
                            Calculate Escalation
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
