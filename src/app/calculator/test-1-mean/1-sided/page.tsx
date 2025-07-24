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
    mean: number;
    nullHypothesisMean: number;
    stdDev: number;
};

type PlotDataPoint = {
    [key: string]: number | null;
};

type ValidationErrors = {
    power?: string;
}

export default function Test1Mean1SidedPage() {
    const [solveFor, setSolveFor] = useState<string>("sampleSize");
    const [params, setParams] = useState<CalcParams>({
        power: "0.8000",
        sampleSize: 143,
        alpha: 0.05,
        mean: 115,
        nullHypothesisMean: 120,
        stdDev: 24,
    });
    const [plotData, setPlotData] = useState<PlotDataPoint[]>([]);
    const [xAxisVar, setXAxisVar] = useState<string>("mean");
    const [xAxisMin, setXAxisMin] = useState<number>(0);
    const [xAxisMax, setXAxisMax] = useState<number>(0);
    const [yAxisVars, setYAxisVars] = useState<string[]>([]);
    const [lineColors, setLineColors] = useState<{ [key: string]: string }>({});
    const [errors, setErrors] = useState<ValidationErrors>({});

    useEffect(() => {
        const { stdDev, mean, nullHypothesisMean } = params;
        if (xAxisVar === 'stdDev') {
            setXAxisMin(Math.max(0.1, stdDev * 0.5));
            setXAxisMax(stdDev * 1.5);
        } else if (xAxisVar === 'mean') {
            const delta = Math.abs(mean - nullHypothesisMean);
            setXAxisMin(mean - delta * 1.5);
            setXAxisMax(mean + delta * 1.5);
        } else if (xAxisVar === 'nullHypothesisMean') {
            const delta = Math.abs(mean - nullHypothesisMean);
            setXAxisMin(nullHypothesisMean - delta * 1.5);
            setXAxisMax(nullHypothesisMean + delta * 1.5);
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
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    const updatePlotData = useCallback(() => {
        const { alpha, power, mean, nullHypothesisMean, stdDev } = params;
        const mu = mean;
        const mu0 = nullHypothesisMean;
        const sd = stdDev;
        const data = [];
        const effectSize = mu - mu0;

        if (solveFor === 'power' && effectSize === 0) {
            setPlotData([]);
            return;
        }

        const powerValue = power ? parseFloat(power) : null;
        const powerScenarios: { name: string, value: number }[] = [];
        const colors = ['#8884d8', '#82ca9d', '#ffc658'];
        const newColors: { [key: string]: string } = {};

        if (powerValue && powerValue > 0 && powerValue < 1) {
            const powerName = `${(powerValue * 100).toFixed(2)}%`;
            powerScenarios.push({ name: powerName, value: powerValue });
        }

        [0.9, 0.7].forEach(val => {
            if (!powerScenarios.some(s => s.value === val)) {
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
            
            if (xAxisVar === 'mean') {
                powerScenarios.forEach(scenario => {
                    if (x !== mu0) {
                        const requiredN = Math.ceil(Math.pow((sd * (jStat.normal.inv(1 - alpha, 0, 1) + jStat.normal.inv(scenario.value, 0, 1))) / Math.abs(x - mu0), 2));
                        point[scenario.name] = requiredN > 0 ? requiredN : null;
                    } else {
                        point[scenario.name] = null;
                    }
                });
            } else if (xAxisVar === 'nullHypothesisMean') {
                powerScenarios.forEach(scenario => {
                    if (mu !== x) {
                        const requiredN = Math.ceil(Math.pow((sd * (jStat.normal.inv(1 - alpha, 0, 1) + jStat.normal.inv(scenario.value, 0, 1))) / Math.abs(mu - x), 2));
                        point[scenario.name] = requiredN > 0 ? requiredN : null;
                    } else {
                        point[scenario.name] = null;
                    }
                });
            } else if (xAxisVar === 'stdDev') {
                powerScenarios.forEach(scenario => {
                    if (x > 0 && effectSize !== 0) {
                        const requiredN = Math.ceil(Math.pow((x * (jStat.normal.inv(1 - alpha, 0, 1) + jStat.normal.inv(scenario.value, 0, 1))) / Math.abs(mu - mu0), 2));
                        point[scenario.name] = requiredN > 0 ? requiredN : null;
                    } else {
                        point[scenario.name] = null;
                    }
                });
            }
            data.push(point);
        }
        setPlotData(data);
    }, [params, xAxisMin, xAxisMax, xAxisVar, solveFor]);

    const handleCalculate = () => {
        if (!validate()) return;

        const { alpha, power, sampleSize, mean, nullHypothesisMean, stdDev } = params;
        const mu = mean;
        const mu0 = nullHypothesisMean;
        const sd = stdDev;

        if (solveFor === 'power') {
            if (sampleSize && sampleSize > 0) {
                const z = Math.abs(mu - mu0) / sd * Math.sqrt(sampleSize);
                const calculatedPower = jStat.normal.cdf(z - jStat.normal.inv(1 - alpha, 0, 1), 0, 1);
                const formattedPower = calculatedPower.toFixed(4);
                if (params.power !== formattedPower) {
                    setParams(p => ({ ...p, power: formattedPower }));
                }
            } else {
                setParams(p => ({...p, power: null}));
            }
        } else {
            const powerValue = power ? parseFloat(power) : null;
            if (powerValue && powerValue > 0 && powerValue < 1 && mu !== mu0) {
                const n = Math.ceil(Math.pow((sd * (jStat.normal.inv(1 - alpha, 0, 1) + jStat.normal.inv(powerValue, 0, 1))) / (mu - mu0), 2));
                if (params.sampleSize !== n) {
                    setParams(p => ({ ...p, sampleSize: n }));
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
        { name: 'alpha', label: 'Type I error rate (α)', type: 'number' as const },
        { name: 'mean', label: 'True mean (μ)', type: 'number' as const },
        { name: 'nullHypothesisMean', label: 'Null Hypothesis mean (μ₀)', type: 'number' as const },
        { name: 'stdDev', label: 'Standard Deviation (σ)', type: 'number' as const },
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
                                yAxisLabel="Sample Size"
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
                    title="Calculate Sample Size Needed to Test 1 Mean: 1-Sample, 1-Sided"
                    summary={`This calculator is useful for tests concerning whether a mean, $\\mu$, is equal to a reference value, $\\mu_0$. The Null and Alternative hypotheses are either:
$H_0: \\mu = \\mu_0 \\\\ H_1: \\mu < \\mu_0$
or
$H_0: \\mu = \\mu_0 \\\\ H_1: \\mu > \\mu_0$
`}
                    formulas={`This calculator uses the following formulas to compute sample size and power, respectively:
$n = \\left( \\sigma\\frac{z_{1-\\alpha} + z_{1-\\beta}}{\\mu - \\mu_0} \\right)^2$
$1-\\beta = \\Phi\\left( \\frac{|\\mu - \\mu_0|}{\\sigma / \\sqrt{n}} - z_{1-\\alpha} \\right)$
where:
$n$ is sample size
$\\sigma$ is standard deviation
$\\Phi$ is the standard Normal distribution function
$\\Phi^{-1}$ is the standard Normal quantile function
$\\alpha$ is Type I error
$\\beta$ is Type II error, meaning $1-\\beta$ is power`}
                    rCode={`mu=115
mu0=120
sd=24
alpha=0.05
beta=0.20
(n=(sd*(qnorm(1-alpha)+qnorm(1-beta))/(mu-mu0))^2)
ceiling(n)# 143
z=(mu-mu0)/sd*sqrt(n)
(Power=pnorm(abs(z)-qnorm(1-alpha)))`}
                    references={[
                        "Rosner B. 2010. Fundamentals of Biostatistics. 7th Ed. Brooks/Cole. page 224 and 230."
                    ]}
                />
            </div>
        </div>
    );
}
