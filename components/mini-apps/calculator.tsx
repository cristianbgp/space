"use client";

import { useState } from "react";

export function Calculator() {
  const [display, setDisplay] = useState("0");
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForNewValue, setWaitingForNewValue] = useState(false);

  const inputNumber = (num: string) => {
    if (waitingForNewValue) {
      setDisplay(num);
      setWaitingForNewValue(false);
    } else {
      setDisplay(display === "0" ? num : display + num);
    }
  };

  const inputOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      const newValue = calculate(currentValue, inputValue, operation);

      setDisplay(String(newValue));
      setPreviousValue(newValue);
    }

    setWaitingForNewValue(true);
    setOperation(nextOperation);
  };

  const calculate = (firstValue: number, secondValue: number, operation: string): number => {
    switch (operation) {
      case "+":
        return firstValue + secondValue;
      case "-":
        return firstValue - secondValue;
      case "×":
        return firstValue * secondValue;
      case "÷":
        return firstValue / secondValue;
      default:
        return secondValue;
    }
  };

  const performCalculation = () => {
    if (previousValue !== null && operation) {
      const inputValue = parseFloat(display);
      const newValue = calculate(previousValue, inputValue, operation);

      setDisplay(String(newValue));
      setPreviousValue(null);
      setOperation(null);
      setWaitingForNewValue(true);
    }
  };

  const clear = () => {
    setDisplay("0");
    setPreviousValue(null);
    setOperation(null);
    setWaitingForNewValue(false);
  };

  const Button = ({
    onClick,
    className = "",
    children,
  }: {
    onClick: () => void;
    className?: string;
    children: React.ReactNode;
  }) => (
    <button
      onClick={onClick}
      className={`flex items-center justify-center rounded-lg border border-border bg-muted/50 text-sm font-medium transition-colors hover:bg-muted active:scale-95 ${className}`}
    >
      {children}
    </button>
  );

  return (
    <div className="flex h-full flex-col bg-card p-4">
      <div className="mb-4 flex h-16 items-center justify-end rounded-lg border border-border bg-background px-4 text-right text-2xl font-mono font-semibold">
        {display}
      </div>
      <div className="grid grid-cols-4 gap-2 flex-1">
        <Button onClick={clear} className="col-span-2 bg-muted">
          Clear
        </Button>
        <Button onClick={() => inputOperation("÷")} className="bg-foreground/10">
          ÷
        </Button>
        <Button onClick={() => inputOperation("×")} className="bg-foreground/10">
          ×
        </Button>

        <Button onClick={() => inputNumber("7")}>7</Button>
        <Button onClick={() => inputNumber("8")}>8</Button>
        <Button onClick={() => inputNumber("9")}>9</Button>
        <Button onClick={() => inputOperation("-")} className="bg-foreground/10">
          −
        </Button>

        <Button onClick={() => inputNumber("4")}>4</Button>
        <Button onClick={() => inputNumber("5")}>5</Button>
        <Button onClick={() => inputNumber("6")}>6</Button>
        <Button onClick={() => inputOperation("+")} className="bg-foreground/10">
          +
        </Button>

        <Button onClick={() => inputNumber("1")}>1</Button>
        <Button onClick={() => inputNumber("2")}>2</Button>
        <Button onClick={() => inputNumber("3")}>3</Button>
        <Button
          onClick={performCalculation}
          className="row-span-2 bg-foreground text-background"
        >
          =
        </Button>

        <Button onClick={() => inputNumber("0")} className="col-span-2">
          0
        </Button>
        <Button onClick={() => inputNumber(".")}>.</Button>
      </div>
    </div>
  );
}

