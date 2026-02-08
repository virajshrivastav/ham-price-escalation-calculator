'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { getHAMBaseMonth, formatMonthDisplay } from '@/lib/formulas/base-month';
import { cn } from '@/lib/utils';

interface ContractFormProps {
    onComplete: (data: ContractData) => void;
}

export interface ContractData {
    name: string;
    bidDueDate: Date;
    baseMonth: string;
}

export function ContractForm({ onComplete }: ContractFormProps) {
    const [name, setName] = useState('');
    const [bidDueDate, setBidDueDate] = useState<Date | undefined>(undefined);
    const [baseMonth, setBaseMonth] = useState<string>('');
    const [calendarOpen, setCalendarOpen] = useState(false);

    // Calculate base month when bid date changes
    useEffect(() => {
        if (bidDueDate) {
            const month = getHAMBaseMonth(bidDueDate);
            setBaseMonth(month);
        } else {
            setBaseMonth('');
        }
    }, [bidDueDate]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !bidDueDate || !baseMonth) return;

        onComplete({
            name: name.trim(),
            bidDueDate,
            baseMonth,
        });
    };

    const isValid = name.trim().length > 0 && bidDueDate && baseMonth;

    return (
        <Card className="w-full max-w-lg">
            <CardHeader>
                <CardTitle className="text-xl">Step 1: Contract Details</CardTitle>
                <CardDescription>
                    Enter the contract name and bid due date
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Contract Name */}
                    <div className="space-y-2">
                        <Label htmlFor="contractName">Contract Name</Label>
                        <Input
                            id="contractName"
                            placeholder="e.g., NH-45 Widening Pkg-III"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="text-base"
                        />
                    </div>

                    {/* Bid Due Date */}
                    <div className="space-y-2">
                        <Label>Bid Due Date</Label>
                        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        'w-full justify-start text-left font-normal',
                                        !bidDueDate && 'text-muted-foreground'
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {bidDueDate ? format(bidDueDate, 'PPP') : 'Select date'}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={bidDueDate}
                                    onSelect={(date) => {
                                        setBidDueDate(date);
                                        setCalendarOpen(false);
                                    }}
                                    disabled={(date) => date > new Date()}
                                    captionLayout="dropdown"
                                    fromYear={2015}
                                    toYear={new Date().getFullYear()}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Base Month Display */}
                    {baseMonth && (
                        <div className="rounded-lg bg-muted p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Base Index Month</p>
                                    <p className="text-lg font-semibold">{formatMonthDisplay(baseMonth)}</p>
                                </div>
                                <Badge variant="secondary">
                                    Preceding month
                                </Badge>
                            </div>
                            <p className="mt-2 text-xs text-muted-foreground">
                                Per MCA Clause 23.2.3 — Base month is the month preceding the Bid Due Date
                            </p>
                        </div>
                    )}

                    {/* Submit Button */}
                    <Button type="submit" className="w-full" disabled={!isValid}>
                        Continue to Bill Details
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
