"use client";

import { useState, useEffect, useCallback } from "react";
import { jStat } from "jstat";
import { CalculatorInputArea } from "@/components/calculator/CalculatorInputArea";
import { PlotSection } from "@/components/calculator/PlotSection";
import { DescriptionSection } from "@/components/calculator/DescriptionSection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// TODO: 계산기에 필요한 파라미터를 정의하세요.
type CalcParams = {
    alpha: number;
    power: string | null;
    sampleSize: number | null;
    stdDev: number;
    mean: number;
    mean0: number;
};

type PlotDataPoint = {
    [key: string]: number | null;
};

type ValidationErrors = {
    power?: string;
    stdDev?: string;
    mean?: string;
    mean0?: string;
};

// TODO: 계산기 페이지에 맞게 컴포넌트 이름을 변경하세요.
export default function OneSampleNormalPage() {
    const [solveFor, setSolveFor] = useState<string>("sampleSize");
    // TODO: 초기 파라미터 값을 설정하세요.
    const [params, setParams] = useState<CalcParams>({
        power: "0.8000", // 고정
        sampleSize: 32,
        alpha: 0.05,
        stdDev: 1,
        mean: 2,
        mean0: 1.5,
    });
    const [plotData, setPlotData] = useState<PlotDataPoint[]>([]);
    const [xAxisVar, setXAxisVar] = useState<string>("mean"); // TODO: 가장 처음 나오는 값을 기본 x축 변수로 설정하세요.
    const [xAxisMin, setXAxisMin] = useState<number>(0); // 고정
    const [xAxisMax, setXAxisMax] = useState<number>(0); // 고정
    const [yAxisVars, setYAxisVars] = useState<string[]>([]);
    const [lineColors, setLineColors] = useState<{ [key: string]: string }>({});
    const [errors, setErrors] = useState<ValidationErrors>({});

    useEffect(() => {
        const { stdDev, mean, mean0 } = params;
        if (xAxisVar === 'stdDev') {
            setXAxisMin(Math.max(0.1, stdDev * 0.5));
            setXAxisMax(stdDev * 1.5);
        } else if (xAxisVar === 'mean') {
            const delta = Math.abs(mean - mean0);
            setXAxisMin(mean - delta * 0.5);
            setXAxisMax(mean + delta * 0.5);
        } else if (xAxisVar === 'mean0') {
            const delta = Math.abs(mean - mean0);
            setXAxisMin(mean0 - delta * 0.5);
            setXAxisMax(mean0 + delta * 0.5);
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
            newErrors.stdDev = "Standard Deviation must be > 0.";
        }
        if (params.mean === params.mean0) {
            newErrors.mean = "Mean and Reference Mean must not be equal.";
            newErrors.mean0 = "Mean and Reference Mean must not be equal.";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const updatePlotData = useCallback(() => {
        const { alpha, power } = params;
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

        // sort 하지 말 것

        // Calculate으로 생성된 power는 항상 #8884d8 색상을 사용합니다.
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

                let currentStdDev = params.stdDev;
                let currentMean = params.mean;
                let currentMean0 = params.mean0;

                if (xAxisVar === 'stdDev') {
                    currentStdDev = x;
                } else if (xAxisVar === 'mean') {
                    currentMean = x;
                } else if (xAxisVar === 'mean0') {
                    currentMean0 = x;
                }

                if (currentStdDev > 0 && currentMean !== currentMean0) {
                    const delta = currentMean - currentMean0;
                    const numerator = currentStdDev * (z_alpha_half + z_beta);
                    const calculatedN = Math.pow(numerator / delta, 2);
                    sampleSize = Math.ceil(calculatedN);
                }
                
                point[scenario.name] = sampleSize && sampleSize > 0 ? sampleSize : null;
            });
            data.push(point);
        }
        setPlotData(data);
    }, [params, xAxisMin, xAxisMax, xAxisVar]);

    const handleCalculate = () => {
        if (!validate()) return;

        const { alpha, power, sampleSize, stdDev, mean, mean0 } = params;
        
        if (solveFor === 'power') {
            if (sampleSize && sampleSize > 0) {
                const z_alpha_half = jStat.normal.inv(1 - alpha / 2, 0, 1);
                const delta = mean - mean0;
                const term = (Math.abs(delta) / (stdDev / Math.sqrt(sampleSize)));
                const calculatedPower = jStat.normal.cdf(term - z_alpha_half, 0, 1) + jStat.normal.cdf(-term - z_alpha_half, 0, 1);
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
                const z_alpha_half = jStat.normal.inv(1 - alpha / 2, 0, 1);
                const z_beta = jStat.normal.inv(powerValue, 0, 1);
                const delta = mean - mean0;
                const numerator = stdDev * (z_alpha_half + z_beta);
                const calculatedSize = Math.pow(numerator / delta, 2);
                if (params.sampleSize !== calculatedSize) {
                    setParams(p => ({ ...p, sampleSize: Math.ceil(calculatedSize) }));
                }
            } else {
                setParams(p => ({...p, sampleSize: null}));
            }
        }
        updatePlotData();
    };

    // 바꾸지 말 것
    useEffect(() => {
        updatePlotData();
    }, [updatePlotData]);

    const handleParamsChange = (newParams: { [key: string]: string | number | null }) => {
        setParams(prevParams => ({ ...prevParams, ...newParams }));
    };

    // TODO: 계산기의 입력 필드를 정의하세요.
    const inputFields = [
        // 필수 입력 필드
        { name: 'power', label: 'Power (1-β)', type: 'text' as const, solve: 'power' as const },
        { name: 'sampleSize', label: 'Sample Size (n)', type: 'number' as const, solve: 'sampleSize' as const },
        { name: 'alpha', label: 'Type I error rate (α)', type: 'number' as const },
        { name: 'mean', label: 'True mean (μ)', type: 'number' as const },
        { name: 'mean0', label: 'Null Hypothesis mean (μ_0)', type: 'number' as const },
        { name: 'stdDev', label: 'Standard Deviation (σ)', type: 'number' as const },
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
                    title="Calculate Sample Size Needed to Other: 1-Sample Normal"
                    summary={`This calculator is useful for tests concerning whether a mean, $\\mu$, is equal to a reference value, $\\mu_0$. The Null and Alternative hypotheses are

$H_0:\\mu=\\mu_0$
$H_1:\\mu\\neq\\mu_0$`}
                    formulas={`This calculator uses the following formulas to compute sample size and power, respectively:
                      
$n=\\left(\\sigma\\frac{z_{1-\\alpha/2}+z_{1-\\beta}}{\\mu-\\mu_0}\\right)^2$
$1-\\beta=\\Phi\\left(\\frac{\\mu-\\mu_0}{\\sigma/\\sqrt{n}}-z_{1-\\alpha/2}\\right)+\\Phi\\left(-\\frac{\\mu-\\mu_0}{\\sigma/\\sqrt{n}}-z_{1-\\alpha/2}\\right)$

where

$n$ is sample size
$\\sigma$ is standard deviation
$\\Phi$ is the standard Normal distribution function
$\\Phi^{-1}$ is the standard Normal quantile function
$\\alpha$ is Type I error
$\\beta$ is Type II error, meaning $1-\\beta$ is power`}
                    rCode={`mu=2
mu0=1.5
sd=1
alpha=0.05
beta=0.20
(n=(sd*(qnorm(1-alpha/2)+qnorm(1-beta))/(mu-mu0))^2)
ceiling(n)# 32
z=(mu-mu0)/sd*sqrt(n)
(Power=pnorm(z-qnorm(1-alpha/2))+pnorm(-z-qnorm(1-alpha/2)))`}
                    references={[
                        "Chow S, Shao J, Wang H. 2008. Sample Size Calculations in Clinical Research. 2nd Ed. Chapman & Hall/CRC Biostatistics Series. page 51.",
                        "Rosner B. 2010. Fundamentals of Biostatistics. 7th Ed. Brooks/Cole. page 232."
                    ]}
                />
            </div>
        </div>
    );
}
