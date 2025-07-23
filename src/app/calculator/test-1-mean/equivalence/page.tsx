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
    delta: number;
    stdDev: number;
};

type PlotDataPoint = {
    [key: string]: number | null;
};

type ValidationErrors = {
    power?: string;
    delta?: string;
}

export default function Test1MeanEquivalencePage() {
    const [solveFor, setSolveFor] = useState<string>("sampleSize");
    const [params, setParams] = useState<CalcParams>({
        power: "0.8000",
        sampleSize: 35,
        alpha: 0.05,
        mean: 2,
        nullHypothesisMean: 2,
        delta: 0.05,
        stdDev: 0.10,
    });
    const [plotData, setPlotData] = useState<PlotDataPoint[]>([]);
    const [xAxisVar, setXAxisVar] = useState<string>("mean");
    const [xAxisMin, setXAxisMin] = useState<number>(0);
    const [xAxisMax, setXAxisMax] = useState<number>(0);
    const [yAxisVars, setYAxisVars] = useState<string[]>([]);
    const [lineColors, setLineColors] = useState<{ [key: string]: string }>({});
    const [errors, setErrors] = useState<ValidationErrors>({});

    useEffect(() => {
        const { stdDev, delta, mean, nullHypothesisMean } = params;
        if (xAxisVar === 'stdDev') {
            setXAxisMin(Math.max(0.1, stdDev * 0.5));
            setXAxisMax(stdDev * 1.5);
        } else if (xAxisVar === 'delta') {
            setXAxisMin(Math.max(0.1, delta * 0.5));
            setXAxisMax(delta * 1.5);
        } else if (xAxisVar === 'mean') {
            const diff = Math.abs(mean - nullHypothesisMean);
            setXAxisMin(mean - diff * 1.5);
            setXAxisMax(mean + diff * 1.5);
        } else if (xAxisVar === 'nullHypothesisMean') {
            const diff = Math.abs(mean - nullHypothesisMean);
            setXAxisMin(nullHypothesisMean - diff * 1.5);
            setXAxisMax(nullHypothesisMean + diff * 1.5);
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
        if (solveFor === 'sampleSize') {
            if (params.delta <= Math.abs(params.mean - params.nullHypothesisMean)) {
                newErrors.delta = "Delta must be greater than |μ - μ₀|.";
            }
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    const updatePlotData = useCallback(() => {
        const { alpha, power, mean, nullHypothesisMean, stdDev, delta } = params;
        const mu = mean;
        const mu0 = nullHypothesisMean;
        const sd = stdDev;
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
            
            powerScenarios.forEach(scenario => {
                const z_alpha = jStat.normal.inv(1 - alpha, 0, 1);
                const z_beta = jStat.normal.inv(1 - (1 - scenario.value) / 2, 0, 1);
                let requiredN: number | null = null;

                if (xAxisVar === 'mean') {
                    if (delta > Math.abs(x - mu0)) {
                        requiredN = Math.ceil(Math.pow((sd * (z_alpha + z_beta)) / (delta - Math.abs(x - mu0)), 2));
                    }
                } else if (xAxisVar === 'nullHypothesisMean') {
                    if (delta > Math.abs(mu - x)) {
                        requiredN = Math.ceil(Math.pow((sd * (z_alpha + z_beta)) / (delta - Math.abs(mu - x)), 2));
                    }
                } else if (xAxisVar === 'stdDev') {
                    if (delta > Math.abs(mu - mu0) && x > 0) {
                        requiredN = Math.ceil(Math.pow((x * (z_alpha + z_beta)) / (delta - Math.abs(mu - mu0)), 2));
                    }
                } else if (xAxisVar === 'delta') {
                    if (x > Math.abs(mu - mu0)) {
                        requiredN = Math.ceil(Math.pow((sd * (z_alpha + z_beta)) / (x - Math.abs(mu - mu0)), 2));
                    }
                }
                point[scenario.name] = requiredN && requiredN > 0 ? requiredN : null;
            });
            data.push(point);
        }
        setPlotData(data);
    }, [params, xAxisMin, xAxisMax, xAxisVar]);

    const handleCalculate = () => {
        if (!validate()) return;

        const { alpha, power, sampleSize, mean, nullHypothesisMean, stdDev, delta } = params;
        const mu = mean;
        const mu0 = nullHypothesisMean;
        const sd = stdDev;

        if (solveFor === 'power') {
            if (sampleSize && sampleSize > 0) {
                const z = (Math.abs(mu - mu0) - delta) / (sd / Math.sqrt(sampleSize));
                const calculatedPower = 2 * (jStat.normal.cdf(z - jStat.normal.inv(1 - alpha, 0, 1), 0, 1) + jStat.normal.cdf(-z - jStat.normal.inv(1 - alpha, 0, 1), 0, 1)) - 1;
                const formattedPower = calculatedPower > 0 ? calculatedPower.toFixed(4) : "0";
                if (params.power !== formattedPower) {
                    setParams(p => ({ ...p, power: formattedPower }));
                }
            } else {
                setParams(p => ({...p, power: null}));
            }
        } else {
            const powerValue = power ? parseFloat(power) : null;
            if (powerValue && powerValue > 0 && powerValue < 1 && delta > Math.abs(mu - mu0)) {
                const n = Math.ceil(Math.pow((sd * (jStat.normal.inv(1 - alpha, 0, 1) + jStat.normal.inv(1 - (1-powerValue)/2, 0, 1))) / (delta - Math.abs(mu - mu0)), 2));
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
        { name: 'alpha', label: 'Alpha (α)', type: 'number' as const },
        { name: 'mean', label: 'True mean (μ)', type: 'number' as const },
        { name: 'nullHypothesisMean', label: 'Null Hypothesis mean (μ₀)', type: 'number' as const },
        { name: 'delta', label: 'Non-inferiority or Superiority Margin (δ)', type: 'number' as const },
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
                    title="Calculate Sample Size Needed to Test 1 Mean: 1-Sample Equivalence"
                    summary={`This calculator is useful when we wish to test whether a mean, $\\mu$, is different from a gold standard reference value, $\\mu_0$. For example, we may wish to test whether a new product is equivalent to an existing, industry standard product. Here, the 'burden of proof', so to speak, falls on the new product; that is, equivalence is actually represented by the alternative, rather than the null hypothesis.
$H_0: |\\mu - \\mu_0| \\geq \\delta \\\\ H_1: |\\mu - \\mu_0| < \\delta$
`}
                    formulas={`This calculator uses the following formulas to compute sample size and power, respectively:

$n = \\left(\\sigma\\frac{z_{1-\\alpha} + z_{1-\\beta/2}}{\\delta - |\\mu - \\mu_0|}\\right)^2$

$1-\\beta=2\\left[\\Phi\\left(z-z_{1-\\alpha}\\right)+\\Phi\\left(-z-z_{1-\\alpha}\\right)\\right]-1 \\quad ,\\quad z=\\frac{|\\mu-\\mu_0|-\\delta}{\\sigma/\\sqrt{n}}$

where:
$n$ is sample size
$\\sigma$ is standard deviation
$\\Phi$ is the standard Normal distribution function
$\\Phi^{-1}$ is the standard Normal quantile function
$\\alpha$ is Type I error
$\\beta$ is Type II error, meaning $1-\\beta$ is power
$\\delta$ is the testing margin`}
                    rCode={`muA=5
muB=4
delta=5
kappa=1
sd=10
alpha=0.05
beta=0.20
(nB=(1+1/kappa)*(sd*(qnorm(1-alpha)+qnorm(1-beta/2))/(abs(muA-muB)-delta))^2)
ceiling(nB) # 108
z=(abs(muA-muB)-delta)/(sd*sqrt((1+1/kappa)/nB))
(Power=2*(pnorm(z-qnorm(1-alpha))+pnorm(-z-qnorm(1-alpha)))-1)`}
                    references={[
                        "Chow S, Shao J, Wang H. 2008. Sample Size Calculations in Clinical Research. 2nd Ed. Chapman & Hall/CRC Biostatistics Series. page 54."
                    ]}
                />
            </div>
        </div>
    );
}
