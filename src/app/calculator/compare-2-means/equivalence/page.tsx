"use client";

import { useState, useEffect, useCallback } from "react";
import { jStat } from "jstat";
import { CalculatorInputArea } from "@/components/calculator/CalculatorInputArea";
import { PlotSection } from "@/components/calculator/PlotSection";
import { DescriptionSection } from "@/components/calculator/DescriptionSection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Define types for calculator parameters and validation errors
type CalcParams = {
    alpha: number;
    power: string | null;
    sampleSize: number | null; // This is nB
    muA: number;
    muB: number;
    stdDev: number;
    kappa: number;
    delta: number;
};

type PlotDataPoint = {
    [key: string]: number | null;
};

type ValidationErrors = {
    power?: string;
    alpha?: string;
    kappa?: string;
    stdDev?: string;
    delta?: string;
    diff?: string;
};

// 계산기 페이지에 맞게 컴포넌트 이름을 변경합니다.
export default function Compare2MeansEquivalence() {
    const [solveFor, setSolveFor] = useState<string>("sampleSize");
    const [params, setParams] = useState<CalcParams>({
        power: "0.8000",
        sampleSize: 108,
        alpha: 0.05,
        muA: 5,
        muB: 4,
        stdDev: 10,
        kappa: 1,
        delta: 5,
    });
    const [plotData, setPlotData] = useState<PlotDataPoint[]>([]);
    const [xAxisVar, setXAxisVar] = useState<string>("delta");
    const [xAxisMin, setXAxisMin] = useState<number>(4);
    const [xAxisMax, setXAxisMax] = useState<number>(6);
    const [yAxisVars, setYAxisVars] = useState<string[]>([]);
    const [lineColors, setLineColors] = useState<{ [key: string]: string }>({});
    const [errors, setErrors] = useState<ValidationErrors>({});

    useEffect(() => {
        const { stdDev, delta, muA, muB, kappa } = params;
        if (xAxisVar === 'stdDev') {
            setXAxisMin(Math.max(0.1, stdDev * 0.5));
            setXAxisMax(stdDev * 1.5);
        } else if (xAxisVar === 'delta') {
            const diff = Math.abs(muA - muB);
            setXAxisMin(Math.max(diff + 0.1, delta * 0.8));
            setXAxisMax(delta * 1.2);
        } else if (xAxisVar === 'muA') {
            setXAxisMin(muA - 2);
            setXAxisMax(muA + 2);
        } else if (xAxisVar === 'muB') {
            setXAxisMin(muB - 2);
            setXAxisMax(muB + 2);
        } else if (xAxisVar === 'kappa') {
            setXAxisMin(Math.max(0.1, kappa * 0.5));
            setXAxisMax(kappa * 1.5);
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
        if (params.alpha <= 0 || params.alpha >= 1) {
            newErrors.alpha = "Alpha must be between 0 and 1.";
        }
        if (params.kappa <= 0) {
            newErrors.kappa = "Ratio must be > 0.";
        }
        if (params.stdDev <= 0) {
            newErrors.stdDev = "Std Dev must be > 0.";
        }
        if (params.delta <= 0) {
            newErrors.delta = "Equivalence margin must be > 0.";
        }
        if (Math.abs(params.muA - params.muB) >= params.delta) {
            newErrors.diff = "|μA-μB| must be < δ.";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const updatePlotData = useCallback(() => {
        const { alpha, power, muA, muB, stdDev, kappa, delta } = params;
        const data = [];

        const powerValue = power ? parseFloat(power) : null;
        const powerScenarios: { name: string, value: number }[] = [];
        const colors = ['#8884d8', '#82ca9d', '#ffc658'];
        const newColors: { [key: string]: string } = {};

        if (powerValue && powerValue > 0 && powerValue < 1) {
            powerScenarios.push({ name: `${(powerValue * 100).toFixed(2)}%`, value: powerValue });
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
                let nB: number | null = null;
                
                const beta = 1 - scenario.value;
                const z_alpha = jStat.normal.inv(1 - alpha, 0, 1);
                const z_beta_2 = jStat.normal.inv(1 - beta / 2, 0, 1);

                let currentMuA = muA;
                let currentMuB = muB;
                let currentStdDev = stdDev;
                let currentKappa = kappa;
                let currentDelta = delta;

                if (xAxisVar === 'muA') currentMuA = x;
                else if (xAxisVar === 'muB') currentMuB = x;
                else if (xAxisVar === 'stdDev') currentStdDev = x;
                else if (xAxisVar === 'kappa') currentKappa = x;
                else if (xAxisVar === 'delta') currentDelta = x;

                if (currentStdDev <= 0 || currentKappa <= 0 || currentDelta <= 0 || Math.abs(currentMuA - currentMuB) >= currentDelta) {
                    nB = null;
                } else {
                    const numerator = currentStdDev * (z_alpha + z_beta_2);
                    const denominator = Math.abs(currentMuA - currentMuB) - currentDelta;
                    
                    const calculated_nB = (1 + 1/currentKappa) * Math.pow(numerator / denominator, 2);
                    nB = Math.ceil(calculated_nB);
                }
                
                point[scenario.name] = nB && nB > 0 ? nB : null;
            });
            data.push(point);
        }
        setPlotData(data);
    }, [params, xAxisMin, xAxisMax, xAxisVar]);

    const handleCalculate = () => {
        if (!validate()) return;

        const { alpha, power, sampleSize, muA, muB, stdDev, kappa, delta } = params;
        
        if (solveFor === 'power') {
            if (sampleSize && sampleSize > 0) {
                const nB = sampleSize;
                const nA = kappa * nB;
                const z_alpha = jStat.normal.inv(1 - alpha, 0, 1);
                const z = (Math.abs(muA - muB) - delta) / (stdDev * Math.sqrt(1/nA + 1/nB));
                
                const calculatedPower = 2 * (jStat.normal.cdf(z - z_alpha, 0, 1) + jStat.normal.cdf(-z - z_alpha, 0, 1)) - 1;

                if (calculatedPower > 0 && calculatedPower < 1) {
                    const formattedPower = calculatedPower.toFixed(4);
                    if (params.power !== formattedPower) {
                        setParams(p => ({ ...p, power: formattedPower }));
                    }
                } else {
                     setParams(p => ({...p, power: null}));
                }
            } else {
                setParams(p => ({...p, power: null}));
            }
        } else { // solveFor === 'sampleSize'
            const powerValue = power ? parseFloat(power) : null;
            if (powerValue && powerValue > 0 && powerValue < 1) {
                const beta = 1 - powerValue;
                const z_alpha = jStat.normal.inv(1 - alpha, 0, 1);
                const z_beta_2 = jStat.normal.inv(1 - beta / 2, 0, 1);
                
                const numerator = stdDev * (z_alpha + z_beta_2);
                const denominator = Math.abs(muA - muB) - delta;
                
                const nB = (1 + 1/kappa) * Math.pow(numerator / denominator, 2);
                const calculatedSize = Math.ceil(nB);

                if (params.sampleSize !== calculatedSize) {
                    setParams(p => ({ ...p, sampleSize: calculatedSize }));
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
        { name: 'sampleSize', label: 'Sample Size (nB)', type: 'number' as const, solve: 'sampleSize' as const },
        { name: 'alpha', label: 'Alpha (α)', type: 'number' as const },
        { name: 'kappa', label: 'Ratio (nA/nB)', type: 'number' as const },
        { name: 'muA', label: 'Mean of Group A (μA)', type: 'number' as const },
        { name: 'muB', label: 'Mean of Group B (μB)', type: 'number' as const },
        { name: 'stdDev', label: 'Standard Deviation (σ)', type: 'number' as const },
        { name: 'delta', label: 'Equivalence Margin (δ)', type: 'number' as const },
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
                                yAxisLabel="Sample Size (nB)"
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
                    title="Calculate Sample Size Needed to Compare 2 Means: 2-Sample Equivalence"
                    summary={`This calculator is useful when we wish to test whether the means of two groups are equivalent, without concern of which group's mean is larger. Suppose we collect a sample from a group 'A' and a group 'B'; that is we collect two samples, and will conduct a two-sample test. For example, we may wish to test whether a new product is equivalent to an existing, industry standard product. Here, the 'burden of proof', so to speak, falls on the new product; that is, equivalence is actually represented by the alternative, rather than the null hypothesis.

$H_0:|\\mu_A-\\mu_B|\\ge\\delta$
$H_1:|\\mu_A-\\mu_B|<\\delta$

where $\\delta$ is the superiority or non-inferiority margin and the ratio between the sample sizes of the two groups is
$\\kappa=\\frac{n_1}{n_2}$`}
                    formulas={`This calculator uses the following formulas to compute sample size and power, respectively: 
                      $ n_A=\\kappa n_B \\;\\text{ and }\\; n_B=\\left(1+\\frac{1}{\\kappa}\\right) \\left(\\sigma\\frac{z_{1-\\alpha}+z_{1-\\beta/2}}{|\\mu_A-\\mu_B|-\\delta}\\right)^2$
$1-\\beta= 2\\left[\\Phi\\left(z-z_{1-\\alpha}\\right)+\\Phi\\left(-z-z_{1-\\alpha}\\right)\\right]-1 \\quad ,\\quad z=\\frac{|\\mu_A-\\mu_B|-\\delta}{\\sigma\\sqrt{\\frac{1}{n_A}+\\frac{1}{n_B}}}$
where

$\\kappa=n_A/n_B$ is the matching ratio
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
                        "Chow, S.-C., Shao, J., Wang, H., and Lokhnygina, Y. (2018). Sample Size Calculations in Clinical Research, Third Edition. Chapman & Hall/CRC.",
                        "PASS 2023 Power Analysis and Sample Size Software (2023). NCSS, LLC. Kaysville, Utah, USA, ncss.com/software/pass."
                    ]}
                />
            </div>
        </div>
    );
}
