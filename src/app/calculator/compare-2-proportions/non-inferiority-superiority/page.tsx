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
    nB: number | null;
    pA: number;
    pB: number;
    kappa: number;
    delta: number;
};

type PlotDataPoint = {
    [key: string]: number | null;
};

type ValidationErrors = {
    power?: string;
    alpha?: string;
    pA?: string;
    pB?: string;
    kappa?: string;
    delta?: string;
    nB?: string;
};

const calculateSampleSize = (power: number, pA: number, pB: number, delta: number, kappa: number, alpha: number): number | null => {
    if (pA - pB <= delta || pA <= 0 || pA >= 1 || pB <= 0 || pB >= 1 || kappa <= 0 || power <= 0 || power >= 1 || alpha <= 0 || alpha >= 1) return null;
    const z_alpha = jStat.normal.inv(1 - alpha, 0, 1);
    const z_beta = jStat.normal.inv(power, 0, 1);
    const term1 = (pA * (1 - pA) / kappa) + (pB * (1 - pB));
    const term2 = Math.pow((z_alpha + z_beta) / (pA - pB - delta), 2);
    const nB = term1 * term2;
    return Math.ceil(nB);
};

const calculatePower = (nB: number, pA: number, pB: number, delta: number, kappa: number, alpha: number): number | null => {
    if (nB <= 0 || pA <= 0 || pA >= 1 || pB <= 0 || pB >= 1 || kappa <= 0 || alpha <= 0 || alpha >= 1) return null;
    const nA = kappa * nB;
    const z_alpha = jStat.normal.inv(1 - alpha, 0, 1);
    const numerator = pA - pB - delta;
    const denominator = Math.sqrt((pA * (1 - pA) / nA) + (pB * (1 - pB) / nB));
    if (denominator === 0) return null;
    const z = numerator / denominator;
    const power = jStat.normal.cdf(z - z_alpha, 0, 1);
    return power;
};

