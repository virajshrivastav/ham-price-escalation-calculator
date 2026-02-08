'use client';

import { useState } from 'react';
import { ContractForm, type ContractData } from './components/ContractForm';
import { BillForm, type BillData } from './components/BillForm';
import { ResultsView } from './components/ResultsView';

type Step = 'contract' | 'bill' | 'results';

export default function Home() {
  const [step, setStep] = useState<Step>('contract');
  const [contract, setContract] = useState<ContractData | null>(null);
  const [bill, setBill] = useState<BillData | null>(null);

  const handleContractComplete = (data: ContractData) => {
    setContract(data);
    setStep('bill');
  };

  const handleBillComplete = (data: BillData) => {
    setBill(data);
    setStep('results');
  };

  const handleReset = () => {
    setStep('contract');
    setContract(null);
    setBill(null);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            HAM Price Escalation Calculator
          </h1>
          <p className="text-muted-foreground">
            Calculate price variation for Hybrid Annuity Model contracts
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <StepIndicator step={1} current={step === 'contract'} completed={!!contract} label="Contract" />
            <div className="w-12 h-px bg-border" />
            <StepIndicator step={2} current={step === 'bill'} completed={!!bill} label="Bill" />
            <div className="w-12 h-px bg-border" />
            <StepIndicator step={3} current={step === 'results'} completed={false} label="Result" />
          </div>
        </div>

        {/* Form Container */}
        <div className="flex justify-center">
          {step === 'contract' && (
            <ContractForm onComplete={handleContractComplete} />
          )}

          {step === 'bill' && contract && (
            <BillForm
              contract={contract}
              onComplete={handleBillComplete}
              onBack={() => setStep('contract')}
            />
          )}

          {step === 'results' && contract && bill && (
            <ResultsView
              contract={contract}
              bill={bill}
              onBack={() => setStep('bill')}
              onReset={handleReset}
            />
          )}
        </div>

        {/* Footer */}
        <footer className="text-center mt-12 text-sm text-muted-foreground">
          <p>
            Formula per MCA Clause 23.4 (HAM) • WPI from MoSPI API • CPI-IW from Labour Bureau
          </p>
        </footer>
      </div>
    </main>
  );
}

function StepIndicator({
  step,
  current,
  completed,
  label
}: {
  step: number;
  current: boolean;
  completed: boolean;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`
          w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
          ${current ? 'bg-primary text-primary-foreground' : ''}
          ${completed && !current ? 'bg-primary/20 text-primary' : ''}
          ${!current && !completed ? 'bg-muted text-muted-foreground' : ''}
        `}
      >
        {completed && !current ? '✓' : step}
      </div>
      <span className={`text-xs ${current ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
        {label}
      </span>
    </div>
  );
}
