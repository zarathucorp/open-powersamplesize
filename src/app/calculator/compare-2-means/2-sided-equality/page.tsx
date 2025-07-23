"use client";

import { useState, useEffect, useCallback } from "react";
import { jStat } from "jstat";
import { CalculatorInputArea } from "@/components/calculator/CalculatorInputArea";
import { PlotSection } from "@/components/calculator/PlotSection";
import { DescriptionSection } from "@/components/calculator/DescriptionSection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CalcParams = {
    alpha: number;
    power: string | null;
    sampleSizeA: number | null;
    sampleSizeB: number | null;
    meanA: number;
    meanB: number;
    stdDev: number;
    kappa: number;
};

type PlotDataPoint = {
    [key: string]: number | null;
};

type ValidationErrors = {
    power?: string;
};

export default function Compare2Means2SidedEqualityPage() {
    const [solveFor, setSolveFor] = useState<string>("sampleSizeB");
    const [params, setParams] = useState<CalcParams>({
        power: "0.8000",
        sampleSizeA: 63,
        sampleSizeB: 63,
        alpha: 0.05,
        meanA: 5,
        meanB: 10,
        stdDev: 10,
        kappa: 1,
    });
    const [plotData, setPlotData] = useState<PlotDataPoint[]>([]);
    const [xAxisVar, setXAxisVar] = useState<string>("meanA");
    const [xAxisMin, setXAxisMin] = useState<number>(4);
    const [xAxisMax, setXAxisMax] = useState<number>(6);
    const [yAxisVars, setYAxisVars] = useState<string[]>([]);
    const [lineColors, setLineColors] = useState<{ [key: string]: string }>({});
    const [errors, setErrors] = useState<ValidationErrors>({});

    useEffect(() => {
        if (params.sampleSizeB && params.kappa > 0) {
            const nA = Math.ceil(params.sampleSizeB * params.kappa);
            if (params.sampleSizeA !== nA) {
                setParams(p => ({ ...p, sampleSizeA: nA }));
            }
        } else {
             setParams(p => ({ ...p, sampleSizeA: null }));
        }
    }, [params.sampleSizeB, params.kappa, params.sampleSizeA]);

    useEffect(() => {
        if (xAxisVar === 'meanA') {
            setXAxisMin(4);
            setXAxisMax(6);
        } else if (xAxisVar === 'meanB') {
            setXAxisMin(9);
            setXAxisMax(11);
        } else if (xAxisVar === 'stdDev') {
            setXAxisMin(8);
            setXAxisMax(12);
        } else if (xAxisVar === 'kappa') {
            setXAxisMin(0.5);
            setXAxisMax(2);
        }
    }, [xAxisVar]);

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
        const { alpha, power, meanA, meanB, stdDev, kappa } = params;
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
                let nB: number | null = null;
                const z_alpha_half = jStat.normal.inv(1 - alpha / 2, 0, 1);
                const z_beta = jStat.normal.inv(scenario.value, 0, 1);

                let currentMeanA = meanA, currentMeanB = meanB, currentStdDev = stdDev, currentKappa = kappa;

                if (xAxisVar === 'meanA') currentMeanA = x;
                else if (xAxisVar === 'meanB') currentMeanB = x;
                else if (xAxisVar === 'stdDev') currentStdDev = x;
                else if (xAxisVar === 'kappa') currentKappa = x;
                
                const currentEffectSize = currentMeanA - currentMeanB;
                if (currentEffectSize === 0 || currentKappa <= 0 || currentStdDev <= 0) {
                    point[scenario.name] = null;
                    return;
                }

                nB = (1 + 1 / currentKappa) * Math.pow(currentStdDev * (z_alpha_half + z_beta) / currentEffectSize, 2);

                if (nB !== null && nB > 0) {
                    point[scenario.name] = Math.ceil(nB);
                } else {
                    point[scenario.name] = null;
                }
            });
            data.push(point);
        }
        setPlotData(data);
    }, [params, xAxisMin, xAxisMax, xAxisVar]);

    const handleCalculate = () => {
        if (!validate()) return;

        const { alpha, power, sampleSizeB, meanA, meanB, stdDev, kappa } = params;
        
        if (solveFor === 'power') {
            if (sampleSizeB && sampleSizeB > 0 && kappa > 0) {
                const nB = sampleSizeB;
                const nA = kappa * nB;
                const z = (meanA - meanB) / (stdDev * Math.sqrt(1/nA + 1/nB));
                const z_alpha_half = jStat.normal.inv(1 - alpha / 2, 0, 1);
                
                const calculatedPower = jStat.normal.cdf(z - z_alpha_half, 0, 1) + jStat.normal.cdf(-z - z_alpha_half, 0, 1);
                
                const formattedPower = calculatedPower.toFixed(4);
                if (params.power !== formattedPower) {
                    setParams(p => ({ ...p, power: formattedPower }));
                }
            } else {
                setParams(p => ({...p, power: null}));
            }
        } else { // solveFor === 'sampleSizeB'
            const powerValue = power ? parseFloat(power) : null;
            if (powerValue && powerValue > 0 && powerValue < 1 && meanA !== meanB && kappa > 0 && stdDev > 0) {
                const z_alpha_half = jStat.normal.inv(1 - alpha / 2, 0, 1);
                const z_beta = jStat.normal.inv(powerValue, 0, 1);
                
                const nB = (1 + 1 / kappa) * Math.pow(stdDev * (z_alpha_half + z_beta) / (meanA - meanB), 2);
                const nB_ceil = Math.ceil(nB);
                
                if (params.sampleSizeB !== nB_ceil) {
                    setParams(p => ({ ...p, sampleSizeB: nB_ceil }));
                }
            } else {
                setParams(p => ({...p, sampleSizeB: null}));
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
        { name: 'sampleSizeB', label: 'Sample Size (Group B, n_B)', type: 'number' as const, solve: 'sampleSize' as const },
        { name: 'alpha', label: 'Alpha (α)', type: 'number' as const },
        { name: 'meanA', label: 'Mean (Group A, μ_A)', type: 'number' as const },
        { name: 'meanB', label: 'Mean (Group B, μ_B)', type: 'number' as const },
        { name: 'stdDev', label: 'Standard Deviation (σ)', type: 'number' as const },
        { name: 'kappa', label: 'Allocation Ratio (κ=n_A/n_B)', type: 'number' as const },
    ];

    const xAxisOptions = inputFields
        .filter(field => !['alpha', 'power', 'sampleSizeB'].includes(field.name))
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
                                solveForOptions={[
                                    { value: 'sampleSizeB', label: 'Sample Size' },
                                    { value: 'power', label: 'Power' }
                                ]}
                            />
                             <div className="space-y-2 mt-4">
                                <Label htmlFor="sampleSizeA">Sample Size (Group A, n_A)</Label>
                                <Input
                                    id="sampleSizeA"
                                    type="number"
                                    value={params.sampleSizeA ?? ""}
                                    readOnly
                                    disabled
                                    className="bg-gray-100"
                                />
                            </div>
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
                                yAxisLabel="Sample Size (Group B, n_B)"
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
                    title="Calculate Sample Size Needed to Compare 2 Means: 2-Sample, 2-Sided Equality"
                    summary={`This calculator is useful for tests concerning whether the means of two groups are different. Suppose the two groups are 'A' and 'B', and we collect a sample from both groups -- i.e. we have two samples. We perform a two-sample test to determine whether the mean in group A, $\\mu_A$, is different from the mean in group B, $\\mu_B$. The hypotheses are
$H_0: \\mu_A - \\mu_B = 0$
$H_1: \\mu_A - \\mu_B \\neq 0$
where the ratio between the sample sizes of the two groups is
$$\\kappa=\\frac{n_A}{n_B}$$`}
                    formulas={`This calculator uses the following formulas to compute sample size and power, respectively:
$$ n_A=\\kappa n_B \\;\\text{ and }\\; n_B=\\left(1+\\frac{1}{\\kappa}\\right) \\left(\\sigma\\frac{z_{1-\\alpha/2}+z_{1-\\beta}}{\\mu_A-\\mu_B}\\right)^2$$
$$1-\\beta= \\Phi\\left(z-z_{1-\\alpha/2}\\right)+\\Phi\\left(-z-z_{1-\\alpha/2}\\right) \\quad ,\\quad z=\\frac{\\mu_A-\\mu_B}{\\sigma\\sqrt{\\frac{1}{n_A}+\\frac{1}{n_B}}}$$
where:
$\\kappa=n_A/n_B$ is the matching ratio
$\\sigma$ is standard deviation
$\\Phi$ is the standard Normal distribution function
$\\Phi^{-1}$ is the standard Normal quantile function
$\\alpha$ is Type I error
$\\beta$ is Type II error, meaning $1-\\beta$ is power`}
                    rCode={`R code to implement these functions:

muA=5
muB=10
kappa=1
sd=10
alpha=0.05
beta=0.20
(nB=(1+1/kappa)*(sd*(qnorm(1-alpha/2)+qnorm(1-beta))/(muA-muB))^2)
ceiling(nB) # 63
z=(muA-muB)/(sd*sqrt((1+1/kappa)/nB))
(Power=pnorm(z-qnorm(1-alpha/2))+pnorm(-z-qnorm(1-alpha/2)))`}
                    references={[
                        "Chow S, Shao J, Wang H. 2008. Sample Size Calculations in Clinical Research. 2nd Ed. Chapman & Hall/CRC Biostatistics Series. page 58."
                    ]}
                />
            </div>
        </div>
    );
}
