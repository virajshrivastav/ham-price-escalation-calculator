'use client';

import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { ToWords } from 'to-words';
import { format } from 'date-fns';
import { formatMonthDisplay } from '@/lib/formulas/base-month';
import { WPI_WEIGHT, CPI_WEIGHT, type HAMResult } from '@/lib/formulas/ham';
import type { ContractData } from '../ContractForm';
import type { BillData } from '../BillForm';

// Register Noto Sans for ₹ symbol support
// Using try-catch to handle network errors gracefully
try {
    Font.register({
        family: 'NotoSans',
        fonts: [
            {
                src: 'https://fonts.gstatic.com/s/notosans/v36/o-0bIpQlx3QUlC5A4PNB6Ryti20_6n1iPHjcz6L1SoM-jCpoiyD9A-9a6Vc.ttf',
                fontWeight: 400
            },
            {
                src: 'https://fonts.gstatic.com/s/notosans/v36/o-0bIpQlx3QUlC5A4PNB6Ryti20_6n1iPHjcz6L1SoM-jCpoiyAhBe9a6Vc.ttf',
                fontWeight: 700
            },
        ],
    });
} catch (e) {
    console.warn('Failed to register custom font, using Helvetica fallback');
}

// Use Helvetica as primary font (built-in, always works)
const FONT_FAMILY = 'Helvetica';

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: FONT_FAMILY,
        fontSize: 10,
        lineHeight: 1.5,
    },
    header: {
        textAlign: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 16,
        fontWeight: 700,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 10,
        color: '#666',
    },
    contractInfo: {
        marginBottom: 16,
        paddingBottom: 12,
        borderBottom: '1px solid #ddd',
    },
    contractName: {
        fontSize: 12,
        fontWeight: 700,
    },
    section: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: 700,
        marginBottom: 8,
        color: '#333',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    label: {
        width: '40%',
        color: '#666',
    },
    value: {
        width: '60%',
        fontWeight: 700,
    },
    table: {
        marginTop: 8,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f5f5f5',
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        paddingVertical: 6,
        paddingHorizontal: 8,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingVertical: 6,
        paddingHorizontal: 8,
    },
    tableCell: {
        flex: 1,
    },
    tableCellRight: {
        flex: 1,
        textAlign: 'right',
    },
    calculation: {
        backgroundColor: '#f9f9f9',
        padding: 12,
        marginTop: 8,
        fontFamily: 'Courier',
        fontSize: 9,
    },
    resultBox: {
        marginTop: 16,
        padding: 16,
        borderWidth: 2,
        borderColor: '#333',
    },
    resultRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    resultLabel: {
        color: '#666',
    },
    resultValue: {
        fontSize: 14,
        fontWeight: 700,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#ddd',
    },
    totalLabel: {
        fontSize: 12,
        fontWeight: 700,
    },
    totalValue: {
        fontSize: 16,
        fontWeight: 700,
    },
    amountInWords: {
        marginTop: 8,
        fontStyle: 'italic',
        color: '#333',
    },
    deEscalation: {
        color: '#c00',
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        fontSize: 8,
        color: '#999',
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 8,
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
});

interface PriceVariationStatementProps {
    contract: ContractData;
    bill: BillData;
    result: HAMResult;
}

