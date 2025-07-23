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
    muA: number;
    muB: number;
    stdDev: number;
    delta: number;
    kappa: number;
};

type PlotDataPoint = {
    [key: string]: number | null;
};

type ValidationErrors = {
    power?: string;
    stdDev?: string;
    kappa?: string;
};

export default function Compare2MeansNonInferioritySuperiorityPage() {
    const [solveFor, setSolveFor] = useState<string>("sampleSize");
    const [params, setParams] = useState<CalcParams>({
        power: "0.8000",
        sampleSize: 50,
        alpha: 0.05,
        muA: 5,
        muB: 5,
        stdDev: 10,
        delta: 5,
        kappa: 1,
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
            setXAxisMin(delta - 1);
            setXAxisMax(delta + 1);
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
        if (params.stdDev <= 0) {
            newErrors.stdDev = "Standard Deviation must be positive.";
        }
        if (params.kappa <= 0) {
            newErrors.kappa = "Matching Ratio must be positive.";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const updatePlotData = useCallback(() => {
        const { alpha, power, muA, muB, stdDev, delta, kappa } = params;
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
                
                let currentMuA = muA;
                let currentMuB = muB;
                let currentStdDev = stdDev;
                let currentDelta = delta;
                let currentKappa = kappa;

                if (xAxisVar === 'muA') currentMuA = x;
                else if (xAxisVar === 'muB') currentMuB = x;
                else if (xAxisVar === 'stdDev') currentStdDev = x;
                else if (xAxisVar === 'delta') currentDelta = x;
                else if (xAxisVar === 'kappa') currentKappa = x;

                if (currentStdDev <= 0 || currentKappa <= 0) {
                    point[scenario.name] = null;
                    return;
                }

                const z_beta = jStat.normal.inv(scenario.value, 0, 1);
                const numerator = currentStdDev * (z_alpha + z_beta);
                const denominator = currentMuA - currentMuB - currentDelta;

                if (Math.abs(denominator) < 1e-9) {
                    sampleSize = Infinity;
                } else {
                    const nB = (1 + 1 / currentKappa) * Math.pow(numerator / denominator, 2);
                    sampleSize = Math.ceil(nB);
                }
                
                point[scenario.name] = sampleSize > 0 && isFinite(sampleSize) ? sampleSize : null;
            });
            data.push(point);
        }
        setPlotData(data);
    }, [params, xAxisMin, xAxisMax, xAxisVar]);

    const handleCalculate = () => {
        if (!validate()) return;

        const { alpha, power, sampleSize, muA, muB, stdDev, delta, kappa } = params;
        
        if (solveFor === 'power') {
            if (sampleSize && sampleSize > 0) {
                const nB = sampleSize;
                const z_alpha = jStat.normal.inv(1 - alpha, 0, 1);
                const term = stdDev * Math.sqrt((1 + 1 / kappa) / nB);
                const z = (muA - muB - delta) / term;
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
            if (powerValue && powerValue > 0 && powerValue < 1) {
                const z_alpha = jStat.normal.inv(1 - alpha, 0, 1);
                const z_beta = jStat.normal.inv(powerValue, 0, 1);
                const numerator = stdDev * (z_alpha + z_beta);
                const denominator = muA - muB - delta;
                if (Math.abs(denominator) < 1e-9) {
                    setParams(p => ({ ...p, sampleSize: Infinity }));
                    return;
                }
                const nB = (1 + 1 / kappa) * Math.pow(numerator / denominator, 2);
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
        { name: 'muA', label: 'Mean, Group A (μA)', type: 'number' as const },
        { name: 'muB', label: 'Mean, Group B (μB)', type: 'number' as const },
        { name: 'stdDev', label: 'Standard Deviation (σ)', type: 'number' as const },
        { name: 'delta', label: 'Margin (δ)', type: 'number' as const },
        { name: 'kappa', label: 'Matching Ratio (κ=nA/nB)', type: 'number' as const },
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
                    title="Compare 2 Means: 2-Sample Non-Inferiority or Superiority"
                    summary={`This calculator is useful for the types of tests known as non-inferiority and superiority tests. Whether the null hypothesis represents 'non-inferiority' or 'superiority' depends on the context and whether the non-inferiority/superiority margin, $\\delta$, is positive or negative. In this setting, we wish to test whether the mean in group 'A', $\\mu_A$, is non-inferior/superior to the mean in group 'B', $\\mu_B$. We collect a sample from both groups, and thus will conduct a two-sample test. The idea is that statistically significant differences between the means may not be of interest unless the difference is greater than a threshold, $\\delta$. This is particularly popular in clinical studies, where the margin is chosen based on clinical judgement and subject-domain knowledge. The hypotheses to test are
                      $H_0: \\mu_A - \\mu_B \\le \\delta$
                      $H_1: \\mu_A - \\mu_B > \\delta$
                      , where $\\delta$ is the superiority or non-inferiority margin and the ratio between the sample sizes of the two groups is 
                      $\\kappa = n_A/n_B$`}
                    formulas={`$ n_A=\\kappa n_B \\;\\text{ and }\\; n_B=\\left(1+\\frac{1}{\\kappa}\\right) $
                      $\\left(\\sigma\\frac{z_{1-\\alpha}+z_{1-\\beta}}{\\mu_A-\\mu_B-\\delta}\\right)^2 1-\\beta = \\Phi\\left(z-z_{1-\\alpha}\\right)+\\Phi\\left(-z-z_{1-\\alpha}\\right) \\quad ,\\quad z=\\frac{\\mu_A-\\mu_B-\\delta}{\\sigma\\sqrt{\\frac{1}{n_A}+\\frac{1}{n_B}}} $`}
                    rCode={`muA=5
muB=5
delta=5
kappa=1
sd=10
alpha=0.05
beta=0.20
(nB=(1+1/kappa)*(sd*(qnorm(1-alpha)+qnorm(1-beta))/(muA-muB-delta))^2)
ceiling(nB) # 50
z=(muA-muB-delta)/(sd*sqrt((1+1/kappa)/nB))
(Power=pnorm(z-qnorm(1-alpha))+pnorm(-z-qnorm(1-alpha)))`}
                    references={[
                        "Chow S, Shao J, Wang H. 2008. Sample Size Calculations in Clinical Research. 2nd Ed. Chapman & Hall/CRC Biostatistics Series. page 61."
                    ]}
                />
            </div>
        </div>
    );
}
