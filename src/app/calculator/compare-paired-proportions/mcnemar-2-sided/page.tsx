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
    p10: number;
    p01: number;
};

type PlotDataPoint = {
    [key: string]: number | null;
};

type ValidationErrors = {
    power?: string;
    p10?: string;
    p01?: string;
    p_disc?: string;
    p_diff?: string;
};

// TODO: 계산기 페이지에 맞게 컴포넌트 이름을 변경하세요.
export default function McNemar2SidedEqualityPage() {
    const [solveFor, setSolveFor] = useState<string>("sampleSize");
    // TODO: 초기 파라미터 값을 설정하세요.
    const [params, setParams] = useState<CalcParams>({
        power: "0.8000", // 고정
        sampleSize: 23,
        alpha: 0.05,
        p10: 0.05,
        p01: 0.45,
        // 여기에 다른 파라미터의 초기값을 설정하세요.
    });
    const [plotData, setPlotData] = useState<PlotDataPoint[]>([]);
    const [xAxisVar, setXAxisVar] = useState<string>("p01"); // TODO: 가장 처음 나오는 값을 기본 x축 변수로 설정하세요.
    const [xAxisMin, setXAxisMin] = useState<number>(0); // 고정
    const [xAxisMax, setXAxisMax] = useState<number>(0); // 고정
    const [yAxisVars, setYAxisVars] = useState<string[]>([]);
    const [lineColors, setLineColors] = useState<{ [key: string]: string }>({});
    const [errors, setErrors] = useState<ValidationErrors>({});

    useEffect(() => {
        const { p10, p01 } = params;
        if (xAxisVar === 'p10') {
            setXAxisMin(Math.max(0.01, p10 * 0.5));
            setXAxisMax(Math.min(1 - p01, p10 * 1.5));
        } else if (xAxisVar === 'p01') {
            setXAxisMin(Math.max(0.01, p01 * 0.5));
            setXAxisMax(Math.min(1 - p10, p01 * 1.5));
        }
    }, [xAxisVar, params]);

    const validate = useCallback(() => {
        const newErrors: ValidationErrors = {};
        const { power, p10, p01 } = params;
        if (power) {
            const powerValue = parseFloat(power);
            if (powerValue <= 0 || powerValue >= 1) {
                newErrors.power = "Power must be between 0 and 1.";
            }
        }
        if (p10 <= 0 || p10 >= 1) {
            newErrors.p10 = "p₁₀ must be between 0 and 1.";
        }
        if (p01 <= 0 || p01 >= 1) {
            newErrors.p01 = "p₀₁ must be between 0 and 1.";
        }
        const p_disc = p10 + p01;
        if (p_disc <= 0 || p_disc > 1) {
            newErrors.p_disc = "The sum of p₁₀ and p₀₁ must be between 0 and 1.";
        }
        const p_diff = p10 - p01;
        if (p_disc <= p_diff * p_diff) {
            newErrors.p_diff = "p_disc must be greater than p_diff squared.";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [params])

    const updatePlotData = useCallback(() => {
        const { alpha, power } = params;
        if (!validate()) {
            setPlotData([]);
            return;
        };
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

        const z_alpha_half = jStat.normal.inv(1 - alpha / 2, 0, 1);

        for (let i = 0; i < 100; i++) {
            const x = xAxisMin + (xAxisMax - xAxisMin) * (i / 99);
            const point: PlotDataPoint = { [xAxisVar]: x };
            
            powerScenarios.forEach(scenario => {
                let sampleSize: number | null = null;
                const z_beta = jStat.normal.inv(scenario.value, 0, 1);
                
                let currentP10 = params.p10;
                let currentP01 = params.p01;

                if (xAxisVar === 'p10') {
                    currentP10 = x;
                } else if (xAxisVar === 'p01') {
                    currentP01 = x;
                }
                
                const p_disc = currentP10 + currentP01;
                const p_diff = currentP10 - currentP01;

                if (p_disc > 0 && p_disc <= 1 && p_disc > p_diff * p_diff) {
                    const numerator = z_alpha_half * Math.sqrt(p_disc) + z_beta * Math.sqrt(p_disc - p_diff * p_diff);
                    const denominator = p_diff;
                    if (denominator !== 0) {
                        const calculatedN = Math.pow(numerator / denominator, 2);
                        sampleSize = Math.ceil(calculatedN);
                    }
                }
                
                point[scenario.name] = sampleSize && sampleSize > 0 ? sampleSize : null;
            });
            data.push(point);
        }
        setPlotData(data);
    }, [validate, xAxisMin, xAxisMax, xAxisVar]);

    const handleCalculate = useCallback(() => {
        // if (!validate()) return;

        const { alpha, power, sampleSize, p10, p01 } = params;
        
        if (solveFor === 'power') {
            if (sampleSize && sampleSize > 0) {
                const z_alpha_half = jStat.normal.inv(1 - alpha / 2, 0, 1);
                const p_disc = p10 + p01;
                const p_diff = p10 - p01;

                const denominator = Math.sqrt(p_disc - p_diff * p_diff);
                if (denominator > 0) {
                    const x1 = (p_diff * Math.sqrt(sampleSize) - z_alpha_half * Math.sqrt(p_disc)) / denominator;
                    const x2 = (-p_diff * Math.sqrt(sampleSize) - z_alpha_half * Math.sqrt(p_disc)) / denominator;
                    const calculatedPower = jStat.normal.cdf(x1, 0, 1) + jStat.normal.cdf(x2, 0, 1);
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
                const z_alpha_half = jStat.normal.inv(1 - alpha / 2, 0, 1);
                const z_beta = jStat.normal.inv(powerValue, 0, 1);
                const p_disc = p10 + p01;
                const p_diff = p10 - p01;

                const denominator = p_diff;
                if (denominator !== 0) {
                    const numerator = z_alpha_half * Math.sqrt(p_disc) + z_beta * Math.sqrt(p_disc - p_diff * p_diff);
                    const calculatedSize = Math.pow(numerator / denominator, 2);
                    if (params.sampleSize !== Math.ceil(calculatedSize)) {
                        setParams(p => ({ ...p, sampleSize: Math.ceil(calculatedSize) }));
                    }
                } else {
                    setParams(p => ({...p, sampleSize: null}));
                }
            } else {
                setParams(p => ({...p, sampleSize: null}));
            }
        }
        updatePlotData();
    },[validate, params, solveFor])

    useEffect(() => {
        updatePlotData();
    }, [updatePlotData]);

    const handleParamsChange = (newParams: { [key: string]: string | number | null }) => {
        setParams(prevParams => ({ ...prevParams, ...newParams }));
    };

    // TODO: 계산기의 입력 필드를 정의하세요.
    const inputFields = [
        // 필수 입력 필드
        { name: 'power', label: 'Power (1-β)', type: 'text' as const, solve: 'power' as const, error: errors.power },
        { name: 'sampleSize', label: 'Sample Size (n)', type: 'number' as const, solve: 'sampleSize' as const },
        { name: 'alpha', label: 'Type I error rate (α)', type: 'number' as const },
        { name: 'p01', label: 'no event-event (p₀₁)', type: 'number' as const, error: errors.p01 || errors.p_disc || errors.p_diff },
        { name: 'p10', label: 'event-no event (p₁₀)', type: 'number' as const, error: errors.p10 },
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
                    title="Calculate Sample Size Needed to Compare Paired Proportions: McNemar's Z-test, 2-Sided Equality"
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

$H_0: \\text{Both groups have the same success probability}$
$H_1: \\text{The success probability is not equal between the Groups}$

Mathematically, this can be represented as

$H_0:p_{10}=p_{01}$
$H_1:p_{10}\\neq p_{01}$

In the formulas below, we use the notation that

$p_{disc}=p_{10}+p_{01}$

and

$p_{diff}=p_{10}-p_{01}$`}
                    formulas={`This calculator uses the following formulas to compute sample size and power, respectively:

$n=\\left(\\frac{z_{1-\\alpha/2}\\sqrt{p_{disc}}+z_{1-\\beta}\\sqrt{p_{disc}-p_{diff}^2}}{p_{diff}}\\right)^2$
$1-\\beta=\\Phi\\left(\\frac{p_{diff}\\sqrt{n}-z_{1-\\alpha/2}\\sqrt{p_{disc}}}{\\sqrt{p_{disc}-p_{diff}^2}}\\right)$

where

$n$ is sample size
$\\Phi$ is the standard Normal distribution function
$\\Phi^{-1}$ is the standard Normal quantile function
$\\alpha$ is Type I error
$\\beta$ is Type II error, meaning $1-\\beta$ is power`}
                    rCode={`p01=0.45
p10=0.05
alpha=0.05
beta=0.20
pdisc=p10+p01
pdiff=p10-p01
(n=((qnorm(1-alpha/2)*sqrt(pdisc)+qnorm(1-beta)*sqrt(pdisc-pdiff^2))/pdiff)^2)
ceiling(n) # 23
x1=( pdiff*sqrt(n)-qnorm(1-alpha/2)*sqrt(pdisc))/sqrt(pdisc-pdiff^2);
x2=(-pdiff*sqrt(n)-qnorm(1-alpha/2)*sqrt(pdisc))/sqrt(pdisc-pdiff^2);
(Power = pnorm(x1)+pnorm(x2))`}
                    references={[
                        "Connor R. J. 1987. Sample size for testing differences in proportions for the paired-sample design. Biometrics 43(1):207-211. page 209."
                    ]}
                />
            </div>
        </div>
    );
}