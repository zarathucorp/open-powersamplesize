"use client";

import { useState, useEffect, useCallback } from "react";
import { jStat } from "jstat";
import { CalculatorInputArea } from "@/components/calculator/CalculatorInputArea";
import { PlotSection } from "@/components/calculator/PlotSection";
import { DescriptionSection } from "@/components/calculator/DescriptionSection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// 계산기에 필요한 파라미터를 정의합니다.
type CalcParams = {
    alpha: number;
    power: string | null;
    sampleSize: number | null;
    p: number | null;
    p0: number | null;
    delta: number | null;
};

type PlotDataPoint = {
    [key: string]: number | null;
};

type ValidationErrors = {
    power?: string;
    p?: string;
    p0?: string;
    delta?: string;
    general?: string;
};

// 계산기 페이지에 맞게 컴포넌트 이름을 변경합니다.
export default function Test1ProportionEquivalence() {
    const [solveFor, setSolveFor] = useState<string>("sampleSize");
    // 초기 파라미터 값을 설정합니다.
    const [params, setParams] = useState<CalcParams>({
        power: "0.8000",
        sampleSize: 52,
        alpha: 0.05,
        p: 0.6,
        p0: 0.6,
        delta: 0.2,
    });
    const [plotData, setPlotData] = useState<PlotDataPoint[]>([]);
    const [xAxisVar, setXAxisVar] = useState<string>("p"); // 기본 x축 변수를 설정합니다.
    const [xAxisMin, setXAxisMin] = useState<number>(0.1); // Default
    const [xAxisMax, setXAxisMax] = useState<number>(0.3); // Default
    const [yAxisVars, setYAxisVars] = useState<string[]>([]);
    const [lineColors, setLineColors] = useState<{ [key: string]: string }>({});
    const [errors, setErrors] = useState<ValidationErrors>({});

    useEffect(() => {
        const { p, p0, delta } = params;
        if (xAxisVar === 'p') {
            if (p) {
                setXAxisMin(Math.max(0.01, p * 0.5));
                setXAxisMax(Math.min(0.99, p * 1.5));
            }
        } else if (xAxisVar === 'p0') {
            if (p0) {
                setXAxisMin(Math.max(0.01, p0 * 0.5));
                setXAxisMax(Math.min(0.99, p0 * 1.5));
            }
        } else if (xAxisVar === 'delta') {
            if (delta) {
                setXAxisMin(Math.max(0.01, delta * 0.5));
                setXAxisMax(Math.min(0.99, delta * 1.5));
            }
        }
    }, [xAxisVar, params]);

    const validate = () => {
        const newErrors: ValidationErrors = {};
        const { power, p, p0, delta } = params;
        if (power) {
            const powerValue = parseFloat(power);
            if (powerValue <= 0 || powerValue >= 1) {
                newErrors.power = "Power must be between 0 and 1.";
            }
        }
        if (p === null || p <= 0 || p >= 1) {
            newErrors.p = "Proportion (p) must be between 0 and 1.";
        }
        if (p0 === null || p0 <= 0 || p0 >= 1) {
            newErrors.p0 = "Comparison Proportion (p0) must be between 0 and 1.";
        }
        if (delta === null || delta <= 0) {
            newErrors.delta = "Margin of Equivalence (δ) must be positive.";
        }
        if (p !== null && p0 !== null && delta !== null && Math.abs(p - p0) >= delta) {
            newErrors.general = "|p - p0| must be less than δ for equivalence.";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const updatePlotData = useCallback(() => {
        const { alpha, power, p, p0, delta } = params;
        if (p === null || p0 === null || delta === null) return;

        const data = [];

        const powerValue = power ? parseFloat(power) : null;
        const powerScenarios: { name: string, value: number }[] = [];
        const colors = ['#8884d8', '#82ca9d', '#ffc658'];
        const newColors: { [key: string]: string } = {};

        if (powerValue && powerValue > 0 && powerValue < 1) {
            const powerName = `${(powerValue * 100).toFixed(2)}%`;
            powerScenarios.push({ name: powerName, value: powerValue });
        }

        [0.9, 0.7].forEach(val => {
            if (powerScenarios.length < 3 && !powerScenarios.some(s => s.value === val)) {
                powerScenarios.push({ name: `${(val * 100).toFixed(2)}%`, value: val });
            }
        });

        powerScenarios.forEach((scenario, i) => {
            newColors[scenario.name] = colors[i % colors.length];
        });

        setYAxisVars(powerScenarios.map(s => s.name));
        setLineColors(newColors);

        for (let i = 0; i < 100; i++) {
            const x = xAxisMin + (xAxisMax - xAxisMin) * (i / 99);
            const point: PlotDataPoint = { [xAxisVar]: x };
            
            powerScenarios.forEach(scenario => {
                let sampleSize: number | null = null;
                
                let currentP = p;
                let currentP0 = p0;
                let currentDelta = delta;

                if (xAxisVar === 'p') currentP = x;
                if (xAxisVar === 'p0') currentP0 = x;
                if (xAxisVar === 'delta') currentDelta = x;
                
                if (currentP !== null && currentP > 0 && currentP < 1 && 
                    currentP0 !== null && currentP0 > 0 && currentP0 < 1 &&
                    currentDelta !== null && currentDelta > 0 &&
                    Math.abs(currentP - currentP0) < currentDelta) {
                    
                    const z_alpha = jStat.normal.inv(1 - alpha, 0, 1);
                    const beta = 1 - scenario.value;
                    const z_beta_2 = jStat.normal.inv(1 - beta / 2, 0, 1);
                    const numerator = z_alpha + z_beta_2;
                    const denominator = Math.abs(currentP - currentP0) - currentDelta;
                    
                    if (denominator !== 0) {
                        const calculatedN = currentP * (1 - currentP) * Math.pow(numerator / denominator, 2);
                        sampleSize = Math.ceil(calculatedN);
                    }
                }
                
                point[scenario.name] = sampleSize && sampleSize > 0 ? sampleSize : null;
            });
            data.push(point);
        }
        setPlotData(data);
    }, [params, xAxisMin, xAxisMax, xAxisVar]);

    const handleCalculate = () => {
        if (!validate()) return;

        const { alpha, power, sampleSize, p, p0, delta } = params;
        
        if (solveFor === 'power') {
            if (sampleSize && sampleSize > 0 && p && p0 && delta) {
                const z_alpha = jStat.normal.inv(1 - alpha, 0, 1);
                const z = (Math.abs(p - p0) - delta) / Math.sqrt(p * (1 - p) / sampleSize);
                const calculatedPower = 2 * (jStat.normal.cdf(z - z_alpha, 0, 1) + jStat.normal.cdf(-z - z_alpha, 0, 1)) - 1;
                const formattedPower = calculatedPower.toFixed(4);
                if (params.power !== formattedPower) {
                    setParams(p => ({ ...p, power: formattedPower }));
                }
            } else {
                setParams(p => ({...p, power: null}));
            }
        } else { // solveFor === 'sampleSize'
            const powerValue = power ? parseFloat(power) : null;
            if (powerValue && powerValue > 0 && powerValue < 1 && p && p0 && delta) {
                const z_alpha = jStat.normal.inv(1 - alpha, 0, 1);
                const beta = 1 - powerValue;
                const z_beta_2 = jStat.normal.inv(1 - beta / 2, 0, 1);
                const numerator = z_alpha + z_beta_2;
                const denominator = Math.abs(p - p0) - delta;
                const calculatedSize = p * (1 - p) * Math.pow(numerator / denominator, 2);
                const finalSize = Math.ceil(calculatedSize);
                if (params.sampleSize !== finalSize) {
                    setParams(p => ({ ...p, sampleSize: finalSize }));
                }
            } else {
                setParams(p => ({...p, sampleSize: null}));
            }
        }
        updatePlotData();
    };

    useEffect(() => {
        updatePlotData();
    }, [updatePlotData]);

    const handleParamsChange = (newParams: { [key: string]: string | number | null }) => {
        setParams(prevParams => ({ ...prevParams, ...newParams }));
    };

    const inputFields = [
        { name: 'power', label: 'Power (1-β)', type: 'text' as const, solve: 'power' as const },
        { name: 'alpha', label: 'Type I error rate (α)', type: 'number' as const },
        { name: 'sampleSize', label: 'Sample Size (n)', type: 'number' as const, solve: 'sampleSize' as const },
        { name: 'p', label: 'True Proportion (p)', type: 'number' as const },
        { name: 'p0', label: 'Null Hypothesis Proportion (p0)', type: 'number' as const },
        { name: 'delta', label: 'Non-inferiority or Superiority Margin (δ)', type: 'number' as const },
    ];

    const xAxisOptions = inputFields
        .filter(field => !['alpha', 'power', 'sampleSize'].includes(field.name))
        .map(field => ({ value: field.name, label: field.label }));

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle>Inputs</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CalculatorInputArea
                                params={params}
                                onParamsChange={handleParamsChange}
                                solveFor={solveFor}
                                onSolveForChange={setSolveFor}
                                onCalculate={handleCalculate}
                                errors={errors}
                                inputFields={inputFields}
                            />
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-2">
                     <Card>
                        <CardContent className="pt-6">
                            <PlotSection 
                                plotData={plotData}
                                xAxisVar={xAxisVar}
                                onXAxisVarChange={setXAxisVar}
                                xAxisMin={xAxisMin}
                                onXAxisMinChange={setXAxisMin}
                                xAxisMax={xAxisMax}
                                onXAxisMaxChange={setXAxisMax}
                                yAxisLabel="Sample Size (n)"
                                yAxisVars={yAxisVars}
                                lineColors={lineColors}
                                xAxisOptions={xAxisOptions}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div>
                {/* TODO: 설명, 수식, R 코드, 참고 문헌을 업데이트하세요. */}
                <DescriptionSection
                    title="Calculate Sample Size Needed to Test 1 Proportion: 1-Sample Equivalence"
                    summary={`This calculator is useful when we wish to test whether a proportion, $p$, is different from a gold standard reference value, $p_0$. For example, we may wish to test whether a new product is equivalent to an existing, industry standard product. Here, the 'burden of proof', so to speak, falls on the new product; that is, equivalence is actually represented by the alternative, rather than the null hypothesis.

$H_0: |p - p_0| \\ge \\delta$
$H_1: |p - p_0| < \\delta$`}  // 수식에는 React LaTeX를 사용하세요.
                    formulas={`This calculator uses the following formulas to compute sample size and power, respectively:
                       $n = p(1-p) \\left( \\frac{z_{1-\\alpha} + z_{1-\\beta/2}}{|p - p_0| - \\delta} \\right)^2$
$1 - \\beta = 2 \\left[ \\Phi \\left( z - z_{1-\\alpha} \\right) + \\Phi \\left( -z - z_{1-\\alpha} \\right) \\right] - 1 \\quad , \\quad z = \\frac{|p - p_0| - \\delta}{\\sqrt{\\frac{p(1-p)}{n}}}$ 
where

$n$ is sample size
$p_0$ is the comparison value
$\\Phi$ is the standard Normal distribution function
$\\Phi^{-1}$ is the standard Normal quantile function
$\\alpha$ is Type I error
$\\beta$ is Type II error, meaning $1-\\beta$ is power
$\\delta$ is the testing margin`}  // 수식에는 React LaTeX를 사용하세요.
                    rCode={`p=0.6
p0=0.6
delta=0.2
alpha=0.05
beta=0.20(n=p*(1-p)*((qnorm(1-alpha)+qnorm(1-beta/2))/(abs(p-p0)-delta))^2)
ceiling(n) # 52
z=(abs(p-p0)-delta)/sqrt(p*(1-p)/n)(Power=2*(pnorm(z-qnorm(1-alpha))+pnorm(-z-qnorm(1-alpha)))-1)`}
                    references={[
                        "Chow S, Shao J, Wang H. 2008. Sample Size Calculations in Clinical Research. 2nd Ed. Chapman & Hall/CRC Biostatistics Series. page 87."
                    ]}
                />
            </div>
        </div>
    );
}
