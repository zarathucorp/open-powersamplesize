"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";

type InputField = {
  name: string;
  label: string;
  type: 'number' | 'text';
};

type CalculatorInputAreaProps = {
  params: { [key: string]: any };
  onParamsChange: (params: { [key: string]: any }) => void;
  solveFor: string;
  onSolveForChange: (value: string) => void;
  onCalculate: () => void;
  errors: { [key: string]: string | undefined };
  inputFields: InputField[];
};

export function CalculatorInputArea({ 
  params, 
  onParamsChange, 
  solveFor, 
  onSolveForChange, 
  onCalculate, 
  errors, 
  inputFields,
}: CalculatorInputAreaProps) {
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

  const solveForOptions = [
    { value: 'power', label: 'Power' },
    { value: 'sampleSize', label: 'Sample Size' },
  ];

  return (
    <div className="space-y-4">
      <div>
        <Label>Solve for</Label>
        <RadioGroup value={solveFor} onValueChange={onSolveForChange} className="flex space-x-4 mt-2">
          {solveForOptions.map(option => (
            <div key={option.value} className="flex items-center space-x-2">
              <RadioGroupItem value={option.value} id={`r_${option.value}`} />
              <Label htmlFor={`r_${option.value}`}>{option.label}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>
      
      {inputFields.map(field => (
        <div key={field.name}>
          <Label htmlFor={field.name}>{field.label}</Label>
          <Input 
            id={field.name} 
            type={field.type} 
            value={params[field.name] ?? ''} 
            onChange={handleChange} 
            disabled={solveFor === field.name} 
          />
          {errors[field.name] && <p className="text-red-500 text-sm mt-1">{errors[field.name]}</p>}
        </div>
      ))}

      <Button onClick={onCalculate} className="w-full cursor-pointer">
        Calculate
      </Button>
    </div>
  );
}
