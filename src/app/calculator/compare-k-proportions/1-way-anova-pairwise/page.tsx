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
    pA: number;
    pB: number;
    tau: number;
};

type PlotDataPoint = {
    [key: string]: number | null;
};

type ValidationErrors = {
    power?: string;
    pA?: string;
    pB?: string;
    tau?: string;
};

export default function CompareKProportions1WayAnovaPairwise() {
    const [solveFor, setSolveFor] = useState<string>("sampleSize");
    const [params, setParams] = useState<CalcParams>({
        power: "0.8000",
        sampleSize: 96,
        alpha: 0.05,
        pA: 0.2,
        pB: 0.4,
        tau: 2,
    });
    const [plotData, setPlotData] = useState<PlotDataPoint[]>([]);
    const [xAxisVar, setXAxisVar] = useState<string>("pA");
    const [xAxisMin, setXAxisMin] = useState<number>(0);
    const [xAxisMax, setXAxisMax] = useState<number>(0);
    const [yAxisVars, setYAxisVars] = useState<string[]>([]);
    const [lineColors, setLineColors] = useState<{ [key: string]: string }>({});
    const [errors, setErrors] = useState<ValidationErrors>({});

    useEffect(() => {
        const { pA, pB, tau } = params;
        if (xAxisVar === 'pA' || xAxisVar === 'pB') {
            const val = xAxisVar === 'pA' ? pA : pB;
            setXAxisMin(Math.max(0.01, val * 0.5));
            setXAxisMax(Math.min(0.99, val * 1.5));
        } else if (xAxisVar === 'tau') {
            setXAxisMin(1);
            setXAxisMax(Math.max(10, tau * 2));
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
        if (params.pA <= 0 || params.pA >= 1) {
            newErrors.pA = "Proportion A must be between 0 and 1.";
        }
        if (params.pB <= 0 || params.pB >= 1) {
            newErrors.pB = "Proportion B must be between 0 and 1.";
        }
        if (params.pA === params.pB) {
            const errorMessage = "Proportions A and B cannot be equal.";
            newErrors.pA = errorMessage;
            newErrors.pB = errorMessage;
        }
        if (params.tau <= 0) {
            newErrors.tau = "Number of comparisons must be positive.";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const updatePlotData = useCallback(() => {
        const { alpha, power, pA, pB, tau } = params;
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

        const calculateN = (currentPower: number, currentAlpha: number, currentPA: number, currentPB: number, currentTau: number): number | null => {
            if (currentPA <= 0 || currentPA >= 1 || currentPB <= 0 || currentPB >= 1 || currentPA === currentPB || currentTau <= 0) return null;
            const z_alpha_tau = jStat.normal.inv(1 - currentAlpha / (2 * currentTau), 0, 1);
            const z_beta = jStat.normal.inv(currentPower, 0, 1);
            const numerator = (currentPA * (1 - currentPA) + currentPB * (1 - currentPB)) * Math.pow(z_alpha_tau + z_beta, 2);
            const denominator = Math.pow(currentPA - currentPB, 2);
            const n = numerator / denominator;
            return Math.ceil(n);
        };

        for (let i = 0; i < 100; i++) {
            const x = xAxisMin + (xAxisMax - xAxisMin) * (i / 99);
            const point: PlotDataPoint = { [xAxisVar]: x };
            
            powerScenarios.forEach(scenario => {
                let sampleSize: number | null = null;
                let currentPA = pA;
                let currentPB = pB;
                let currentTau = tau;

                if (xAxisVar === 'pA') {
                    currentPA = x;
                } else if (xAxisVar === 'pB') {
                    currentPB = x;
                } else if (xAxisVar === 'tau') {
                    currentTau = Math.round(x);
                }
                
                sampleSize = calculateN(scenario.value, alpha, currentPA, currentPB, currentTau);
                
                point[scenario.name] = sampleSize && sampleSize > 0 ? sampleSize : null;
            });
            data.push(point);
        }
        setPlotData(data);
    }, [params, xAxisMin, xAxisMax, xAxisVar]);

    const handleCalculate = () => {
        if (!validate()) return;

        const { alpha, power, sampleSize, pA, pB, tau } = params;
        
        if (solveFor === 'power') {
            if (sampleSize && sampleSize > 0) {
                const z_alpha_tau = jStat.normal.inv(1 - alpha / (2 * tau), 0, 1);
                const numerator = Math.abs(pA - pB);
                const denominator = Math.sqrt((pA * (1 - pA) + pB * (1 - pB)) / sampleSize);
                const z = numerator / denominator;
                const calculatedPower = jStat.normal.cdf(z - z_alpha_tau, 0, 1) + jStat.normal.cdf(-z - z_alpha_tau, 0, 1);
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
                const z_alpha_tau = jStat.normal.inv(1 - alpha / (2 * tau), 0, 1);
                const z_beta = jStat.normal.inv(powerValue, 0, 1);
                const numerator = (pA * (1 - pA) + pB * (1 - pB)) * Math.pow(z_alpha_tau + z_beta, 2);
                const denominator = Math.pow(pA - pB, 2);
                const calculatedSize = numerator / denominator;
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
        { name: 'sampleSize', label: 'Sample Size per Group (n)', type: 'number' as const, solve: 'sampleSize' as const },
        { name: 'alpha', label: 'Type I error rate (α)', type: 'number' as const },
        { name: 'pA', label: 'Group A Proportion (p_A)', type: 'number' as const },
        { name: 'pB', label: 'Group B Proportion (p_B)', type: 'number' as const },
        { name: 'tau', label: 'Number of Pairwise Comparisons (τ)', type: 'number' as const },
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
                                yAxisLabel="Sample Size per Group (n)"
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
                    title="Calculate Sample Size Needed to Compare k Proportions: 1-Way ANOVA Pairwise"
                    summary={`This calculator is useful for tests concerning whether the proportions in several groups are equal. The statistical model is called an Analysis of Variance, or ANOVA model. This calculator is for the particular situation where we wish to make pairwise comparisons between groups. That is, we test for equality between two groups at a time, and we make several of these comparisons.

For example, suppose we want to compare the proportions in three groups called foo, bar, and ack. These groups may represent groups of people that have been exposed to three different medical procedures, marketing schemes, etc. The complete list of pairwise comparisons are foo vs. bar, foo vs. ack, and bar vs. ack.

In more general terms, we may have $k$ groups, meaning there are a total of $K \\equiv \\binom{k}{2}=k(k-1)/2$ possible pairwise comparisons. When we test $\\tau \\le K$ of these pairwise comparisons, we have $\\tau$ hypotheses of the form:

$H_0: p_A = p_B$

$H_1: p_A \\ne p_B$

where $p_A$ and $p_B$ represent the proportions in two of the $k$ groups, groups 'A' and 'B'. We'll compute the required sample size for each of the $\\tau$ comparisons, and total sample size needed is the largest of these. In the formula below, $n$ represents the sample size in any one of these $\\tau$ comparisons; that is, there are $n/2$ people in the 'A' group, and $n/2$ people in the 'B' group.`}
                    formulas={`This calculator uses the following formulas to compute sample size and power, respectively:

$n = \\left(p_A(1-p_A) + p_B(1-pB)\\right) \\left(\\frac{z_{1-\\alpha/(2\\tau)} + z_{1-\\beta}}{p_A - pB}\\right)^2$

$1-\\beta = \\Phi\\left(z - z_{1-\\alpha/(2\\tau)}\\right) + \\Phi\\left(-z - z_{1-\\alpha/(2\\tau)}\\right)$

$z = \\frac{p_A - p_B}{\\sqrt{\\frac{p_A(1-p_A)}{n} + \\frac{p_B(1-pB)}{n}}}$

where:

$n$ is sample size
$\\Phi$ is the standard Normal distribution function
$\\Phi^{-1}$ is the standard Normal quantile function
$\\alpha$ is Type I error
$\\tau$ is the number of comparisons to be made
$\\beta$ is Type II error, meaning $1-\\beta$ is power`}
                    rCode={`pA=0.2
pB=0.4
tau=2
alpha=0.05
beta=0.20
(n=(pA*(1-pA)+pB*(1-pB))*((qnorm(1-alpha/2/tau)+qnorm(1-beta))/(pA-pB))^2)
ceiling(n) # 96
z=(pA-pB)/sqrt(pA*(1-pA)/n+pB*(1-pB)/n)
(Power=pnorm(z-qnorm(1-alpha/2/tau))+pnorm(-z-qnorm(1-alpha/2/tau)))`}
                    references={[
                        "Chow S, Shao J, Wang H. 2008. Sample Size Calculations in Clinical Research. 2nd Ed. Chapman & Hall/CRC Biostatistics Series. page 100."
                    ]}
                />
            </div>
        </div>
    );
}
