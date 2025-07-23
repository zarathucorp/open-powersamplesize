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
    kappa: number;
};

type PlotDataPoint = {
    [key: string]: number | null;
};

type ValidationErrors = {
    power?: string;
    pA?: string;
    pB?: string;
    kappa?: string;
};

const calculateSampleSize = (power: number, pA: number, pB: number, kappa: number, alpha: number): number | null => {
    if (pA <= 0 || pA >= 1 || pB <= 0 || pB >= 1 || pA === pB || kappa <= 0 || power <= 0 || power >= 1) return null;
    const z_alpha = jStat.normal.inv(1 - alpha, 0, 1);
    const z_beta = jStat.normal.inv(power, 0, 1);
    const term1 = (pA * (1 - pA) / kappa) + (pB * (1 - pB));
    const term2 = Math.pow((z_alpha + z_beta) / (pA - pB), 2);
    const nB = term1 * term2;
    return Math.ceil(nB);
};

const calculatePower = (nB: number, pA: number, pB: number, kappa: number, alpha: number): number | null => {
    if (nB <= 0 || pA <= 0 || pA >= 1 || pB <= 0 || pB >= 1 || kappa <= 0) return null;
    const nA = kappa * nB;
    const z_alpha = jStat.normal.inv(1 - alpha, 0, 1);
    const numerator = Math.abs(pA - pB);
    const denominator = Math.sqrt((pA * (1 - pA) / nA) + (pB * (1 - pB) / nB));
    if (denominator === 0) return null;
    const power = jStat.normal.cdf(numerator / denominator - z_alpha, 0, 1);
    return power;
};

export default function Compare2Proportions1Sided() {
    const [solveFor, setSolveFor] = useState<string>("sampleSize");
    const [params, setParams] = useState<CalcParams>({
        power: "0.8000",
        sampleSize: 55,
        alpha: 0.05,
        pA: 0.65,
        pB: 0.85,
        kappa: 1,
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
            newErrors.pA = "Proportion A and B cannot be equal.";
            newErrors.pB = "Proportion A and B cannot be equal.";
        }
        if (params.kappa <= 0) {
            newErrors.kappa = "Allocation Ratio must be greater than 0.";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const updatePlotData = useCallback(() => {
        const { alpha, pA, pB, kappa } = params;
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

                if (xAxisVar === 'pA') currentPA = x;
                if (xAxisVar === 'pB') currentPB = x;
                if (xAxisVar === 'kappa') currentKappa = x;
                
                const sampleSize = calculateSampleSize(scenario.value, currentPA, currentPB, currentKappa, alpha);
                point[scenario.name] = sampleSize && sampleSize > 0 ? sampleSize : null;
            });
            data.push(point);
        }
        setPlotData(data);
    }, [params, xAxisMin, xAxisMax, xAxisVar]);

    const handleCalculate = () => {
        if (!validate()) return;

        const { alpha, power, sampleSize, pA, pB, kappa } = params;
        
        if (solveFor === 'power') {
            if (sampleSize && sampleSize > 0) {
                const calculatedPower = calculatePower(sampleSize, pA, pB, kappa, alpha);
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
                const calculatedSize = calculateSampleSize(powerValue, pA, pB, kappa, alpha);
                if (calculatedSize && params.sampleSize !== calculatedSize) {
                    setParams(p => ({ ...p, sampleSize: calculatedSize }));
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

    useEffect(() => {
        const { pA, pB, kappa } = params;
        if (xAxisVar === 'pA') {
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

    const inputFields = [
        { name: 'power', label: 'Power (1-β)', type: 'text' as const, solve: 'power' as const },
        { name: 'sampleSize', label: 'Sample Size (nB)', type: 'number' as const, solve: 'sampleSize' as const },
        { name: 'alpha', label: 'Alpha (α)', type: 'number' as const },
        { name: 'pA', label: 'Proportion, Group A (pA)', type: 'number' as const },
        { name: 'pB', label: 'Proportion, Group B (pB)', type: 'number' as const },
        { name: 'kappa', label: 'Allocation Ratio (nA/nB)', type: 'number' as const },
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
                {/* TODO: 설명, 수식, R 코드, 참고 문헌을 업데이트하세요. */}
                <DescriptionSection
                    title="Calculate Sample Size Needed to Compare 2 Proportions: 2-Sample, 1-Sided"
                    summary={`This calculator is useful for tests concerning whether the proportions in two groups are different. Suppose the two groups are 'A' and 'B', and we collect a sample from both groups -- i.e. we have two samples. We perform a two-sample test to determine whether the proportion in group A, $p_A$, is different from the proportion in group B, $p_B$. The hypotheses are

$H_0:p_A=p_B$
$H_1:p_A\\lt p_B$
.
or
$H_0:p_A=p_B$
$H_1:p_A\\gt p_B$
.
where the ratio between the sample sizes of the two groups is
$\\kappa=\\frac{n_A}{n_B}$`}
                    formulas={`This calculator uses the following formulas to compute sample size and power, respectively: 
                      $ n_A=\\kappa n_B \\;\\text{ and }\\; n_B=\\left(\\frac{p_A(1-p_A)}{\\kappa}+pB(1-pB)\\right) \\left(\\frac{z_{1-\\alpha}+z_{1-\\beta}}{p_A-p_B}\\right)^2$
$1-\\beta=\\Phi\\left(\\frac{|p_A-pB|}{\\sqrt{\\frac{p_A(1-pA)}{n_A}+\\frac{p_B(1-pB)}{n_B}}}-z_{1-\\alpha}\\right)$ 
where

$\\kappa=n_A/n_B$ is the matching ratio
$\\Phi$ is the standard Normal distribution function
$\\Phi^{-1}$ is the standard Normal quantile function
$\\alpha$ is Type I error
$\\beta$ is Type II error, meaning $1-\\beta$ is power`}
                    rCode={`pA=0.65
pB=0.85
kappa=1
alpha=0.05
beta=0.20
(nB=(pA*(1-pA)/kappa+pB*(1-pB))*((qnorm(1-alpha)+qnorm(1-beta))/(pA-pB))^2)
ceiling(nB) # 55
z=(pA-pB)/sqrt(pA*(1-pA)/nB/kappa+pB*(1-pB)/nB)
(Power=pnorm(abs(z)-qnorm(1-alpha)))
## Note:The example from Chow p.89 is obtained
## by using alpha=0.025`}
                    references={[
                        "Chow S, Shao J, Wang H. 2008. Sample Size Calculations in Clinical Research. 2nd Ed. Chapman & Hall/CRC Biostatistics Series. page 89."
                    ]}
                />
            </div>
        </div>
    );
}
