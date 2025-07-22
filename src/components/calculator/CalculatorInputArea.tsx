"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

type InputField = {
  name: string;
  label: string;
  type: 'number' | 'text';
  solve?: 'power' | 'sampleSize';
};

type CalculatorInputAreaProps = {
  params: { [key: string]: any };
  onParamsChange: (params: { [key: string]: any }) => void;
  solveFor: string;
  onSolveForChange: (value: string) => void;
  onCalculate: () => void;
  errors: { [key: string]: string | undefined };
  inputFields: InputField[];
  solveForOptions?: { value: string; label: string }[];
};

export function CalculatorInputArea({ 
  params, 
  onParamsChange, 
  solveFor, 
  onSolveForChange, 
  onCalculate, 
  errors, 
  inputFields,
  solveForOptions
}: CalculatorInputAreaProps) {
    const isMobile = useIsMobile();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    const field = inputFields.find(f => f.name === id);
    
    let processedValue: string | number | null = value;
    if (value === '') {
      processedValue = null;
    } else if (field?.type === 'number') {
      processedValue = Number(value);
    }

    onParamsChange({ ...params, [id]: processedValue });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Solve for</Label>
        <RadioGroup value={solveFor} onValueChange={onSolveForChange} className="grid grid-cols-2 gap-4">
          {solveForOptions ? (
            solveForOptions.map(option => (
              <div key={option.value}>
                <RadioGroupItem value={option.value} id={option.value} className="peer sr-only" />
                <Label htmlFor={option.value} className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                  {option.label}
                </Label>
              </div>
            ))
          ) : (
            <>
              <div>
                <RadioGroupItem value="sampleSize" id="sampleSize" className="peer sr-only" />
                <Label htmlFor="sampleSize" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                  Sample Size
                </Label>
              </div>
              <div>
                <RadioGroupItem value="power" id="power" className="peer sr-only" />
                <Label htmlFor="power" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                  Power
                </Label>
              </div>
            </>
          )}
        </RadioGroup>
      </div>
      {inputFields.map(field => {
        const isDisabled = (solveFor === 'power' && field.solve === 'power') || (solveFor !== 'power' && field.solve === 'sampleSize');
        const isAlphaField = field.name === 'alpha'
        return (
          <div key={field.name}>
            <Label htmlFor={field.name}>{field.label}</Label>
            <Input 
              id={field.name} 
              type={field.type} 
              value={params[field.name] ?? ''} 
              onChange={handleChange} 
              disabled={isDisabled} 
              {...(isAlphaField && { step: "0.01", min: "0", max: "1" })}
            />
            {errors[field.name] && <p className="text-red-500 text-sm mt-1">{errors[field.name]}</p>}
          {/* after alpha field, add a divider */}
          {isAlphaField && <hr className="my-4" />}
          </div>
        );
      })}

      <Button onClick={onCalculate} className="w-full cursor-pointer">
        Calculate
      </Button>
    </div>
  );
}
