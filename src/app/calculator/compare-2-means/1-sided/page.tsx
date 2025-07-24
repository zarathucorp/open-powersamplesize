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
    sampleSizeA: number | null;
    meanA: number;
    meanB: number;
    stdDevA: number;
    stdDevB: number;
    kappa: number;
};

type PlotDataPoint = {
    [key: string]: number | null;
};

type ValidationErrors = {
    power?: string;
    kappa?: string;
}

export default function Compare2Means1SidedPage() {
    const [solveFor, setSolveFor] = useState<string>("sampleSizeA");
    const [params, setParams] = useState<CalcParams>({
        power: "0.8000",
        sampleSizeA: 85,
        alpha: 0.05,
        meanA: 132.86,
        meanB: 127.44,
        stdDevA: 15.34,
        stdDevB: 18.23,
        kappa: 2,
    });
    const [plotData, setPlotData] = useState<PlotDataPoint[]>([]);
    const [xAxisVar, setXAxisVar] = useState<string>("meanA");
    const [xAxisMin, setXAxisMin] = useState<number>(130);
    const [xAxisMax, setXAxisMax] = useState<number>(135);
    const [yAxisVars, setYAxisVars] = useState<string[]>([]);
    const [lineColors, setLineColors] = useState<{ [key: string]: string }>({});
    const [errors, setErrors] = useState<ValidationErrors>({});

    const sampleSizeB = params.sampleSizeA ? Math.ceil(params.sampleSizeA * params.kappa) : null;
    const totalSampleSize = params.sampleSizeA && sampleSizeB ? params.sampleSizeA + sampleSizeB : null;

    useEffect(() => {
        if (xAxisVar === 'meanA') {
            setXAxisMin(130);
            setXAxisMax(135);
        } else if (xAxisVar === 'meanB') {
            setXAxisMin(125);
            setXAxisMax(130);
        } else if (xAxisVar === 'stdDevA') {
            setXAxisMin(14);
            setXAxisMax(16);
        } else if (xAxisVar === 'stdDevB') {
            setXAxisMin(17);
            setXAxisMax(19);
        } else if (xAxisVar === 'kappa') {
            setXAxisMin(1);
            setXAxisMax(3);
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
        if (params.kappa <= 0) {
            newErrors.kappa = "Ratio must be greater than 0.";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    const updatePlotData = useCallback(() => {
        const { alpha, power, meanA, meanB, stdDevA, stdDevB, kappa } = params;
        const data = [];
        const effectSize = meanA - meanB;

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
                let nA: number | null = null;
                let currentRatio = kappa;
                if (xAxisVar === 'meanA') {
                    if (x !== meanB) {
                        nA = (stdDevA*stdDevA + stdDevB*stdDevB/kappa) * Math.pow((jStat.normal.inv(1 - alpha, 0, 1) + jStat.normal.inv(scenario.value, 0, 1)) / (x - meanB), 2);
                    }
                } else if (xAxisVar === 'meanB') {
                    if (meanA !== x) {
                        nA = (stdDevA*stdDevA + stdDevB*stdDevB/kappa) * Math.pow((jStat.normal.inv(1 - alpha, 0, 1) + jStat.normal.inv(scenario.value, 0, 1)) / (meanA - x), 2);
                    }
                } else if (xAxisVar === 'stdDevA') {
                    if (effectSize !== 0 && x > 0) {
                        nA = (x*x + stdDevB*stdDevB/kappa) * Math.pow((jStat.normal.inv(1 - alpha, 0, 1) + jStat.normal.inv(scenario.value, 0, 1)) / effectSize, 2);
                    }
                } else if (xAxisVar === 'stdDevB') {
                    if (effectSize !== 0 && x > 0) {
                        nA = (stdDevA*stdDevA + x*x/kappa) * Math.pow((jStat.normal.inv(1 - alpha, 0, 1) + jStat.normal.inv(scenario.value, 0, 1)) / effectSize, 2);
                    }
                } else if (xAxisVar === 'kappa') {
                    if (effectSize !== 0 && x > 0) {
                        currentRatio = x;
                        nA = (stdDevA*stdDevA + stdDevB*stdDevB/x) * Math.pow((jStat.normal.inv(1 - alpha, 0, 1) + jStat.normal.inv(scenario.value, 0, 1)) / effectSize, 2);
                    }
                }

                if (nA !== null && nA > 0) {
                    const nB = currentRatio * nA;
                    point[scenario.name] = Math.ceil(nA) + Math.ceil(nB);
                } else {
                    point[scenario.name] = null;
                }
            });
            data.push(point);
        }
        setPlotData(data);
    }, [params, xAxisMin, xAxisMax, xAxisVar, solveFor]);

    const handleCalculate = () => {
        if (!validate()) return;

        const { alpha, power, sampleSizeA, meanA, meanB, stdDevA, stdDevB, kappa } = params;

        if (solveFor === 'power') {
            if (sampleSizeA && sampleSizeA > 0) {
                const nA = sampleSizeA;
                const nB = Math.ceil(nA * kappa);
                const se = Math.sqrt(stdDevA*stdDevA/nA + stdDevB*stdDevB/nB);
                const z = Math.abs(meanA - meanB) / se;
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
            if (powerValue && powerValue > 0 && powerValue < 1 && meanA !== meanB) {
                const nA = (stdDevA*stdDevA + stdDevB*stdDevB/kappa) * Math.pow((jStat.normal.inv(1 - alpha, 0, 1) + jStat.normal.inv(powerValue, 0, 1)) / (meanA - meanB), 2);
                const ceiledNA = Math.ceil(nA);
                if (params.sampleSizeA !== ceiledNA) {
                    setParams(p => ({ ...p, sampleSizeA: ceiledNA }));
                }
            } else {
                setParams(p => ({...p, sampleSizeA: null}));
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
        { name: 'sampleSizeA', label: 'Sample Size (n_A)', type: 'number' as const, solve: 'sampleSize' as const },
        { name: 'alpha', label: 'Type I error rate (α)', type: 'number' as const, step: 0.01 },
        { name: 'meanA', label: 'Group A mean (μ_A)', type: 'number' as const },
        { name: 'meanB', label: 'Group B mean (μ_B)', type: 'number' as const },
        { name: 'stdDevA', label: 'Group A Standard Deviation (σ_A)', type: 'number' as const },
        { name: 'stdDevB', label: 'Group B Standard Deviation (σ_B)', type: 'number' as const },
        { name: 'kappa', label: 'Sampling Ratio (κ=n_B/n_A)', type: 'number' as const, step: 0.1 },
    ];

    const xAxisOptions = inputFields
        .filter(field => !['alpha', 'power', 'sampleSizeA'].includes(field.name))
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
                                    { value: 'sampleSizeA', label: 'Sample Size' },
                                    { value: 'power', label: 'Power' }
                                ]}
                            />
                            {solveFor === 'sampleSizeA' && (
                                <div className="mt-4 space-y-2 text-sm">
                                    <p>Group B Sample Size (nB): {sampleSizeB}</p>
                                    <p>Total Sample Size (N): {totalSampleSize}</p>
                                </div>
                            )}
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
                                yAxisLabel="Total Sample Size (N)"
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
                    title="Calculate Sample Size for Comparing 2 Means: 1-Sided"
                    summary={`This calculator is useful for the tests concerning whether the means of two groups are different. Suppose the two groups are 'A' and 'B', and we collect a sample from both groups -- i.e. we have two samples. We perform a two-sample test to determine whether the mean in group A, $\\mu_A$, is different from the mean in group B, $\\mu_B$. The hypotheses are:
$H_0: \\mu_A = \\mu_B \\\\ H_1: \\mu_A > \\mu_B$
or
$H_0: \\mu_A = \\mu_B \\\\ H_1: \\mu_A < \\mu_B$
where the ratio between the sample sizes of the two groups is $\\kappa = n_B/n_A$`}
                    formulas={`This calculator uses the following formulas to compute sample size and power, respectively:
$n_A = (\\sigma_A^2 + \\frac{\\sigma_B^2}{\\kappa}) \\left( \\frac{z_{1-\\alpha} + z_{1-\\beta}}{\\mu_A - \\mu_B} \\right)^2$
$n_B = \\kappa \\cdot n_A$
$1-\\beta = \\Phi\\left( \\frac{|\\mu_A - \\mu_B|\\sqrt{n_A}}{\\sqrt{\\sigma_A^2 + \\sigma_B^2/\\kappa}} - z_{1-\\alpha} \\right)$
where:
- $\\kappa = n_B/n_A$ is the matching ratio
- $\\sigma_A$ and $\\sigma_B$ are standard deviations of group A and B
- $\\Phi$ is the standard Normal distribution function
- $\\Phi^{-1}$ is the standard Normal quantile function
- $\\alpha$ is Type I error
- $\\beta$ is Type II error, meaning $1-\\beta$ is power`}
                    rCode={`muA <- 132.86
muB <- 127.44
sdA <- 15.34
sdB <- 18.23
kappa <- 2
alpha <- 0.05
beta <- 0.20
nA <- (sdA^2 + sdB^2/kappa) * ((qnorm(1 - alpha) + qnorm(1 - beta)) / (muA - muB))^2
ceiling(nA) # 85
nB <- kappa * nA
ceiling(nB) # 170
z <- (muA - muB) / sqrt(sdA^2/nA + sdB^2/nB)
(Power <- pnorm(z - qnorm(1 - alpha)))`}
                    references={[
                        "Chow S, Shao J, Wang H. 2008. Sample Size Calculations in Clinical Research. 2nd Ed. Chapman & Hall/CRC Biostatistics Series. page 58.",
                        "Rosner B. 2010. Fundamentals of Biostatistics. 7th Ed. Brooks/Cole. page 302 and 303."
                    ]}
                />
            </div>
        </div>
    );
}
