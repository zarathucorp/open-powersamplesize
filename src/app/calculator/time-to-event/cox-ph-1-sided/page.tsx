"use client";

import { useState, useEffect, useCallback } from "react";
import { jStat } from "jstat";
import { CalculatorInputArea } from "@/components/calculator/CalculatorInputArea";
import { PlotSection } from "@/components/calculator/PlotSection";
import { DescriptionSection } from "@/components/calculator/DescriptionSection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// 계산기에 필요한 파라미터를 정의
type CalcParams = {
    alpha: number;
    power: string | null;
    sampleSize: number | null;
    hr: number;
    hr0: number;
    pE: number;
    pA: number;
};

type PlotDataPoint = {
    [key: string]: number | null;
};

type ValidationErrors = {
    power?: string;
    hr?: string;
    hr0?: string;
    pE?: string;
    pA?: string;
};

export default function CoxPH1SidedPage() {
    const [solveFor, setSolveFor] = useState<string>("sampleSize");
    const [params, setParams] = useState<CalcParams>({
        power: "0.8000",
        sampleSize: 65,
        alpha: 0.05,
        hr: 2,
        hr0: 1,
        pE: 0.8,
        pA: 0.5,
    });
    const [plotData, setPlotData] = useState<PlotDataPoint[]>([]);
    const [xAxisVar, setXAxisVar] = useState<string>("hr");
    const [xAxisMin, setXAxisMin] = useState<number>(0);
    const [xAxisMax, setXAxisMax] = useState<number>(0);
    const [yAxisVars, setYAxisVars] = useState<string[]>([]);
    const [lineColors, setLineColors] = useState<{ [key: string]: string }>({});
    const [errors, setErrors] = useState<ValidationErrors>({});

    useEffect(() => {
        const { hr, hr0, pE, pA } = params;
        if (xAxisVar === 'hr') {
            setXAxisMin(Math.max(0.1, hr * 0.5));
            setXAxisMax(hr * 1.5);
        } else if (xAxisVar === 'hr0') {
            setXAxisMin(Math.max(0.1, hr0 * 0.5));
            setXAxisMax(hr0 * 1.5);
        } else if (xAxisVar === 'pE') {
            setXAxisMin(Math.max(0.01, pE * 0.5));
            setXAxisMax(Math.min(1, pE * 1.5));
        } else if (xAxisVar === 'pA') {
            setXAxisMin(Math.max(0.01, pA * 0.5));
            setXAxisMax(Math.min(0.99, pA * 1.5));
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
        if (params.hr <= 0) {
            newErrors.hr = "Hazard Ratio (θ) must be > 0.";
        }
        if (params.hr0 <= 0) {
            newErrors.hr0 = "Null Hazard Ratio (θ₀) must be > 0.";
        }
        if (params.hr === params.hr0) {
            newErrors.hr = "Hazard Ratio (θ) cannot be equal to Null Hazard Ratio (θ₀).";
        }
        if (params.pE <= 0 || params.pE > 1) {
            newErrors.pE = "Overall Event Probability must be between 0 and 1.";
        }
        if (params.pA <= 0 || params.pA >= 1) {
            newErrors.pA = "Group A Allocation must be between 0 and 1.";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const updatePlotData = useCallback(() => {
        const { alpha, power, hr, hr0, pE, pA } = params;
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
        
        powerScenarios.sort((a, b) => a.value - b.value);

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
                
                let currentHr = hr;
                let currentHr0 = hr0;
                let currentPE = pE;
                let currentPA = pA;

                if (xAxisVar === 'hr') currentHr = x;
                else if (xAxisVar === 'hr0') currentHr0 = x;
                else if (xAxisVar === 'pE') currentPE = x;
                else if (xAxisVar === 'pA') currentPA = x;

                if (currentHr > 0 && currentHr0 > 0 && currentHr !== currentHr0 && currentPE > 0 && currentPE <= 1 && currentPA > 0 && currentPA < 1) {
                    const z_beta = jStat.normal.inv(scenario.value, 0, 1);
                    const numerator = z_alpha + z_beta;
                    const denominator = Math.log(currentHr) - Math.log(currentHr0);
                    if (denominator !== 0) {
                        const term = numerator / denominator;
                        const calculatedN = (1 / (currentPA * (1 - currentPA) * currentPE)) * (term * term);
                        sampleSize = Math.ceil(calculatedN);
                    }
                }
                
                point[scenario.name] = sampleSize && sampleSize > 0 ? sampleSize : null;
            });
            data.push(point);
        }
        setPlotData(data);
    }, [params, xAxisMin, xAxisMax, xAxisVar]);

    const handleCalculate = () => {
        if (!validate()) return;

        const { alpha, power, sampleSize, hr, hr0, pE, pA } = params;
        
        if (solveFor === 'power') {
            if (sampleSize && sampleSize > 0) {
                const z_alpha = jStat.normal.inv(1 - alpha, 0, 1);
                const z = (Math.log(hr) - Math.log(hr0)) * Math.sqrt(sampleSize * pA * (1 - pA) * pE);
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
                const numerator = z_alpha + z_beta;
                const denominator = Math.log(hr) - Math.log(hr0);
                const term = numerator / denominator;
                const calculatedSize = (1 / (pA * (1 - pA) * pE)) * (term * term);
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
        { name: 'sampleSize', label: 'Sample Size (n)', type: 'number' as const, solve: 'sampleSize' as const },
        { name: 'alpha', label: 'Alpha (α)', type: 'number' as const },
        { name: 'hr', label: 'Hazard Ratio (θ)', type: 'number' as const },
        { name: 'hr0', label: 'Null Hazard Ratio (θ₀)', type: 'number' as const },
        { name: 'pE', label: 'Overall Event Probability (p_E)', type: 'number' as const },
        { name: 'pA', label: 'Group A Allocation', type: 'number' as const },
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
                    title="Calculate Sample Size Needed to Test Time-To-Event Data: Cox PH 1-Sided, non-inferiority, or superiority"
                    summary={`You can use this calculator to perform power and sample size calculations for a time-to-event analysis, sometimes called survival analysis. A two-group time-to-event analysis involves comparing the time it takes for a certain event to occur between two groups.

For example, we may be interested in whether there is a difference in recovery time following two different medical treatments. Or, in a marketing analysis we may be interested in whether there is a difference between two marketing campaigns with regards to the time between impression and action, where the action may be, for example, buying a product.

Since 'time-to-event' methods were originally developed as 'survival' methods, the primary parameter of interest is called the hazard ratio. The hazard is the probability of the event occurring in the next instant given that it hasn't yet occurred. The hazard ratio is then the ratio of the hazards between two groups Letting $\\theta$ represent the hazard ratio, the hypotheses of interest are

$H_0:\\theta=\\theta_0$
$H_1:\\theta\\gt \\theta_0$

or
$H_0:\\theta=\\theta_0$
$H_1:\\theta\\lt \\theta_0$

where $\\theta_0$ is the hazard ratio hypothesized under the null hypothesis; $\\theta_0$ can also be viewed as the non-inferiority/superiority margin, just like in the other non-inferiority/superiority calculators here. The calculator above and the formulas below use the notation that
$\\theta$	is the hazard ratio
$\\ln(\\theta)$	is the natural logarithm of the hazard ratio, or the log-hazard ratio
$p_E$	is the overall probability of the event occurring within the study period
$p_A$ and $p_B$	are the proportions of the sample size allotted to the two groups, named 'A' and 'B'
$n$	is the total sample size
Notice that $p_B=1-p_A$.`}
                    formulas={`This calculator uses the following formulas to compute sample size and power, respectively: $n=\\frac{1}{p_A\\;p_B\\;p_E}\\left(\\frac{z_{1-\\alpha}+z_{1-\\beta}}{\\ln(\\theta)-\\ln(\\theta_0)}\\right)^2$
$1-\\beta= \\Phi\\left( z-z_{1-\\alpha}\\right) \\quad ,\\quad z=\\left(\\ln(\\theta)-\\ln(\\theta_0)\\right)\\sqrt{n\\;p_A\\;p_B\\;p_E}$ where

$n$ is sample size
$\\Phi$ is the standard Normal distribution function
$\\Phi^{-1}$ is the standard Normal quantile function
$\\alpha$ is Type I error
$\\beta$ is Type II error, meaning $1-\\beta$ is power`}
                    rCode={`hr=2
hr0=1
pE=0.8
pA=0.5
alpha=0.05/2
beta=0.20
(n=((qnorm(1-alpha)+qnorm(1-beta))/(log(hr)-log(hr0)))^2/(pA*(1-pA)*pE))
ceiling(n) # 82
(Power=pnorm((log(hr)-log(hr0))*sqrt(n*pA*(1-pA)*pE)-qnorm(1-alpha)))
## Note: divide alpha by 2 to get 2-sided test of the cited example`}
                    references={[
                        "Chow S, Shao J, Wang H. 2008. Sample Size Calculations in Clinical Research. 2nd Ed. Chapman & Hall/CRC Biostatistics Series. page 177."
                    ]}
                />
            </div>
        </div>
    );
}
