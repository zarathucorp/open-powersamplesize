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
}

export default function Test1MeanNonInferioritySuperiorityPage() {
    const [solveFor, setSolveFor] = useState<string>("sampleSize");
    const [params, setParams] = useState<CalcParams>({
        power: "0.8000",
        sampleSize: 7,
        alpha: 0.05,
        mean: 2,
        nullHypothesisMean: 1.5,
        delta: -0.5,
        stdDev: 1,
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
            setXAxisMin(delta * 0.5);
            setXAxisMax(delta * 1.5);
        } else if (xAxisVar === 'mean') {
            const diff = Math.abs(mean - nullHypothesisMean - delta);
            setXAxisMin(mean - diff * 1.5);
            setXAxisMax(mean + diff * 1.5);
        } else if (xAxisVar === 'nullHypothesisMean') {
            const diff = Math.abs(mean - nullHypothesisMean - delta);
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
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    const updatePlotData = useCallback(() => {
        const { alpha, power, mean, nullHypothesisMean, delta, stdDev } = params;
        const mu = mean;
        const mu0 = nullHypothesisMean;
        const sd = stdDev;
        const data = [];
        const effectSize = mu - mu0 - delta;

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
            
            powerScenarios.forEach(scenario => {
                const z_alpha = jStat.normal.inv(1 - alpha, 0, 1);
                const z_beta = jStat.normal.inv(scenario.value, 0, 1);
                let requiredN: number | null = null;
                let denominator: number;

                if (xAxisVar === 'mean') {
                    denominator = x - mu0 - delta;
                    if (denominator !== 0) {
                        requiredN = Math.ceil(Math.pow((sd * (z_alpha + z_beta)) / denominator, 2));
                    }
                } else if (xAxisVar === 'nullHypothesisMean') {
                    denominator = mu - x - delta;
                    if (denominator !== 0) {
                        requiredN = Math.ceil(Math.pow((sd * (z_alpha + z_beta)) / denominator, 2));
                    }
                } else if (xAxisVar === 'stdDev') {
                    denominator = mu - mu0 - delta;
                    if (x > 0 && denominator !== 0) {
                        requiredN = Math.ceil(Math.pow((x * (z_alpha + z_beta)) / denominator, 2));
                    }
                } else if (xAxisVar === 'delta') {
                    denominator = mu - mu0 - x;
                    if (denominator !== 0) {
                        requiredN = Math.ceil(Math.pow((sd * (z_alpha + z_beta)) / denominator, 2));
                    }
                }
                point[scenario.name] = (requiredN && requiredN > 0) ? requiredN : null;
            });
            data.push(point);
        }
        setPlotData(data);
    }, [params, xAxisMin, xAxisMax, xAxisVar, solveFor]);

    const handleCalculate = () => {
        if (!validate()) return;

        const { alpha, power, sampleSize, mean, nullHypothesisMean, delta, stdDev } = params;
        const mu = mean;
        const mu0 = nullHypothesisMean;
        const sd = stdDev;

        if (solveFor === 'power') {
            if (sampleSize && sampleSize > 0) {
                const z = (mu - mu0 - delta) / sd * Math.sqrt(sampleSize);
                const z_alpha = jStat.normal.inv(1 - alpha, 0, 1);
                const calculatedPower = jStat.normal.cdf(z - z_alpha, 0, 1) + jStat.normal.cdf(-z - z_alpha, 0, 1);
                const formattedPower = calculatedPower.toFixed(4);
                if (params.power !== formattedPower) {
                    setParams(p => ({ ...p, power: formattedPower }));
                }
            } else {
                setParams(p => ({...p, power: null}));
            }
        } else {
            const powerValue = power ? parseFloat(power) : null;
            if (powerValue && powerValue > 0 && powerValue < 1 && (mu - mu0 - delta) !== 0) {
                const n = Math.ceil(Math.pow((sd * (jStat.normal.inv(1 - alpha, 0, 1) + jStat.normal.inv(powerValue, 0, 1))) / (mu - mu0 - delta), 2));
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
                    title="Calculate Sample Size Needed to Test 1 Mean: 1-Sample Non-Inferiority or Superiority"
                    summary={`This calculator is useful for the types of tests known as non-inferiority and superiority tests. Whether the null hypothesis represents 'non-inferiority' or 'superiority' depends on the context and whether the non-inferiority/superiority margin, $\\delta$, is positive or negative. In this setting, we wish to test whether a mean, $\\mu$, is non-inferior/superior to a reference value, $\\mu_0$. The idea is that statistically significant differences between the mean and the reference value may not be of interest unless the difference is greater than a threshold, $\\delta$. This is particularly popular in clinical studies, where the margin is chosen based on clinical judgement and subject-domain knowledge. The hypotheses to test are

$H_0: \\mu - \\mu_0 \\le \\delta$
$H_1: \\mu - \\mu_0 > \\delta$

and $\\delta$ is the superiority or non-inferiority margin.`}
                    formulas={`This calculator uses the following formulas to compute sample size and power, respectively:

$n=\\left(\\sigma\\frac{z_{1-\\alpha}+z_{1-\\beta}}{\\mu-\\mu_0-\\delta}\\right)^2$
$1-\\beta= \\Phi\\left(z-z_{1-\\alpha}\\right)+\\Phi\\left(-z-z_{1-\\alpha}\\right) \\quad ,\\quad z=\\frac{\\mu-\\mu_0-\\delta}{\\sigma/\\sqrt{n}}$

where:
$n$ is sample size
$\\sigma$ is standard deviation
$\\Phi$ is the standard Normal distribution function
$\\Phi^{-1}$ is the standard Normal quantile function
$\\alpha$ is Type I error
$\\beta$ is Type II error, meaning $1-\\beta$ is power
$\\delta$ is the testing margin`}
                    rCode={`mu=2
mu0=1.5
delta=-0.5
sd=1
alpha=0.05
beta=0.20
(n=(sd*(qnorm(1-alpha)+qnorm(1-beta))/(mu-mu0-delta))^2)
ceiling(n)# 7
z=(mu-mu0-delta)/sd*sqrt(n)
(Power=pnorm(z-qnorm(1-alpha))+pnorm(-z-qnorm(1-alpha)))`}
                    references={[
                        "Chow S, Shao J, Wang H. 2008. Sample Size Calculations in Clinical Research. 2nd Ed. Chapman & Hall/CRC Biostatistics Series. page 52."
                    ]}
                />
            </div>
        </div>
    );
}