export default function Compare2ProportionsNonInferioritySuperiority() {
    const [solveFor, setSolveFor] = useState<string>("sampleSize");
    const [params, setParams] = useState<CalcParams>({
        power: "0.8000",
        nB: 25,
        alpha: 0.05,
        pA: 0.85,
        pB: 0.65,
        kappa: 1,
        delta: -0.10,
    });
    const [plotData, setPlotData] = useState<PlotDataPoint[]>([]);
    const [xAxisVar, setXAxisVar] = useState<string>("pA");
    const [xAxisMin, setXAxisMin] = useState<number>(0);
    const [xAxisMax, setXAxisMax] = useState<number>(0);
    const [yAxisVars, setYAxisVars] = useState<string[]>([]);
    const [lineColors, setLineColors] = useState<{ [key: string]: string }>({});
    const [errors, setErrors] = useState<ValidationErrors>({});

    const validate = () => {
        const newErrors: ValidationErrors = {};
        const { power, alpha, pA, pB, kappa, delta, nB } = params;

        if (power) {
            const powerValue = parseFloat(power);
            if (powerValue <= 0 || powerValue >= 1) {
                newErrors.power = "Power must be between 0 and 1.";
            }
        }
        if (alpha <= 0 || alpha >= 1) {
            newErrors.alpha = "Alpha must be between 0 and 1.";
        }
        if (pA <= 0 || pA >= 1) {
            newErrors.pA = "Proportion A must be between 0 and 1.";
        }
        if (pB <= 0 || pB >= 1) {
            newErrors.pB = "Proportion B must be between 0 and 1.";
        }
        if (kappa <= 0) {
            newErrors.kappa = "Ratio must be > 0.";
        }
        if (pA - pB <= delta) {
            newErrors.delta = "Margin (δ) must be < pA - pB.";
        }
        if (solveFor === 'power' && (!nB || nB <= 0)) {
            newErrors.nB = "Sample Size must be > 0.";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const updatePlotData = useCallback(() => {
        const { alpha, pA, pB, kappa, delta } = params;
        const data = [];

        const powerValue = params.power ? parseFloat(params.power) : null;
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
                let currentPA = pA;
                let currentPB = pB;
                let currentKappa = kappa;
                let currentDelta = delta;

                if (xAxisVar === 'pA') currentPA = x;
                else if (xAxisVar === 'pB') currentPB = x;
                else if (xAxisVar === 'kappa') currentKappa = x;
                else if (xAxisVar === 'delta') currentDelta = x;

                const nB = calculateSampleSize(scenario.value, currentPA, currentPB, currentDelta, currentKappa, alpha);
                point[scenario.name] = nB && nB > 0 ? nB : null;
            });
            data.push(point);
        }
        setPlotData(data);
    }, [params, xAxisMin, xAxisMax, xAxisVar]);

    const handleCalculate = () => {
        if (!validate()) return;

        const { alpha, power, nB, pA, pB, kappa, delta } = params;
        
        if (solveFor === 'power') {
            if (nB && nB > 0) {
                const calculatedPower = calculatePower(nB, pA, pB, delta, kappa, alpha);
                if (calculatedPower) {
                    const formattedPower = calculatedPower.toFixed(4);
                    if (params.power !== formattedPower) {
                        setParams(p => ({ ...p, power: formattedPower }));
                    }
                }
            } else {
                setParams(p => ({...p, power: null}));
            }
        } else { // solveFor === 'sampleSize'
            const powerValue = power ? parseFloat(power) : null;
            if (powerValue && powerValue > 0 && powerValue < 1) {
                const calculatedSize = calculateSampleSize(powerValue, pA, pB, delta, kappa, alpha);
                if (calculatedSize && params.nB !== calculatedSize) {
                    setParams(p => ({ ...p, nB: calculatedSize }));
                }
            } else {
                setParams(p => ({...p, nB: null}));
            }
        }
        updatePlotData();
    };

    useEffect(() => {
        updatePlotData();
    }, [updatePlotData]);

    useEffect(() => {
        const { pA, pB, kappa, delta } = params;
        if (xAxisVar === 'delta') {
            setXAxisMin(delta - 0.1);
            setXAxisMax(delta + 0.1);
        } else if (xAxisVar === 'pA') {
            setXAxisMin(Math.max(0.01, pA * 0.5));
            setXAxisMax(Math.min(0.99, pA * 1.5));
        } else if (xAxisVar === 'pB') {
            setXAxisMin(Math.max(0.01, pB * 0.5));
            setXAxisMax(Math.min(0.99, pB * 1.5));
        } else if (xAxisVar === 'kappa') {
            setXAxisMin(Math.max(0.1, kappa * 0.5));
            setXAxisMax(kappa * 1.5);
        }
    }, [xAxisVar, params]);

    const handleParamsChange = (newParams: { [key: string]: string | number | null }) => {
        setParams(prevParams => ({ ...prevParams, ...newParams }));
    };

    const nA = params.nB && params.kappa ? Math.ceil(params.nB * params.kappa) : null;

    const inputFields = [
        { name: 'power', label: 'Power (1-β)', type: 'text' as const, solve: 'power' as const },
        { name: 'nB', label: 'Sample Size (n_B)', type: 'number' as const, solve: 'sampleSize' as const },
        { name: 'alpha', label: 'Type I error rate (α)', type: 'number' as const },
        { name: 'pA', label: 'Group A Proportion (p_A)', type: 'number' as const },
        { name: 'pB', label: 'Group B Proportion (p_B)', type: 'number' as const },
        { name: 'delta', label: 'Non-inferiority or Superiority Margin (δ)', type: 'number' as const },
        { name: 'kappa', label: 'Sampling Ratio (κ = n_A/n_B)', type: 'number' as const },
    ];

    const xAxisOptions = inputFields
        .filter(field => !['alpha', 'power', 'nB'].includes(field.name))
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
                            {nA !== null && <p className="text-sm mt-4">Sample Size (n_A): {nA}</p>}
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
                                yAxisLabel="Sample Size (n_B)"
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
                    title="Calculate Sample Size Needed to Compare 2 Proportions: 2-Sample Non-Inferiority or Superiority"
                    summary={`This calculator is useful for the types of tests known as non-inferiority and superiority tests. Whether the null hypothesis represents 'non-inferiority' or 'superiority' depends on the context and whether the non-inferiority/superiority margin, $\\delta$, is positive or negative. In this setting, we wish to test whether the proportion in group 'A', $p_A$, is non-inferior/superior to the proportion in group 'B', $p_B$. We collect a sample from both groups, and thus will conduct a two-sample test. The idea is that statistically significant differences between the proportions may not be of interest unless the difference is greater than a threshold, $\\delta$. This is particularly popular in clinical studies, where the margin is chosen based on clinical judgement and subject-domain knowledge. The hypotheses to test are

$H_0: p_A - p_B \\le \\delta$

$H_1: p_A - p_B > \\delta$

where $\\delta$ is the superiority or non-inferiority margin and the ratio between the sample sizes of the two groups is

$\\kappa = \\frac{n_A}{n_B}$`}
                    formulas={`This calculator uses the following formulas to compute sample size and power, respectively:

$n_A = \\kappa n_B \\quad and \\quad n_B = \\left(\\frac{p_A(1-p_A)}{\\kappa}+p_B(1-p_B)\\right) \\left(\\frac{z_{1-\\alpha}+z_{1-\\beta}}{p_A-p_B-\\delta}\\right)^2$

$1-\\beta = \\Phi\\left(z-z_{1-\\alpha/2}\\right)+\\Phi\\left(-z-z_{1-\\alpha/2}\\right)\\quad,\\quad z = \\frac{p_A-p_B-\\delta}{\\sqrt{\\frac{p_A(1-p_A)}{n_A}+\\frac{p_B(1-p_B)}{n_B}}}$

where:

$\\kappa=n_A/n_B$ is the matching ratio

$\\Phi$ is the standard Normal distribution function

$\\Phi^{-1}$ is the standard Normal quantile function

$\\alpha$ is Type I error

$\\beta$ is Type II error, meaning $1-\\beta$ is power

$\\delta$ is the testing margin`}
                    rCode={`pA=0.85
pB=0.65
delta=-0.10
kappa=1
alpha=0.05
beta=0.20
(nB=(pA*(1-pA)/kappa+pB*(1-pB))*((qnorm(1-alpha)+qnorm(1-beta))/(pA-pB-delta))^2)
ceiling(nB) # 25
z=(pA-pB-delta)/sqrt(pA*(1-pA)/nB/kappa+pB*(1-pB)/nB)
(Power=pnorm(z-qnorm(1-alpha))+pnorm(-z-qnorm(1-alpha)))`}
                    references={[
                        "Chow S, Shao J, Wang H. 2008. Sample Size Calculations in Clinical Research. 2nd Ed. Chapman & Hall/CRC Biostatistics Series. page 90."
                    ]}
                />
            </div>
        </div>
    );
}
