"use client";

import { useState, useEffect } from "react";
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
    tau: number;
};

type ValidationErrors = {
    power?: string;
    muB?: string;
    stdDev?: string;
    tau?: string;
};

export default function CompareKMeansAnovaPairwise2SidedEquality() {
    const [solveFor, setSolveFor] = useState<string>("sampleSize");
    const [params, setParams] = useState<CalcParams>({
        power: "0.8000",
        sampleSize: 63,
        alpha: 0.05,
        muA: 5,
        muB: 10,
        stdDev: 10,
        tau: 1,
    });
    const [plotData, setPlotData] = useState<any[]>([]);
    const [xAxisVar, setXAxisVar] = useState<string>("muA");
    const [xAxisMin, setXAxisMin] = useState<number>(0);
    const [xAxisMax, setXAxisMax] = useState<number>(0);
    const [yAxisVars, setYAxisVars] = useState<string[]>([]);
    const [lineColors, setLineColors] = useState<{ [key: string]: string }>({});
    const [errors, setErrors] = useState<ValidationErrors>({});

    useEffect(() => {
        const { muA, muB, stdDev, tau } = params;
        const delta = Math.abs(muA - muB);

        if (xAxisVar === 'muA') {
            setXAxisMin(Math.max(0.1, muA - 2));
            setXAxisMax(muA + 2);
        } else if (xAxisVar === 'muB') {
            setXAxisMin(Math.max(0.1, muB - 2));
            setXAxisMax(muB + 2);
        } else if (xAxisVar === 'delta') {
            setXAxisMin(Math.max(0.1, delta * 0.5));
            setXAxisMax(delta * 1.5);
        } else if (xAxisVar === 'stdDev') {
            setXAxisMin(Math.max(0.1, stdDev * 0.5));
            setXAxisMax(stdDev * 1.5);
        } else if (xAxisVar === 'tau') {
            setXAxisMin(1);
            setXAxisMax(Math.max(10, tau * 2));
        }
    }, [xAxisVar, params.muA, params.muB, params.stdDev, params.tau]);

    const validate = () => {
        const newErrors: ValidationErrors = {};
        if (params.power) {
            const powerValue = parseFloat(params.power);
            if (powerValue <= 0 || powerValue >= 1) {
                newErrors.power = "Power must be between 0 and 1.";
            }
        }
        if (params.stdDev <= 0) {
            newErrors.stdDev = "Standard deviation must be greater than 0.";
        }
        if (params.tau < 1) {
            newErrors.tau = "Number of comparisons must be at least 1.";
        }
        if (params.muA === params.muB) {
            newErrors.muB = "Means cannot be equal.";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const updatePlotData = () => {
        const { alpha, power, muA, muB, stdDev, tau } = params;
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

        // Calculate으로 생성된 power는 항상 #8884d8 색상을 사용합니다.
        powerScenarios.forEach((scenario, i) => {
            newColors[scenario.name] = colors[i % colors.length];
        });

        setYAxisVars(powerScenarios.map(s => s.name));
        setLineColors(newColors);

        for (let i = 0; i < 100; i++) {
            const x = xAxisMin + (xAxisMax - xAxisMin) * (i / 99);
            let point: any = { [xAxisVar]: x };
            
            powerScenarios.forEach(scenario => {
                let sampleSize: number | null = null;
                const currentPower = scenario.value;
                const z2 = jStat.normal.inv(currentPower, 0, 1);
                let n: number | null = null;

                if (xAxisVar === 'muA') {
                    const muA = x;
                    if (muA !== muB) {
                        const z1 = jStat.normal.inv(1 - alpha / (2 * tau), 0, 1);
                        n = 2 * Math.pow(stdDev * (z1 + z2) / Math.abs(muA - muB), 2);
                    }
                } else if (xAxisVar === 'muB') {
                    const muB = x;
                    if (muA !== muB) {
                        const z1 = jStat.normal.inv(1 - alpha / (2 * tau), 0, 1);
                        n = 2 * Math.pow(stdDev * (z1 + z2) / Math.abs(muA - muB), 2);
                    }
                } else if (xAxisVar === 'delta') {
                    const delta = x;
                    if (delta > 0) {
                        const z1 = jStat.normal.inv(1 - alpha / (2 * tau), 0, 1);
                        n = 2 * Math.pow(stdDev * (z1 + z2) / delta, 2);
                    }
                } else if (xAxisVar === 'stdDev') {
                    const currentStdDev = x;
                    const delta = Math.abs(muA - muB);
                    if (delta > 0 && currentStdDev > 0) {
                        const z1 = jStat.normal.inv(1 - alpha / (2 * tau), 0, 1);
                        n = 2 * Math.pow(currentStdDev * (z1 + z2) / delta, 2);
                    }
                } else if (xAxisVar === 'tau') {
                    const currentTau = Math.max(1, Math.round(x));
                    point[xAxisVar] = currentTau;
                    const delta = Math.abs(muA - muB);
                    if (delta > 0) {
                        const z1 = jStat.normal.inv(1 - alpha / (2 * currentTau), 0, 1);
                        n = 2 * Math.pow(stdDev * (z1 + z2) / delta, 2);
                    }
                }
                
                sampleSize = n ? Math.ceil(n) : null;
                point[scenario.name] = sampleSize && sampleSize > 0 ? sampleSize : null;
            });
            data.push(point);
        }
        setPlotData(data);
    };

    const handleCalculate = () => {
        if (!validate()) return;

        const { alpha, power, sampleSize, muA, muB, stdDev, tau } = params;
        
        if (solveFor === 'power') {
            if (sampleSize && sampleSize > 0) {
                const z_alpha_tau = jStat.normal.inv(1 - alpha / (2 * tau), 0, 1);
                const z = (muA - muB) / (stdDev * Math.sqrt(2 / sampleSize));
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
                const z1 = jStat.normal.inv(1 - alpha / (2 * tau), 0, 1);
                const z2 = jStat.normal.inv(powerValue, 0, 1);
                const numerator = stdDev * (z1 + z2);
                const denominator = muA - muB;
                const n = 2 * Math.pow(numerator / denominator, 2);
                const calculatedSize = Math.ceil(n);
                if (params.sampleSize !== calculatedSize) {
                    setParams(p => ({ ...p, sampleSize: calculatedSize }));
                }
            } else {
                setParams(p => ({...p, sampleSize: null}));
            }
        }
    };

    useEffect(() => {
        updatePlotData();
    }, [params, xAxisVar, xAxisMin, xAxisMax]);

    const handleParamsChange = (newParams: { [key: string]: any }) => {
        setParams(prevParams => ({ ...prevParams, ...newParams }));
    };

    const inputFields = [
        { name: 'power', label: 'Power (1-β)', type: 'text' as const, solve: 'power' as const },
        { name: 'sampleSize', label: 'Sample Size (n)', type: 'number' as const, solve: 'sampleSize' as const },
        { name: 'alpha', label: 'Alpha (α)', type: 'number' as const },
        { name: 'muA', label: 'Mean of Group A (μA)', type: 'number' as const },
        { name: 'muB', label: 'Mean of Group B (μB)', type: 'number' as const },
        { name: 'stdDev', label: 'Standard Deviation (σ)', type: 'number' as const },
        { name: 'tau', label: 'Number of Comparisons (τ)', type: 'number' as const },
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
                                yAxisLabel="Sample Size (n)" // TODO: Y축 레이블을 조정하세요.
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
                    title="Calculate Sample Size Needed to Compare k Means: 1-Way ANOVA Pairwise, 2-Sided Equality"
                    summary={`This calculator is useful for tests concerning whether the means of several groups are equal. The statistical model is called an Analysis of Variance, or ANOVA model. This calculator is for the particular situation where we wish to make pairwise comparisons between groups. That is, we test for equality between two groups at a time, and we make several of these comparisons.

For example, suppose we want to compare the means of three groups called foo, bar, and ack. These groups may represent groups of people that have been exposed to three different medical procedures, marketing schemes, etc. The complete list of pairwise comparisons are foo vs. bar, foo vs. ack, and bar vs. ack.

In more general terms, we may have $k$ groups, meaning there are a total of $K\\equiv\\binom{k}{2}=k(k-1)/2$ possible pairwise comparisons. When we test $\\tau\\le K$ of these pairwise comparisons, we have $\\tau$ hypotheses of the form


$H_0:\\mu_A=\\mu_B$
$H_1:\\mu_A\\ne\\mu_B$

where $\\mu_A$ and $\\mu_B$ represent the means of two of the $k$ groups, groups 'A' and 'B'. We'll compute the required sample size for each of the $\\tau$ comparisons, and total sample size needed is the largest of these. In the formula below, $n$ represents the sample size in any one of these $\\tau$ comparisons; that is, there are $n/2$ people in the 'A' group, and $n/2$ people in the 'B' group.`}
                    formulas={`This calculator uses the following formulas to compute sample size and power, respectively: 
                      $ n=2\\left(\\sigma\\frac{z_{1-\\alpha/(2\\tau)}+z_{1-\\beta}}{\\mu_A-\\mu_B}\\right)^2$
$1-\\beta= \\Phi\\left(z-z_{1-\\alpha/(2\\tau)}\\right)+\\Phi\\left(-z-z_{1-\\alpha/(2\\tau)}\\right) \\quad ,\\quad z=\\frac{\\mu_A-\\mu_B}{\\sigma\\sqrt{\\frac{2}{n}}}$
where

$n$ is sample size
$\\sigma$ is standard deviation
$\\Phi$ is the standard Normal distribution function
$\\Phi^{-1}$ is the standard Normal quantile function
$\\alpha$ is Type I error
$\\tau$ is the number of comparisons to be made
$\\beta$ is Type II error, meaning $1-\\beta$ is power`}
                    rCode={`muA=5
muB=10
sd=10
tau=1
alpha=0.05
beta=0.20
(n=2*(sd*(qnorm(1-alpha/(2/tau))+qnorm(1-beta))/(muA-muB))^2)
ceiling(n) # 63
z=(muA-muB)/(sd*sqrt(2/n))
(Power=pnorm(z-qnorm(1-alpha/(2/tau)))+pnorm(-z-qnorm(1-alpha/(2/tau))))`}
                    references={[
                        "Chow S, Shao J, Wang H. 2008. Sample Size Calculations in Clinical Research. 2nd Ed. Chapman & Hall/CRC Biostatistics Series. page 71.",
                    ]}
                />
            </div>
        </div>
    );
}
