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
    p10: number;
    p01: number;
};

type ValidationErrors = {
    power?: string;
    p10?: string;
    p01?: string;
};

export default function McNemar1SidedPage() {
    const [solveFor, setSolveFor] = useState<string>("sampleSize");
    const [params, setParams] = useState<CalcParams>({
        power: "0.8000",
        sampleSize: 23,
        alpha: 0.05,
        p10: 0.05,
        p01: 0.45,
    });
    const [plotData, setPlotData] = useState<any[]>([]);
    const [xAxisVar, setXAxisVar] = useState<string>("p01");
    const [xAxisMin, setXAxisMin] = useState<number>(0);
    const [xAxisMax, setXAxisMax] = useState<number>(0);
    const [yAxisVars, setYAxisVars] = useState<string[]>([]);
    const [lineColors, setLineColors] = useState<{ [key: string]: string }>({});
    const [errors, setErrors] = useState<ValidationErrors>({});

    useEffect(() => {
        const { p10, p01 } = params;
        if (xAxisVar === 'p10') {
            setXAxisMin(Math.max(0.001, p10 * 0.5));
            setXAxisMax(Math.min(0.999, p10 * 1.5));
        } else if (xAxisVar === 'p01') {
            setXAxisMin(Math.max(0.001, p01 * 0.5));
            setXAxisMax(Math.min(0.999, p01 * 1.5));
        }
    }, [xAxisVar, params.p10, params.p01]);

    const validate = () => {
        const newErrors: ValidationErrors = {};
        if (params.power) {
            const powerValue = parseFloat(params.power);
            if (powerValue <= 0 || powerValue >= 1) {
                newErrors.power = "Power must be between 0 and 1.";
            }
        }
        if (params.p10 <= 0 || params.p10 >= 1) {
            newErrors.p10 = "p₁₀ must be between 0 and 1.";
        }
        if (params.p01 <= 0 || params.p01 >= 1) {
            newErrors.p01 = "p₀₁ must be between 0 and 1.";
        }
        if (params.p10 + params.p01 > 1) {
            const errorMsg = "p₁₀ + p₀₁ must be <= 1.";
            newErrors.p10 = (newErrors.p10 ? newErrors.p10 + " " : "") + errorMsg;
            newErrors.p01 = (newErrors.p01 ? newErrors.p01 + " " : "") + errorMsg;
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const updatePlotData = () => {
        const { alpha, power, p10, p01 } = params;
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
            let point: any = { [xAxisVar]: x };
            
            powerScenarios.forEach(scenario => {
                let sampleSize: number | null = null;
                
                let current_p10 = p10;
                let current_p01 = p01;

                if (xAxisVar === 'p10') {
                    current_p10 = x;
                } else if (xAxisVar === 'p01') {
                    current_p01 = x;
                }
                
                if (current_p10 > 0 && current_p10 < 1 && current_p01 > 0 && current_p01 < 1 && current_p10 + current_p01 <= 1) {
                    const p_disc = current_p10 + current_p01;
                    const p_diff = current_p10 - current_p01;

                    if (p_diff !== 0 && (p_disc - p_diff**2) > 0) {
                        const z_beta = jStat.normal.inv(scenario.value, 0, 1);
                        const numerator = z_alpha * Math.sqrt(p_disc) + z_beta * Math.sqrt(p_disc - p_diff**2);
                        const denominator = p_diff;
                        const calculatedN = (numerator / denominator)**2;
                        sampleSize = Math.ceil(calculatedN);
                    }
                }
                
                point[scenario.name] = sampleSize && sampleSize > 0 ? sampleSize : null;
            });
            data.push(point);
        }
        setPlotData(data);
    };

    const handleCalculate = () => {
        if (!validate()) return;

        const { alpha, power, sampleSize, p10, p01 } = params;
        
        if (solveFor === 'power') {
            if (sampleSize && sampleSize > 0) {
                const p_disc = p10 + p01;
                const p_diff = p10 - p01;
                const variance = p_disc - p_diff**2;

                if (variance <= 0) {
                    setParams(p => ({...p, power: null}));
                    return;
                }
                const z_alpha = jStat.normal.inv(1 - alpha, 0, 1);
                const numerator = Math.abs(p_diff) * Math.sqrt(sampleSize) - z_alpha * Math.sqrt(p_disc);
                const denominator = Math.sqrt(variance);
                const z_beta_arg = numerator / denominator;
                const calculatedPower = jStat.normal.cdf(z_beta_arg, 0, 1);
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
                const p_disc = p10 + p01;
                const p_diff = p10 - p01;
                const variance = p_disc - p_diff**2;

                if (p_diff === 0 || variance <= 0) {
                    setParams(p => ({ ...p, sampleSize: null }));
                    return;
                }
                const z_alpha = jStat.normal.inv(1 - alpha, 0, 1);
                const z_beta = jStat.normal.inv(powerValue, 0, 1);
                const numerator = z_alpha * Math.sqrt(p_disc) + z_beta * Math.sqrt(variance);
                const denominator = p_diff;
                const calculatedSize = (numerator / denominator)**2;
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
    }, [xAxisVar, xAxisMin, xAxisMax]);

    const handleParamsChange = (newParams: { [key: string]: any }) => {
        setParams(prevParams => ({ ...prevParams, ...newParams }));
    };

    const inputFields = [
        { name: 'power', label: 'Power (1-β)', type: 'text' as const, solve: 'power' as const },
        { name: 'sampleSize', label: 'Sample Size (n)', type: 'number' as const, solve: 'sampleSize' as const },
        { name: 'alpha', label: 'Alpha (α)', type: 'number' as const },
        { name: 'p01', label: 'no event-event (p₀₁)', type: 'number' as const },
        { name: 'p10', label: 'event-no event (p₁₀)', type: 'number' as const },
    ];

    const xAxisOptions = inputFields
        .filter(field => !['alpha', 'power', 'sampleSize'].includes(field.name)) // 제외할 필드 고정, 바꾸지 마세요.
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
                                yAxisLabel="Sample Size (n)"
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
                    title="Calculate Sample Size Needed to Compare Paired Proportions: McNemar's Z-test, 1-Sided"
                    summary={`This calculator is useful for tests comparing paired proportions. Suppose that our sample consists of pairs of subjects, and that each pair contains a subject from group 'A' and a subject from group 'B'. Further suppose that we wish to compare the probability that an event occurs in group 'A' to that in group 'B'. Example study designs include matched case-control studies and cross-over studies. Conceptually, the data can be listed as in the following table.

$\\begin{array}{cc|cc}
& & {Group \\quad 'B'} \\\\
& & Success & Failure \\\\ \\hline
Group \\quad 'A' & Success & n_{11} & n_{10} \\\\
& Failure & n_{01} & n_{00}
\\end{array}$

Here, $n_{ij}$ represents the number of pairs having $i$ successes in Group 'A' and $j$ successes in Group 'B'. The corresponding proportions are denoted $p_{ij}$, with table

$\\begin{array}{cc|cc}
& & {Group \\quad 'B'} \\\\
& & Success & Failure \\\\ \\hline
Group \\quad 'A' & Success & p_{11} & p_{10} \\\\
& Failure & p_{01} & p_{00}
\\end{array}$

Interest is in comparing the following hypotheses:

$H_0$: Both groups have the same success probability
$H_1$: The success probability is greater for one group than the other

Mathematically, this can be represented as
$H_0: p_{10} = p_{01}$
$H_1: p_{10} < p_{01}$

or
$H_0: p_{10} = p_{01}$
$H_1: p_{10} > p_{01}$

In the formulas below, we use the notation that
$p_{disc} = p_{10} + p_{01}$

and
$p_{diff} = p_{10} - p_{01}$`}
                    formulas={`This calculator uses the following formulas to compute sample size and power, respectively:

$n = \\left( \\frac{z_{1-\\alpha} \\sqrt{p_{disc}} + z_{1-\\beta} \\sqrt{p_{disc} - p_{diff}^2}}{p_{diff}} \\right)^2$

$1-\\beta = \\Phi \\left( \\frac{|p_{diff}| \\sqrt{n} - z_{1-\\alpha} \\sqrt{p_{disc}}}{\\sqrt{p_{disc} - p_{diff}^2}} \\right)$

where:

$n$ is sample size

$\\Phi$ is the standard Normal distribution function

$\\Phi^{-1}$ is the standard Normal quantile function

$\\alpha$ is Type I error

$\\beta$ is Type II error, meaning $1-\\beta$ is power`}
                    rCode={`p01=0.45
p10=0.05
alpha=0.05
beta=0.10
pdisc=p10+p01
pdiff=p10-p01
(n=((qnorm(1-alpha)*sqrt(pdisc)+qnorm(1-beta)*sqrt(pdisc-pdiff^2))/pdiff)^2)
ceiling(n) # 23
x=(abs(pdiff)*sqrt(n)-qnorm(1-alpha)*sqrt(pdisc))/sqrt(pdisc-pdiff^2);
(Power = pnorm(x))`}
                    references={[
                        "Connor R. J. 1987. Sample size for testing differences in proportions for the paired-sample design. Biometrics 43(1):207-211. page 209."
                    ]}
                />
            </div>
        </div>
    );
}
