"use client";

import { useState, useEffect, useCallback } from "react";
import { jStat } from "jstat";
import { CalculatorInputArea } from "@/components/calculator/CalculatorInputArea";
import { PlotSection } from "@/components/calculator/PlotSection";
import { DescriptionSection } from "@/components/calculator/DescriptionSection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// 계산기에 필요한 파라미터를 정의하세요.
type CalcParams = {
    alpha: number;
    power: string | null;
    sampleSize: number | null;
    rho: number | null;
    r: number | null;
};

type PlotDataPoint = {
    [key: string]: number | null;
};

type ValidationErrors = {
    power?: string;
    rho?: string;
    r?: string;
};

// 계산기 페이지에 맞게 컴포넌트 이름을 변경하세요.
export default function SccsAlt2Calculator() {
    const [solveFor, setSolveFor] = useState<string>("sampleSize");
    // 초기 파라미터 값을 설정하세요.
    const [params, setParams] = useState<CalcParams>({
        power: "0.8000", // 고정
        sampleSize: 54,
        alpha: 0.05,
        rho: 3,
        r: 0.115,
    });
    const [plotData, setPlotData] = useState<PlotDataPoint[]>([]);
    const [xAxisVar, setXAxisVar] = useState<string>("rho"); // 가장 처음 나오는 값을 기본 x축 변수로 설정하세요.
    const [xAxisMin, setXAxisMin] = useState<number>(0); // 고정
    const [xAxisMax, setXAxisMax] = useState<number>(0); // 고정
    const [yAxisVars, setYAxisVars] = useState<string[]>([]);
    const [lineColors, setLineColors] = useState<{ [key: string]: string }>({});
    const [errors, setErrors] = useState<ValidationErrors>({});

    useEffect(() => {
        const { rho, r } = params;
        if (xAxisVar === 'rho') {
            if (rho) {
                setXAxisMin(Math.max(0.1, rho * 0.5));
                setXAxisMax(rho * 1.5);
            }
        } else if (xAxisVar === 'r') {
            if (r) {
                setXAxisMin(Math.max(0.01, r * 0.5));
                setXAxisMax(Math.min(0.99, r * 1.5));
            }
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
        if (params.rho !== null && params.rho <= 0) {
            newErrors.rho = "Relative Incidence (ρ) must be > 0.";
        } else if (params.rho === 1) {
            newErrors.rho = "Relative Incidence (ρ) cannot be 1.";
        }
        if (params.r !== null && (params.r <= 0 || params.r >= 1)) {
            newErrors.r = "Proportion of time exposed (r) must be between 0 and 1.";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const updatePlotData = useCallback(() => {
        // 플롯 데이터를 생성하도록 이 함수를 업데이트하세요.
        const { alpha, power, rho, r } = params;
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

        const z_alpha = jStat.normal.inv(1 - alpha / 2, 0, 1);

        for (let i = 0; i < 100; i++) {
            const x = xAxisMin + (xAxisMax - xAxisMin) * (i / 99);
            const point: PlotDataPoint = { [xAxisVar]: x };
            
            powerScenarios.forEach(scenario => {
                let sampleSize: number | null = null;
                
                let currentRho = rho;
                let currentR = r;

                if (xAxisVar === 'rho') {
                    if (x <= 0 || x === 1) {
                        point[scenario.name] = null;
                        return;
                    }
                    currentRho = x;
                } else if (xAxisVar === 'r') {
                     if (x <= 0 || x >= 1) {
                        point[scenario.name] = null;
                        return;
                    }
                    currentR = x;
                }
                
                if (currentRho && currentR && currentRho > 0 && currentRho !== 1 && currentR > 0 && currentR < 1) {
                    const z_beta = jStat.normal.inv(scenario.value, 0, 1);
                    const numerator = z_alpha + z_beta * (currentRho * currentR + 1 - currentR) / Math.sqrt(currentRho);
                    const denominator = Math.sqrt(currentR * (1 - currentR)) * Math.log(currentRho);
                    const calculatedN = Math.pow(numerator / denominator, 2);
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

        const { alpha, power, sampleSize, rho, r } = params;
        
        if (solveFor === 'power') {
            if (sampleSize && sampleSize > 0 && rho && rho > 0 && rho !== 1 && r && r > 0 && r < 1) {
                const gamma = Math.log(rho);
                const z_alpha = jStat.normal.inv(1 - alpha / 2, 0, 1);
                
                const numerator = gamma * Math.sqrt(sampleSize * rho * r * (1 - r)) - z_alpha * Math.sqrt(rho);
                const denominator = rho * r + 1 - r;
                
                const calculatedPower = jStat.normal.cdf(numerator / denominator, 0, 1);
                
                const formattedPower = calculatedPower.toFixed(4);
                if (params.power !== formattedPower) {
                    setParams(p => ({ ...p, power: formattedPower }));
                }
            } else {
                setParams(p => ({...p, power: null}));
            }
        } else { // solveFor === 'sampleSize'
            const powerValue = power ? parseFloat(power) : null;
            if (powerValue && powerValue > 0 && powerValue < 1 && rho && rho > 0 && rho !== 1 && r && r > 0 && r < 1) {
                const z_alpha = jStat.normal.inv(1 - alpha / 2, 0, 1);
                const z_beta = jStat.normal.inv(powerValue, 0, 1);
                
                const numerator = z_alpha + z_beta * (rho * r + 1 - r) / Math.sqrt(rho);
                const denominator = Math.sqrt(r * (1 - r)) * Math.log(rho);
                
                const calculatedSize = Math.pow(numerator / denominator, 2);

                if (params.sampleSize !== Math.ceil(calculatedSize)) {
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

    // 계산기의 입력 필드를 정의하세요.
    const inputFields = [
        // 필수 입력 필드
        { name: 'power', label: 'Power (1-β)', type: 'text' as const, solve: 'power' as const },
        { name: 'sampleSize', label: 'Sample Size (n)', type: 'number' as const, solve: 'sampleSize' as const },
        { name: 'alpha', label: 'Alpha (α)', type: 'number' as const },
        // 여기에 다른 입력 필드를 추가하세요.
        { name: 'rho', label: 'Relative Incidence (ρ)', type: 'number' as const },
        { name: 'r', label: 'Proportion of time exposed (r)', type: 'number' as const },
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
                    title="Calculate Sample Size Needed to Test Relative Incidence in Self Controlled Case Series Studies: SCCS, Alt-2"
                    summary={`The Self-Controlled Case Series (SCCS) method was originally developed by Farrington (1995) to compare relative incidence of adverse events following vaccination. In brief, the method compares incidence in a 'risk' time period shortly following exposure (vaccination) to the remainder of the observation period, the control period. Since it's initial development the SCCS method has been expanded in several ways, and has been used in a wide variety of pharmacoepidemiology studies. A salient feature of the method is that factors that do not vary with time (e.g. sex, race) are inherently accounted for.

Suppose each individual spends $ r$ proportion of the observation period in the exposed time period, and let $\\rho=e^{\\gamma}$ represent the relative incidence; i.e. incidence is increased by a factor of $\\rho$ in the exposed period compared to the control period. The hypotheses to be tested are

$H_0:\\rho=1$
$H_1:\\rho \\neq 1$

This calculator implements the second method (i.e. alternative 2) for computing sample size for SCCS studies presented by Musonda et al. (2006). These computation formulas are based on the sampling distribution of $\\gamma=\\log(\\rho)$.

Under the null hypothesis $\\gamma$ is approximately distributed

$ N\\left(0\\;,\\;\\frac{1}{n r (1-r)}\\right),$

where $ n$ is the number of individuals exposed during the observation period. Under the alternative hypothesis $\\gamma$ is approximately distributed

$ N\\left(\\gamma\\;,\\;\\frac{(pr+1-r)^2}{npr(1-r)}\\right).$

This leads to the below formulas for power and sample size.`}
                    formulas={`This calculator uses the following formulas to compute sample size and power, respectively:

$n=\\left(\\frac{z_{1-\\alpha/2}+z_{1-\\beta}(\\rho r + 1 - r)/\\sqrt{\\rho}}{\\sqrt{r(1-r)}\\log(\\rho)}\\right)^2$
$1-\\beta= \\Phi\\left( \\frac{\\gamma\\sqrt{n\\rho r(1-r)} - z_{1-\\alpha/2}\\sqrt{\\rho}}{\\rho r + 1 - r} \\right)$

where

$n$ is sample size
$\\Phi$ is the standard Normal distribution function
$\\Phi^{-1}$ is the standard Normal quantile function
$\\alpha$ is Type I error
$\\beta$ is Type II error, meaning $1-\\beta$ is power`}
                    rCode={`p=3
r=42/365
alpha=0.05
beta=0.20
(n=(qnorm(1-alpha/2)+qnorm(1-beta)*(p*r+1-r)/sqrt(p))^2/(r*(1-r)*log(p)^2))
ceiling(n)# 54
(Power=pnorm((log(p)*sqrt(n*p*r*(1-r))-qnorm(1-alpha/2)*sqrt(p))/(p*r+1-r)))`}
                    references={[
                        "Musonda, P, CP Farrington, HJ Whitaker. 2006. Sample sizes for self-controlled case series studies. Statistics in Medicine 25:2618-2631. page 2621.",
                        "Farrington CP. 1995. Relative incidence estimation from case series for vaccine safety evaluation. Biometrics 51:228-235. page 228."
                    ]}
                />
            </div>
        </div>
    );
}
