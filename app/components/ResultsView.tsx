'use client';

import { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, ArrowLeft, TrendingUp, TrendingDown, AlertTriangle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { formatMonthDisplay } from '@/lib/formulas/base-month';
import { calculateHAM, WPI_WEIGHT, CPI_WEIGHT, type HAMResult } from '@/lib/formulas/ham';
import { PriceVariationStatement } from './pdf/PriceVariationStatement';
import type { ContractData } from './ContractForm';
import type { BillData } from './BillForm';

interface ResultsViewProps {
    contract: ContractData;
    bill: BillData;
    onBack: () => void;
    onReset: () => void;
}

export function ResultsView({ contract, bill, onBack, onReset }: ResultsViewProps) {
    const [downloading, setDownloading] = useState(false);

    // Calculate HAM result
    const result: HAMResult = calculateHAM(bill.workValue, {
        wpiBase: bill.wpiBase.value,
        cpiBase: bill.cpiBase.value,
        wpiCurrent: bill.wpiCurrent.value,
        cpiCurrent: bill.cpiCurrent.value,
    });

    const formatCurrency = (value: number) => {
        const absValue = Math.abs(value);
        const formatted = absValue.toLocaleString('en-IN', {
            maximumFractionDigits: 0,
            style: 'currency',
            currency: 'INR',
        });
        return result.isDeEscalation && value !== 0 ? `-${formatted}` : formatted;
    };

    const handleDownloadPDF = async () => {
        setDownloading(true);
        try {
            const blob = await pdf(
                <PriceVariationStatement
                    contract={contract}
                    bill={bill}
                    result={result}
                />
            ).toBlob();

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;

            // Generate filename
            const contractSlug = contract.name.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 30);
            const dateStr = format(bill.reportDate, 'yyyy-MM-dd');
            link.download = `PriceVariation-${contractSlug}-${dateStr}.pdf`;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('PDF generation failed:', error);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            setDownloading(false);
        }
    };

    return (
        <Card className="w-full max-w-2xl">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="text-xl">Price Variation Statement</CardTitle>
                        <CardDescription>{contract.name}</CardDescription>
                    </div>
                    {bill.isProvisional && (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Provisional
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Key Dates */}
                <div>
                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
                        Key Dates
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-muted-foreground">Bid Due Date</p>
                            <p className="font-medium">{format(contract.bidDueDate, 'dd MMM yyyy')}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Base Month</p>
                            <p className="font-medium">{formatMonthDisplay(contract.baseMonth)}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">IE Report Date</p>
                            <p className="font-medium">{format(bill.reportDate, 'dd MMM yyyy')}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Index Reference Month</p>
                            <p className="font-medium">{formatMonthDisplay(bill.currentMonth)}</p>
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Index Values Table */}
                <div>
                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
                        Index Values
                    </h4>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Index</TableHead>
                                <TableHead className="text-right">Base</TableHead>
                                <TableHead className="text-right">Current</TableHead>
                                <TableHead>Source</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell className="font-medium">WPI (All Commodities)</TableCell>
                                <TableCell className="text-right font-mono">{bill.wpiBase.value.toFixed(1)}</TableCell>
                                <TableCell className="text-right font-mono">{bill.wpiCurrent.value.toFixed(1)}</TableCell>
                                <TableCell className="text-muted-foreground text-sm">MoSPI API</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">CPI-IW (General)</TableCell>
                                <TableCell className="text-right font-mono">{bill.cpiBase.value.toFixed(1)}</TableCell>
                                <TableCell className="text-right font-mono">{bill.cpiCurrent.value.toFixed(1)}</TableCell>
                                <TableCell className="text-muted-foreground text-sm">Labour Bureau</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>

                <Separator />

                {/* Calculation Breakdown */}
                <div>
                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
                        Calculation (HAM Formula)
                    </h4>
                    <div className="space-y-2 text-sm font-mono bg-muted rounded-lg p-4">
                        <p>
                            P₀ = ({WPI_WEIGHT} × {bill.wpiBase.value.toFixed(1)}) + ({CPI_WEIGHT} × {bill.cpiBase.value.toFixed(1)}) = <strong>{result.p0.toFixed(2)}</strong>
                        </p>
                        <p>
                            Pc = ({WPI_WEIGHT} × {bill.wpiCurrent.value.toFixed(1)}) + ({CPI_WEIGHT} × {bill.cpiCurrent.value.toFixed(1)}) = <strong>{result.pc.toFixed(2)}</strong>
                        </p>
                        <p>
                            PIM = {result.pc.toFixed(2)} / {result.p0.toFixed(2)} = <strong className="text-lg">{result.pim.toFixed(4)}</strong>
                        </p>
                    </div>
                </div>

                <Separator />

                {/* Result */}
                <div className="rounded-lg border-2 p-4 sm:p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div>
                            <p className="text-sm text-muted-foreground">Work Done Value</p>
                            <p className="text-2xl font-bold">{formatCurrency(bill.workValue)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                                {result.isDeEscalation ? (
                                    <>
                                        <TrendingDown className="w-4 h-4 text-red-500" />
                                        De-escalation (Deduction)
                                    </>
                                ) : (
                                    <>
                                        <TrendingUp className="w-4 h-4 text-green-500" />
                                        Escalation Amount
                                    </>
                                )}
                            </p>
                            <p className={`text-2xl font-bold ${result.isDeEscalation ? 'text-red-600' : 'text-green-600'}`}>
                                {formatCurrency(result.escalationAmount)}
                            </p>
                        </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Total Payable</p>
                            <p className="text-3xl font-bold">{formatCurrency(result.totalAmount)}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-muted-foreground">PIM</p>
                            <p className="text-3xl font-bold font-mono">{result.pim.toFixed(2)}</p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <Button variant="outline" onClick={onBack} className="flex-1">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Edit Bill
                    </Button>
                    <Button className="flex-1" onClick={handleDownloadPDF} disabled={downloading}>
                        {downloading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Download className="w-4 h-4 mr-2" />
                        )}
                        {downloading ? 'Generating...' : 'Download PDF'}
                    </Button>
                </div>

                <div className="text-center">
                    <Button variant="link" onClick={onReset} className="text-muted-foreground">
                        Start New Calculation
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