export function PriceVariationStatement({ contract, bill, result }: PriceVariationStatementProps) {
    const toWords = new ToWords({
        localeCode: 'en-IN',
        converterOptions: {
            currency: true,
            ignoreDecimal: true,
            doNotAddOnly: false,
            currencyOptions: {
                name: 'Rupee',
                plural: 'Rupees',
                symbol: '₹',
                fractionalUnit: { name: 'Paisa', plural: 'Paise', symbol: '' },
            },
        },
    });

    const formatCurrency = (value: number) => {
        const absValue = Math.abs(value);
        return `₹ ${absValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
    };

    const amountInWordsText = toWords.convert(Math.abs(Math.round(result.totalAmount)));
    const escalationLabel = result.isDeEscalation
        ? 'De-escalation Amount (Deduction)'
        : 'Escalation Amount';

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>PRICE VARIATION STATEMENT</Text>
                    <Text style={styles.subtitle}>(As per MCA Clause 23.4 — HAM)</Text>
                </View>

                {/* Contract Info */}
                <View style={styles.contractInfo}>
                    <Text style={styles.contractName}>{contract.name}</Text>
                </View>

                {/* Key Dates */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Key Dates</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Bid Due Date:</Text>
                        <Text style={styles.value}>{format(contract.bidDueDate, 'dd MMM yyyy')}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Base Month:</Text>
                        <Text style={styles.value}>{formatMonthDisplay(contract.baseMonth)}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>IE Report Date:</Text>
                        <Text style={styles.value}>{format(bill.reportDate, 'dd MMM yyyy')}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Index Reference Month:</Text>
                        <Text style={styles.value}>{formatMonthDisplay(bill.currentMonth)}</Text>
                    </View>
                </View>

                {/* Index Values */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Index Values</Text>
                    <View style={styles.table}>
                        <View style={styles.tableHeader}>
                            <Text style={styles.tableCell}>Index</Text>
                            <Text style={styles.tableCellRight}>Base</Text>
                            <Text style={styles.tableCellRight}>Current</Text>
                            <Text style={styles.tableCell}>Source</Text>
                        </View>
                        <View style={styles.tableRow}>
                            <Text style={styles.tableCell}>WPI (All Commodities)</Text>
                            <Text style={styles.tableCellRight}>{bill.wpiBase.value.toFixed(1)}</Text>
                            <Text style={styles.tableCellRight}>{bill.wpiCurrent.value.toFixed(1)}</Text>
                            <Text style={styles.tableCell}>MoSPI API</Text>
                        </View>
                        <View style={styles.tableRow}>
                            <Text style={styles.tableCell}>CPI-IW (General)</Text>
                            <Text style={styles.tableCellRight}>{bill.cpiBase.value.toFixed(1)}</Text>
                            <Text style={styles.tableCellRight}>{bill.cpiCurrent.value.toFixed(1)}</Text>
                            <Text style={styles.tableCell}>Labour Bureau</Text>
                        </View>
                    </View>
                </View>

                {/* Calculation */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Calculation</Text>
                    <View style={styles.calculation}>
                        <Text>P₀ = ({WPI_WEIGHT} × {bill.wpiBase.value.toFixed(1)}) + ({CPI_WEIGHT} × {bill.cpiBase.value.toFixed(1)}) = {result.p0.toFixed(2)}</Text>
                        <Text>Pc = ({WPI_WEIGHT} × {bill.wpiCurrent.value.toFixed(1)}) + ({CPI_WEIGHT} × {bill.cpiCurrent.value.toFixed(1)}) = {result.pc.toFixed(2)}</Text>
                        <Text>PIM = {result.pc.toFixed(2)} / {result.p0.toFixed(2)} = {result.pim.toFixed(4)}</Text>
                    </View>
                </View>

                {/* Result */}
                <View style={styles.resultBox}>
                    <View style={styles.resultRow}>
                        <Text style={styles.resultLabel}>Work Done Value:</Text>
                        <Text style={styles.resultValue}>{formatCurrency(bill.workValue)}</Text>
                    </View>
                    <View style={styles.resultRow}>
                        <Text style={result.isDeEscalation ? [styles.resultLabel, styles.deEscalation] : styles.resultLabel}>
                            {escalationLabel}:
                        </Text>
                        <Text style={result.isDeEscalation ? [styles.resultValue, styles.deEscalation] : styles.resultValue}>
                            {result.isDeEscalation ? '-' : ''}{formatCurrency(result.escalationAmount)}
                        </Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>TOTAL PAYABLE:</Text>
                        <Text style={styles.totalValue}>{formatCurrency(result.totalAmount)}</Text>
                    </View>
                    <Text style={styles.amountInWords}>
                        {amountInWordsText}
                        {result.isDeEscalation ? ' (after Deduction)' : ''}
                    </Text>
                </View>

                {/* Provisional Notice */}
                {bill.isProvisional && (
                    <View style={{ marginTop: 12, padding: 8, backgroundColor: '#fffbeb' }}>
                        <Text style={{ fontSize: 9, color: '#92400e' }}>
                            * This statement is PROVISIONAL as one or more index values are estimated based on most recent available data.
                        </Text>
                    </View>
                )}

                {/* Footer */}
                <View style={styles.footer}>
                    <View style={styles.footerRow}>
                        <Text>Generated: {format(new Date(), 'dd-MMM-yyyy HH:mm')} IST</Text>
                        <Text>Tool: contractorcalc.in</Text>
                    </View>
                    <View style={styles.footerRow}>
                        <Text>Verify: eaindustry.nic.in | labourbureau.gov.in</Text>
                        <Text>PIM: {result.pim.toFixed(4)}</Text>
                    </View>
                </View>
            </Page>
        </Document>
    );
}
