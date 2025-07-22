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
    kappa: number;
};

type ValidationErrors = {
    power?: string;
    pA?: string;
    pB?: string;
    kappa?: string;
    alpha?: string;
};

export default function Compare2Proportions2SidedEquality() {
    const [solveFor, setSolveFor] = useState<string>("sampleSize");
    const [params, setParams] = useState<CalcParams>({
        power: "0.8000",
        sampleSize: 70,
        alpha: 0.05,
        pA: 0.65,
        pB: 0.85,
        kappa: 1,
    });
    const [plotData, setPlotData] = useState<any[]>([]);
    const [xAxisVar, setXAxisVar] = useState<string>("pA");
    const [xAxisMin, setXAxisMin] = useState<number>(0);
    const [xAxisMax, setXAxisMax] = useState<number>(0);
    const [yAxisVars, setYAxisVars] = useState<string[]>([]);
    const [lineColors, setLineColors] = useState<{ [key: string]: string }>({});
    const [errors, setErrors] = useState<ValidationErrors>({});

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
    }, [xAxisVar, params.pA, params.pB, params.kappa]);

    const validate = () => {
        const newErrors: ValidationErrors = {};
        const powerValue = params.power ? parseFloat(params.power) : null;
        if (powerValue !== null && (powerValue <= 0 || powerValue >= 1)) {
            newErrors.power = "Power must be between 0 and 1.";
        }
        if (params.pA <= 0 || params.pA >= 1) {
            newErrors.pA = "Proportion must be between 0 and 1.";
        }
        if (params.pB <= 0 || params.pB >= 1) {
            newErrors.pB = "Proportion must be between 0 and 1.";
        }
        if (params.pA === params.pB) {
            newErrors.pA = "Proportions cannot be equal.";
            newErrors.pB = "Proportions cannot be equal.";
        }
        if (params.kappa <= 0) {
            newErrors.kappa = "Ratio must be greater than 0.";
        }
        if (params.alpha <= 0 || params.alpha >= 1) {
            newErrors.alpha = "Alpha must be between 0 and 1.";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const updatePlotData = () => {
        const { alpha, power, pA, pB, kappa } = params;
        const data = [];

        const powerValue = power ? parseFloat(power) : null;
        const powerScenarios: { name: string, value: number }[] = [];
        const colors = ['#8884d8', '#82ca9d', '#ffc658'];
        const newColors: { [key: string]: string } = {};

        if (powerValue && powerValue > 0 && powerValue < 1) {
            const powerName = `${(powerValue * 100).toFixed(2)}%`;
            powerScenarios.push({ name: powerName, value: powerValue });
        }

        [0.8, 0.9, 0.95].forEach(val => {
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
                let sampleSize: number | null = null;
                let currentPA = pA, currentPB = pB, currentKappa = kappa;

                if (xAxisVar === 'pA') currentPA = x;
                else if (xAxisVar === 'pB') currentPB = x;
                else if (xAxisVar === 'kappa') currentKappa = x;

                if (currentPA > 0 && currentPA < 1 && currentPB > 0 && currentPB < 1 && currentKappa > 0 && currentPA !== currentPB) {
                    const z_alpha_half = jStat.normal.inv(1 - alpha / 2, 0, 1);
                    const z_beta = jStat.normal.inv(scenario.value, 0, 1);
                    
                    const term1 = (currentPA * (1 - currentPA) / currentKappa) + (currentPB * (1 - currentPB));
                    const term2 = Math.pow((z_alpha_half + z_beta) / (currentPA - currentPB), 2);
                    const nB = term1 * term2;
                    sampleSize = Math.ceil(nB);
                }
                
                point[scenario.name] = sampleSize && sampleSize > 0 ? sampleSize : null;
            });
            data.push(point);
        }
        setPlotData(data);
    };

    const handleCalculate = () => {
        if (!validate()) {
            setParams(p => ({ ...p, sampleSize: null, power: solveFor === 'power' ? null : p.power }));
            return;
        }

        const { alpha, power, sampleSize, pA, pB, kappa } = params;
        
        if (solveFor === 'power') {
            if (sampleSize && sampleSize > 0) {
                const nB = sampleSize;
                const nA = kappa * nB;
                const z_alpha_half = jStat.normal.inv(1 - alpha / 2, 0, 1);
                const z = (pA - pB) / Math.sqrt((pA * (1 - pA) / nA) + (pB * (1 - pB) / nB));
                const calculatedPower = jStat.normal.cdf(z - z_alpha_half, 0, 1) + jStat.normal.cdf(-z - z_alpha_half, 0, 1);
                
                setParams(p => ({ ...p, power: calculatedPower.toFixed(4) }));
            } else {
                setParams(p => ({...p, power: null}));
            }
        } else { // solveFor === 'sampleSize'
            const powerValue = power ? parseFloat(power) : null;
            if (powerValue && powerValue > 0 && powerValue < 1) {
                const z_alpha_half = jStat.normal.inv(1 - alpha / 2, 0, 1);
                const z_beta = jStat.normal.inv(powerValue, 0, 1);
                const term1 = (pA * (1 - pA) / kappa) + (pB * (1 - pB));
                const term2 = Math.pow((z_alpha_half + z_beta) / (pA - pB), 2);
                const calculatedSize = term1 * term2;
                setParams(p => ({ ...p, sampleSize: Math.ceil(calculatedSize) }));
            } else {
                setParams(p => ({...p, sampleSize: null}));
            }
        }
        updatePlotData();
    };

    useEffect(() => {
        updatePlotData();
    }, [params, xAxisVar, xAxisMin, xAxisMax]);

    const handleParamsChange = (newParams: { [key: string]: any }) => {
        setParams(prevParams => ({ ...prevParams, ...newParams }));
    };

    const inputFields = [
        { name: 'power', label: 'Power (1-β)', type: 'text' as const, solve: 'power' as const },
        { name: 'sampleSize', label: 'Sample Size (n_B)', type: 'number' as const, solve: 'sampleSize' as const },
        { name: 'alpha', label: 'Alpha (α)', type: 'number' as const, step: 0.01 },
        { name: 'pA', label: 'Proportion, Group 1 (p_A)', type: 'number' as const, step: 0.01 },
        { name: 'pB', label: 'Proportion, Group 2 (p_B)', type: 'number' as const, step: 0.01 },
        { name: 'kappa', label: 'Ratio (κ = n_A/n_B)', type: 'number' as const, step: 0.1 },
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
                    title="Calculate Sample Size Needed to Compare 2 Proportions: 2-Sample, 2-Sided Equality"
                    summary={`This calculator is useful for tests concerning whether the proportions in two groups are different. Suppose the two groups are 'A' and 'B', and we collect a sample from both groups -- i.e. we have two samples. We perform a two-sample test to determine whether the proportion in group A, $p_A$, is different from the proportion in group B, $p_B$. The hypotheses are

$H_0:p_A-p_B=0$
$H_1:p_A-p_B\\neq0$
.
where the ratio between the sample sizes of the two groups is
$\\kappa=\\frac{n_A}{n_B}$`}
                    formulas={`This calculator uses the following formulas to compute sample size and power, respectively:
$ n_A=\\kappa n_B \\;\\text{ and }\\; n_B=\\left(\\frac{p_A(1-p_A)}{\\kappa}+p_B(1-pB)\\right) \\left(\\frac{z_{1-\\alpha/2}+z_{1-\\beta}}{p_A-p_B}\\right)^2$
$1-\\beta= \\Phi\\left(z-z_{1-\\alpha/2}\\right)+\\Phi\\left(-z-z_{1-\\alpha/2}\\right) \\quad ,\\quad z=\\frac{p_A-p_B}{\\sqrt{\\frac{p_A(1-p_A)}{n_A}+\\frac{p_B(1-pB)}{n_B}}}$
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
(nB=(pA*(1-pA)/kappa+pB*(1-pB))*((qnorm(1-alpha/2)+qnorm(1-beta))/(pA-pB))^2)
ceiling(nB) # 70
z=(pA-pB)/sqrt(pA*(1-pA)/nB/kappa+pB*(1-pB)/nB)
(Power=pnorm(z-qnorm(1-alpha/2))+pnorm(-z-qnorm(1-alpha/2)))
`}
                    references={[
                        "Chow S, Shao J, Wang H. 2008. Sample Size Calculations in Clinical Research. 2nd Ed. Chapman & Hall/CRC Biostatistics Series. page 89."
                    ]}
                />
            </div>
        </div>
    );
}
