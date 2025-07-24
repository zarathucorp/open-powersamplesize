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
    delta: number;
    kappa: number;
};

type PlotDataPoint = {
    [key: string]: number | null;
};

type ValidationErrors = {
    power?: string;
    pA?: string;
    pB?: string;
    delta?: string;
    kappa?: string;
};

export default function OddsRatioNonInferioritySuperiorityCalculator() {
    const [solveFor, setSolveFor] = useState<string>("sampleSize");
    const [params, setParams] = useState<CalcParams>({
        power: "0.8000",
        sampleSize: 242,
        alpha: 0.05,
        pA: 0.40,
        pB: 0.25,
        delta: 0.20,
        kappa: 1,
    });
    const [plotData, setPlotData] = useState<PlotDataPoint[]>([]);
    const [xAxisVar, setXAxisVar] = useState<string>("pA");
    const [xAxisMin, setXAxisMin] = useState<number>(0);
    const [xAxisMax, setXAxisMax] = useState<number>(0);
    const [yAxisVars, setYAxisVars] = useState<string[]>([]);
    const [lineColors, setLineColors] = useState<{ [key: string]: string }>({});
    const [errors, setErrors] = useState<ValidationErrors>({});

    useEffect(() => {
        const { delta, kappa } = params;
        if (xAxisVar === 'delta') {
            setXAxisMin(Math.max(0.01, delta * 0.5));
            setXAxisMax(delta * 1.5);
        } else if (xAxisVar === 'pA') {
            setXAxisMin(0.01);
            setXAxisMax(0.99);
        } else if (xAxisVar === 'pB') {
            setXAxisMin(0.01);
            setXAxisMax(0.99);
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
        if (params.pA <= 0 || params.pA >= 1) {
            newErrors.pA = "p(A) must be between 0 and 1.";
        }
        if (params.pB <= 0 || params.pB >= 1) {
            newErrors.pB = "p(B) must be between 0 and 1.";
        }
        if (params.kappa <= 0) {
            newErrors.kappa = "Sample size ratio must be > 0.";
        }
        const OR = (params.pA * (1 - params.pB)) / (params.pB * (1 - params.pA));
        if (Math.log(OR) - params.delta === 0) {
            newErrors.delta = "log(OR) cannot be equal to the margin δ.";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const updatePlotData = useCallback(() => {
        const { alpha, power, pA, pB, delta, kappa } = params;
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
                const z_beta = jStat.normal.inv(scenario.value, 0, 1);

                let currentPA = pA;
                let currentPB = pB;
                let currentDelta = delta;
                let currentKappa = kappa;

                if (xAxisVar === 'pA') currentPA = x;
                else if (xAxisVar === 'pB') currentPB = x;
                else if (xAxisVar === 'delta') currentDelta = x;
                else if (xAxisVar === 'kappa') currentKappa = x;

                if (currentPA <= 0 || currentPA >= 1 || currentPB <= 0 || currentPB >= 1 || currentKappa <= 0) {
                    point[scenario.name] = null;
                    return;
                }

                const OR = (currentPA * (1 - currentPB)) / (currentPB * (1 - currentPA));
                if (OR <= 0) {
                    point[scenario.name] = null;
                    return;
                }
                const logOR = Math.log(OR);

                if (logOR - currentDelta === 0) {
                    point[scenario.name] = null;
                    return;
                }

                const term1 = 1 / (currentKappa * currentPA * (1 - currentPA)) + 1 / (currentPB * (1 - currentPB));
                const term2 = Math.pow((z_alpha + z_beta) / (logOR - currentDelta), 2);
                const calculatedN = term1 * term2;
                
                sampleSize = Math.ceil(calculatedN);

                point[scenario.name] = sampleSize && sampleSize > 0 ? sampleSize : null;
            });
            data.push(point);
        }
        setPlotData(data);
    }, [params, xAxisMin, xAxisMax, xAxisVar]);

    const handleCalculate = () => {
        if (!validate()) return;

        const { alpha, power, sampleSize, pA, pB, delta, kappa } = params;
        
        if (solveFor === 'power') {
            if (sampleSize && sampleSize > 0) {
                const z_alpha = jStat.normal.inv(1 - alpha, 0, 1);
                const OR = (pA * (1 - pB)) / (pB * (1 - pA));
                const logOR = Math.log(OR);

                const numerator = (logOR - delta) * Math.sqrt(sampleSize);
                const denominator = Math.sqrt(1 / (kappa * pA * (1 - pA)) + 1 / (pB * (1 - pB)));
                const z = numerator / denominator;
                
                const calculatedPower = jStat.normal.cdf(z - z_alpha, 0, 1);

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
                const OR = (pA * (1 - pB)) / (pB * (1 - pA));
                const logOR = Math.log(OR);

                const term1 = 1 / (kappa * pA * (1 - pA)) + 1 / (pB * (1 - pB));
                const term2 = Math.pow((z_alpha + z_beta) / (logOR - delta), 2);
                const calculatedSize = term1 * term2;
                
                if (params.sampleSize !== Math.ceil(calculatedSize)) {
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
        { name: 'sampleSize', label: 'Sample Size (n_B)', type: 'number' as const, solve: 'sampleSize' as const },
        { name: 'alpha', label: 'Type I error rate (α)', type: 'number' as const },
        { name: 'pA', label: 'Group A Proportion (p_A)', type: 'number' as const },
        { name: 'pB', label: 'Group B Proportion (p_B)', type: 'number' as const },
        { name: 'delta', label: 'Non-inferiority or Superiority Margin (δ)', type: 'number' as const },
        { name: 'kappa', label: 'Sampling Ratio (κ = n_A/n_B)', type: 'number' as const },
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
                    title="Calculate Sample Size Needed to Test Odds Ratio: Non-Inferiority or Superiority"
                    summary={`This calculator is useful for the types of tests known as non-inferiority and superiority tests. Whether the null hypothesis represents 'non-inferiority' or 'superiority' depends on the context and whether the non-inferiority/superiority margin, $\\delta$, is positive or negative. In this setting, we wish to test whether the odds of an outcome in group 'A', $p_A(1-p_A)$, is non-inferior/superior to the odds of the outcome in group 'B', $p_B(1-p_B)$, where $p_A$ and $p_B$ are the probabilities of the outcome in the two groups. We collect a sample from both groups, and thus will conduct a two-sample test. The idea is that statistically significant differences between the proportions may not be of interest unless the difference is greater than a threshold. This is particularly popular in clinical studies, where the margin is chosen based on clinical judgement and subject-domain knowledge. The hypotheses to test are

$H_0:\\ln(OR)\\le\\delta$
$H_1:\\ln(OR)>\\delta$

where $\\delta$ is the superiority or non-inferiority margin on the log scale, and the ratio between the sample sizes of the two groups is
$\\kappa=\\frac{n_A}{n_B}$`}
                    formulas={`This calculator uses the following formulas to compute sample size and power, respectively:
                      
$ n_A=\\kappa n_B \\;\\text{ and }\\; n_B=\\left(\\frac{1}{\\kappa p_A(1-p_A)}+\\frac{1}{p_B(1-pB)}\\right) \\left(\\frac{z_{1-\\alpha}+z_{1-\\beta}}{\\ln(OR)-\\delta}\\right)^2$
$1-\\beta= \\Phi\\left(z-z_{1-\\alpha}\\right)+\\Phi\\left(-z-z_{1-\\alpha}\\right) \\quad ,\\quad z=\\frac{(\\ln(OR)-\\delta)\\sqrt{n_B}}{\\sqrt{\\frac{1}{\\kappa p_A(1-p_A)}+\\frac{1}{p_B(1-pB)}}}$
where
$OR=\\frac{p_A(1-p_B)}{p_B(1-p_A)}$
and where

$\\kappa=n_A/n_B$ is the matching ratio
$\\Phi$ is the standard Normal distribution function
$\\Phi^{-1}$ is the standard Normal quantile function
$\\alpha$ is Type I error
$\\beta$ is Type II error, meaning $1-\\beta$ is power
$\\delta$ is the testing margin`}
                    rCode={`pA=0.40
pB=0.25
delta=0.20
kappa=1
alpha=0.05
beta=0.20
(OR=pA*(1-pB)/pB/(1-pA)) # 2
(nB=(1/(kappa*pA*(1-pA))+1/(pB*(1-pB)))*((qnorm(1-alpha)+qnorm(1-beta))/(log(OR)-delta))^2)
ceiling(nB) # 242
z=(log(OR)-delta)*sqrt(nB)/sqrt(1/(kappa*pA*(1-pA))+1/(pB*(1-pB)))
(Power=pnorm(z-qnorm(1-alpha))+pnorm(-z-qnorm(1-alpha)))`}
                    references={[
                        "Chow S, Shao J, Wang H. 2008. Sample Size Calculations in Clinical Research. 2nd Ed. Chapman & Hall/CRC Biostatistics Series. page 107."
                    ]}
                />
            </div>
        </div>
    );
}
