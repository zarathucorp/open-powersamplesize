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
    pA: number;
    pB: number;
    delta: number;
    kappa: number;
};

type ValidationErrors = {
    power?: string;
    pA?: string;
    pB?: string;
    delta?: string;
    kappa?: string;
};

// TODO: 계산기 페이지에 맞게 컴포넌트 이름을 변경하세요.
export default function Compare2ProportionsEquivalence() {
    const [solveFor, setSolveFor] = useState<string>("sampleSize");
    // TODO: 초기 파라미터 값을 설정하세요.
    const [params, setParams] = useState<CalcParams>({
        power: "0.8000", // 고정
        sampleSize: 135,
        alpha: 0.05,
        pA: 0.65,
        pB: 0.85,
        delta: 0.05,
        kappa: 1,
    });
    const [plotData, setPlotData] = useState<any[]>([]);
    const [xAxisVar, setXAxisVar] = useState<string>("pA"); // TODO: 가장 처음 나오는 값을 기본 x축 변수로 설정하세요.
    const [xAxisMin, setXAxisMin] = useState<number>(0); // 고정
    const [xAxisMax, setXAxisMax] = useState<number>(0); // 고정
    const [yAxisVars, setYAxisVars] = useState<string[]>([]);
    const [lineColors, setLineColors] = useState<{ [key: string]: string }>({});
    const [errors, setErrors] = useState<ValidationErrors>({});

    const validate = () => {
        const newErrors: ValidationErrors = {};
        const { power, pA, pB, delta, kappa } = params;
        if (power) {
            const powerValue = parseFloat(power);
            if (powerValue <= 0 || powerValue >= 1) {
                newErrors.power = "Power must be between 0 and 1.";
            }
        }
        if (pA <= 0 || pA >= 1) {
            newErrors.pA = "Proportion A must be between 0 and 1.";
        }
        if (pB <= 0 || pB >= 1) {
            newErrors.pB = "Proportion B must be between 0 and 1.";
        }
        if (delta <= 0) {
            newErrors.delta = "Margin of equivalence must be positive.";
        }
        if (kappa <= 0) {
            newErrors.kappa = "Ratio must be positive.";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const calculateSampleSize = (power: number, pA: number, pB: number, delta: number, kappa: number, alpha: number): number | null => {
        if (delta <= Math.abs(pA - pB) || pA <= 0 || pA >= 1 || pB <= 0 || pB >= 1 || kappa <= 0 || power <= 0 || power >= 1) return null;
        const z_alpha = jStat.normal.inv(1 - alpha, 0, 1);
        const z_beta_half = jStat.normal.inv(1 - power / 2, 0, 1);
        const term1 = (pA * (1 - pA) / kappa) + (pB * (1 - pB));
        const term2_num = z_alpha + z_beta_half;
        const term2_den = Math.abs(pA - pB) - delta;
        if (term2_den === 0) return null;
        const nB = term1 * Math.pow(term2_num / term2_den, 2);
        return Math.ceil(nB);
    };

    const calculatePower = (nB: number, pA: number, pB: number, delta: number, kappa: number, alpha: number): number | null => {
        if (nB <= 0 || pA <= 0 || pA >= 1 || pB <= 0 || pB >= 1 || kappa <= 0) return null;
        const nA = kappa * nB;
        const z_num = Math.abs(pA - pB) - delta;
        const z_den = Math.sqrt((pA * (1 - pA) / nA) + (pB * (1 - pB) / nB));
        if (z_den === 0) return null;
        const z = z_num / z_den;
        const z_alpha = jStat.normal.inv(1 - alpha, 0, 1);
        const power = jStat.normal.cdf(z - z_alpha, 0, 1) + jStat.normal.cdf(-z - z_alpha, 0, 1);
        return power;
    };

    const updatePlotData = () => {
        const { alpha, power, pA, pB, delta, kappa } = params;
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

        for (let i = 0; i < 100; i++) {
            const x = xAxisMin + (xAxisMax - xAxisMin) * (i / 99);
            let point: any = { [xAxisVar]: x };
            
            powerScenarios.forEach(scenario => {
                let currentPA = pA, currentPB = pB, currentDelta = delta, currentKappa = kappa;
                if (xAxisVar === 'pA') currentPA = x;
                if (xAxisVar === 'pB') currentPB = x;
                if (xAxisVar === 'delta') currentDelta = x;
                if (xAxisVar === 'kappa') currentKappa = x;

                const sampleSize = calculateSampleSize(scenario.value, currentPA, currentPB, currentDelta, currentKappa, alpha);
                point[scenario.name] = sampleSize && sampleSize > 0 ? sampleSize : null;
            });
            data.push(point);
        }
        setPlotData(data);
    };

    const handleCalculate = () => {
        if (!validate()) return;

        const { alpha, power, sampleSize, pA, pB, delta, kappa } = params;
        
        if (solveFor === 'power') {
            if (sampleSize && sampleSize > 0) {
                const calculatedPower = calculatePower(sampleSize, pA, pB, delta, kappa, alpha);
                if (calculatedPower) {
                    const formattedPower = calculatedPower.toFixed(4);
                    if (params.power !== formattedPower) {
                        setParams(p => ({ ...p, power: formattedPower }));
                    }
                }
            } else {
                setParams(p => ({...p, power: null}));
            }
        } else {
            const powerValue = power ? parseFloat(power) : null;
            if (powerValue && powerValue > 0 && powerValue < 1) {
                const calculatedSize = calculateSampleSize(powerValue, pA, pB, delta, kappa, alpha);
                if (calculatedSize && params.sampleSize !== calculatedSize) {
                    setParams(p => ({ ...p, sampleSize: calculatedSize }));
                }
            } else {
                setParams(p => ({...p, sampleSize: null}));
            }
        }
    };

    useEffect(() => {
        if (validate()) {
            updatePlotData();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params, xAxisVar, xAxisMin, xAxisMax]);

    useEffect(() => {
        const { pA, pB, delta, kappa } = params;
        const diff = Math.abs(pA - pB);
        if (xAxisVar === 'delta') {
            setXAxisMin(Math.max(diff + 0.01, delta * 0.5));
            setXAxisMax(delta * 1.5);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [xAxisVar]);

    const handleParamsChange = (newParams: { [key: string]: any }) => {
        setParams(prevParams => ({ ...prevParams, ...newParams }));
    };

    // TODO: 계산기의 입력 필드를 정의하세요.
    const inputFields = [
        // 필수 입력 필드
        { name: 'power', label: 'Power (1-β)', type: 'text' as const, solve: 'power' as const },
        { name: 'sampleSize', label: 'Sample Size, Group B (nB)', type: 'number' as const, solve: 'sampleSize' as const },
        { name: 'alpha', label: 'Alpha (α)', type: 'number' as const, step: 0.01 },
        { name: 'pA', label: 'Proportion, Group A (pA)', type: 'number' as const, step: 0.01 },
        { name: 'pB', label: 'Proportion, Group B (pB)', type: 'number' as const, step: 0.01 },
        { name: 'delta', label: 'Margin of Equivalence (δ)', type: 'number' as const, step: 0.01 },
        { name: 'kappa', label: 'Ratio (κ=nA/nB)', type: 'number' as const, step: 0.1 },
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
                                yAxisLabel="Sample Size, Group B (nB)" // TODO: Y축 레이블을 조정하세요.
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
                    title="Calculate Sample Size Needed to Compare 2 Proportions: 2-Sample Equivalence"
                    summary={`This calculator is useful when we wish to test whether the proportions in two groups are equivalent, without concern of which group's proportion is larger. Suppose we collect a sample from a group 'A' and a group 'B'; that is we collect two samples, and will conduct a two-sample test. For example, we may wish to test whether a new product is equivalent to an existing, industry standard product. Here, the 'burden of proof', so to speak, falls on the new product; that is, equivalence is actually represented by the alternative, rather than the null hypothesis.

$H_0:|p_A-p_B| \\ge \\delta$

$H_1:|p_A-p_B| < \\delta$

where $\\delta$ is the superiority or non-inferiority margin and the ratio between the sample sizes of the two groups is

$\\kappa=\\frac{n_A}{n_B}$`}
                    formulas={`This calculator uses the following formulas to compute sample size and power, respectively:
$n_A=\\kappa n_B \\quad and \\quad n_B=\\left(\\frac{p_A(1-p_A)}{\\kappa}+p_B(1-p_B)\\right) \\left(\\frac{z_{1-\\alpha}+z_{1-\\beta/2}}{|p_A-p_B|-\\delta}\\right)^2$
$1-\\beta= 2\\left[\\Phi\\left(z-z_{1-\\alpha}\\right)+\\Phi\\left(-z-z_{1-\\alpha}\\right)\\right]-1 \\quad ,\\quad z=\\frac{|p_A-p_B|-\\delta}{\\sqrt{\\frac{p_A(1-p_A)}{n_A}+\\frac{p_B(1-pB)}{n_B}}}$
where
$\\kappa=n_A/n_B$ is the matching ratio
$\\Phi$ is the standard Normal distribution function
$\\Phi^{-1}$ is the standard Normal quantile function
$\\alpha$ is Type I error
$\\beta$ is Type II error, meaning $1-\\beta$ is power
$\\delta$ is the testing margin`}
                    rCode={`pA=0.65
pB=0.85
delta=0.05
kappa=1
alpha=0.05
beta=0.20
(nB=(pA*(1-pA)/kappa+pB*(1-pB))*((qnorm(1-alpha)+qnorm(1-beta/2))/(abs(pA-pB)-delta))^2)
ceiling(nB) # 136
z=(abs(pA-pB)-delta)/sqrt(pA*(1-pA)/nB/kappa+pB*(1-pB)/nB)
(Power=2*(pnorm(z-qnorm(1-alpha))+pnorm(-z-qnorm(1-alpha)))-1)`}
                    references={[
                        "Chow S, Shao J, Wang H. 2008. Sample Size Calculations in Clinical Research. 2nd Ed. Chapman & Hall/CRC Biostatistics Series. page 91."
                    ]}
                />
            </div>
        </div>
    );
}
