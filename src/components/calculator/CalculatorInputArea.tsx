"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";

type CalcParams = {
    alpha: number;
    power: string | null;
    sampleSize: number | null;
    mean: number;
    nullHypothesisMean: number;
    stdDev: number;
};

type ValidationErrors = {
    power?: string;
}

type CalculatorInputAreaProps = {
  params: CalcParams;
  onParamsChange: (params: CalcParams) => void;
  solveFor: string;
  onSolveForChange: (value: string) => void;
  onCalculate: () => void;
  errors: ValidationErrors;
};

export function CalculatorInputArea({ params, onParamsChange, solveFor, onSolveForChange, onCalculate, errors }: CalculatorInputAreaProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    onParamsChange({ ...params, [id]: value === '' ? null : Number(value) });
  };

  const handlePowerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onParamsChange({ ...params, power: e.target.value });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Solve for</Label>
        <RadioGroup value={solveFor} onValueChange={onSolveForChange} className="flex space-x-4 mt-2">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="power" id="r1" />
            <Label htmlFor="r1">Power</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="sampleSize" id="r2" />
            <Label htmlFor="r2">Sample Size</Label>
          </div>
        </RadioGroup>
      </div>
      <div>
        <Label htmlFor="alpha">Type I error rate (α)</Label>
        <Input id="alpha" type="number" value={params.alpha} onChange={handleChange} />
      </div>
      <div>
        <Label htmlFor="power">Power (1-β)</Label>
        <Input id="power" type="text" value={params.power ?? ''} onChange={handlePowerChange} disabled={solveFor === 'power'} />
        {errors.power && <p className="text-red-500 text-sm mt-1">{errors.power}</p>}
      </div>
      <div>
        <Label htmlFor="sampleSize">Sample Size (n)</Label>
        <Input id="sampleSize" type="number" value={params.sampleSize ?? ''} onChange={handleChange} disabled={solveFor === 'sampleSize'} />
      </div>
      <div>
        <Label htmlFor="mean">True mean (μ)</Label>
        <Input id="mean" type="number" value={params.mean} onChange={handleChange} />
      </div>
      <div>
        <Label htmlFor="nullHypothesisMean">Null Hypothesis mean (μ₀)</Label>
        <Input id="nullHypothesisMean" type="number" value={params.nullHypothesisMean} onChange={handleChange} />
      </div>
      <div>
        <Label htmlFor="stdDev">Standard Deviation (σ)</Label>
        <Input id="stdDev" type="number" value={params.stdDev} onChange={handleChange} />
      </div>
      <Button onClick={onCalculate} className="w-full cursor-pointer">
        Calculate
      </Button>
    </div>
  );
}
