"use client";

import { useState, useEffect, useCallback } from "react";
import { jStat } from "jstat";
import { CalculatorInputArea } from "@/components/calculator/CalculatorInputArea";
import { PlotSection } from "@/components/calculator/PlotSection";
import { DescriptionSection } from "@/components/calculator/DescriptionSection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type CalcParams = {
    alpha: number;
    power: string | null;
    sampleSize: number | null;
    p: number;
    p0: number;
    delta: number;
};

type PlotDataPoint = {
    [key: string]: number | null;
};

type ValidationErrors = {
    power?: string;
    p?: string;
    p0?: string;
    delta?: string;
};

export default function Test1ProportionNonInferioritySuperiority() {
    const [solveFor, setSolveFor] = useState<string>("sampleSize");
    const [params, setParams] = useState<CalcParams>({
        power: "0.8000",
        sampleSize: 18,
        alpha: 0.05,
        p: 0.5,
        p0: 0.3,
        delta: -0.1,
    });
    const [plotData, setPlotData] = useState<PlotDataPoint[]>([]);
    const [xAxisVar, setXAxisVar] = useState<string>("delta");
    const [xAxisMin, setXAxisMin] = useState<number>(0);
    const [xAxisMax, setXAxisMax] = useState<number>(0);
    const [yAxisVars, setYAxisVars] = useState<string[]>([]);
    const [lineColors, setLineColors] = useState<{ [key: string]: string }>({});
    const [errors, setErrors] = useState<ValidationErrors>({});

    useEffect(() => {
        const { p, p0, delta } = params;
        if (xAxisVar === 'p') {
            setXAxisMin(Math.max(0.01, p * 0.5));
            setXAxisMax(Math.min(0.99, p * 1.5));
        } else if (xAxisVar === 'p0') {
            setXAxisMin(Math.max(0.01, p0 * 0.5));
            setXAxisMax(Math.min(0.99, p0 * 1.5));
        } else if (xAxisVar === 'delta') {
            setXAxisMin(Math.max(0.01, delta * 0.5));
            setXAxisMax(Math.min(0.99, delta * 1.5));
        }
    }, [xAxisVar, params]);

    const validate = () => {
        const newErrors: ValidationErrors = {};
        if (params.power) {
            const powerValue = parseFloat(params.power);
            if (powerValue <= 0 || powerValue >= 1) {
                newErrors.power = "Power must be between 0 and 1.";
            }
        }
        if (params.p <= 0 || params.p >= 1) {
            newErrors.p = "Proportion (p) must be between 0 and 1.";
        }
        if (params.p0 <= 0 || params.p0 >= 1) {
            newErrors.p0 = "Comparison Proportion (p0) must be between 0 and 1.";
        }
        if (params.p - params.p0 === params.delta) {
            const errorMessage = "p - p0 cannot be equal to the margin (δ).";
            newErrors.p = errorMessage;
            newErrors.p0 = errorMessage;
            newErrors.delta = errorMessage;
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const updatePlotData = useCallback(() => {
        const { alpha, power, p, p0, delta } = params;
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

        const z_alpha = jStat.normal.inv(1 - alpha, 0, 1);

        for (let i = 0; i < 100; i++) {
            const x = xAxisMin + (xAxisMax - xAxisMin) * (i / 99);
            const point: PlotDataPoint = { [xAxisVar]: x };
            
            powerScenarios.forEach(scenario => {
                let sampleSize: number | null = null;
                
                let currentP = p;
                let currentP0 = p0;
                let currentDelta = delta;

                if (xAxisVar === 'p') currentP = x;
                else if (xAxisVar === 'p0') currentP0 = x;
                else if (xAxisVar === 'delta') currentDelta = x;
                
                if (currentP > 0 && currentP < 1 && currentP0 > 0 && currentP0 < 1 && (currentP - currentP0 !== currentDelta)) {
                    const z_beta = jStat.normal.inv(scenario.value, 0, 1);
                    const numerator = z_alpha + z_beta;
                    const denominator = currentP - currentP0 - currentDelta;
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
            if (sampleSize && sampleSize > 0 && p > 0 && p < 1 && p0 > 0 && p0 < 1) {
                const z_alpha = jStat.normal.inv(1 - alpha, 0, 1);
                const z = (p - p0 - delta) / Math.sqrt((p * (1 - p)) / sampleSize);
                const calculatedPower = jStat.normal.cdf(z - z_alpha, 0, 1) + jStat.normal.cdf(-z - z_alpha, 0, 1);
                const formattedPower = calculatedPower.toFixed(4);
                if (params.power !== formattedPower) {
                    setParams(p => ({ ...p, power: formattedPower }));
                }
            } else {
                setParams(p => ({...p, power: null}));
            }
        } else { // solveFor === 'sampleSize'
            const powerValue = power ? parseFloat(power) : null;
            if (powerValue && powerValue > 0 && powerValue < 1 && p > 0 && p < 1 && p0 > 0 && p0 < 1 && (p - p0 !== delta)) {
                const z_alpha = jStat.normal.inv(1 - alpha, 0, 1);
                const z_beta = jStat.normal.inv(powerValue, 0, 1);
                const numerator = z_alpha + z_beta;
                const denominator = p - p0 - delta;
                const calculatedSize = p * (1 - p) * Math.pow(numerator / denominator, 2);
                if (params.sampleSize !== calculatedSize) {
                    setParams(p => ({ ...p, sampleSize: Math.ceil(calculatedSize) }));
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
        { name: 'sampleSize', label: 'Sample Size (n)', type: 'number' as const, solve: 'sampleSize' as const },
        { name: 'alpha', label: 'Alpha (α)', type: 'number' as const },
        { name: 'p', label: 'Proportion (p)', type: 'number' as const },
        { name: 'p0', label: 'Comparison Proportion (p0)', type: 'number' as const },
        { name: 'delta', label: 'Margin (δ)', type: 'number' as const },
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
                <DescriptionSection
                    title="Calculate Sample Size Needed to Test 1 Proportion: 1-Sample Non-Inferiority or Superiority"
                    summary={`This calculator is useful for the types of tests known as non-inferiority and superiority tests. Whether the null hypothesis represents 'non-inferiority' or 'superiority' depends on the context and whether the non-inferiority/superiority margin, $\\delta$, is positive or negative. In this setting, we wish to test whether a proportion, $p$, is non-inferior/superior to a reference value, $p_0$. The idea is that statistically significant differences between the proportion and the reference value may not be of interest unless the difference is greater than a threshold, $\\delta$. This is particularly popular in clinical studies, where the margin is chosen based on clinical judgement and subject-domain knowledge. The hypotheses to test are

$H_0:p-p_0\\le\\delta$
$H_1:p-p_0>\\delta$

and $\\delta$ is the superiority or non-inferiority margin.`}
                    formulas={`This calculator uses the following formulas to compute sample size and power, respectively: $$n=p(1-p)\\left(\\frac{z_{1-\\alpha}+z_{1-\\beta}}{p-p_0-\\delta}\\right)^2$$
$1-\\beta= \\Phi\\left(z-z_{1-\\alpha}\\right)+\\Phi\\left(-z-z_{1-\\alpha}\\right) \\quad ,\\quad z=\\frac{p-p_0-\\delta}{\\sqrt{\\frac{p(1-p)}{n}}}$$ where

$n$ is sample size
$p_0$ is the comparison value
$\\Phi$ is the standard Normal distribution function
$\\Phi^{-1}$ is the standard Normal quantile function
$\\alpha$ is Type I error
$\\beta$ is Type II error, meaning $1-\\beta$ is power
$\\delta$ is the testing margin`}
                    rCode={`p=0.5
p0=0.3
delta=-0.1
alpha=0.05
beta=0.20(n=p*(1-p)*((qnorm(1-alpha)+qnorm(1-beta))/(p-p0-delta))^2)
ceiling(n) # 18
z=(p-p0-delta)/sqrt(p*(1-p)/n)(Power=pnorm(z-qnorm(1-alpha))+pnorm(-z-qnorm(1-alpha)))`}
                    references={[
                        "Chow S, Shao J, Wang H. 2008. Sample Size Calculations in Clinical Research. 2nd Ed. Chapman & Hall/CRC Biostatistics Series. page 86."
                    ]}
                />
            </div>
        </div>
    );
}
