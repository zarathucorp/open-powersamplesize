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
    hr: number;
    delta: number;
    pE: number;
    pA: number;
};

type ValidationErrors = {
    power?: string;
    hr?: string;
    delta?: string;
    pE?: string;
    pA?: string;
};

export default function CoxPHEquivalence() {
    const [solveFor, setSolveFor] = useState<string>("sampleSize");
    const [params, setParams] = useState<CalcParams>({
        power: "0.8000",
        sampleSize: 172,
        alpha: 0.05,
        hr: 1,
        delta: 0.5,
        pE: 0.8,
        pA: 0.5,
    });
    const [plotData, setPlotData] = useState<any[]>([]);
    const [xAxisVar, setXAxisVar] = useState<string>("hr");
    const [xAxisMin, setXAxisMin] = useState<number>(0);
    const [xAxisMax, setXAxisMax] = useState<number>(0);
    const [yAxisVars, setYAxisVars] = useState<string[]>([]);
    const [lineColors, setLineColors] = useState<{ [key: string]: string }>({});
    const [errors, setErrors] = useState<ValidationErrors>({});

    useEffect(() => {
        const { hr, delta, pE, pA } = params;
        if (xAxisVar === 'delta') {
            setXAxisMin(Math.max(Math.abs(Math.log(hr)) + 0.01, delta * 0.5));
            setXAxisMax(delta * 1.5);
        } else if (xAxisVar === 'hr') {
            setXAxisMin(Math.max(0.1, hr * 0.5));
            setXAxisMax(hr * 1.5);
        } else if (xAxisVar === 'pE') {
            setXAxisMin(Math.max(0.01, pE * 0.5));
            setXAxisMax(Math.min(0.99, pE * 1.5));
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
            newErrors.hr = "Hazard Ratio must be > 0.";
        }
        if (params.delta <= 0) {
            newErrors.delta = "Margin of Equivalence must be > 0.";
        }
        if (params.delta <= Math.abs(Math.log(params.hr))) {
            newErrors.delta = "Margin (δ) must be > |ln(Hazard Ratio)|.";
        }
        if (params.pE <= 0 || params.pE >= 1) {
            newErrors.pE = "Overall Event Probability must be between 0 and 1.";
        }
        if (params.pA <= 0 || params.pA >= 1) {
            newErrors.pA = "Proportion in Group A must be between 0 and 1.";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const updatePlotData = () => {
        const { alpha, power, ...otherParams } = params;
        const { hr, delta, pE, pA } = otherParams;
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
                
                let currentHr = hr;
                let currentDelta = delta;
                let currentPE = pE;
                let currentPA = pA;

                if (xAxisVar === 'hr') currentHr = x;
                if (xAxisVar === 'delta') currentDelta = x;
                if (xAxisVar === 'pE') currentPE = x;
                if (xAxisVar === 'pA') currentPA = x;

                if (currentDelta > Math.abs(Math.log(currentHr)) && currentPE > 0 && currentPE < 1 && currentPA > 0 && currentPA < 1) {
                    const z_beta_half = jStat.normal.inv((1 + scenario.value) / 2, 0, 1);
                    const numerator = z_alpha + z_beta_half;
                    const denominator = currentDelta - Math.abs(Math.log(currentHr));
                    const pB = 1 - currentPA;
                    
                    if (denominator > 0) {
                        const calculatedN = (1 / (currentPA * pB * currentPE)) * Math.pow(numerator / denominator, 2);
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
        if (!validate()) {
            if (solveFor === 'sampleSize') {
                setParams(p => ({ ...p, sampleSize: null }));
            } else {
                setParams(p => ({ ...p, power: null }));
            }
            return;
        }

        const { alpha, power, sampleSize, hr, delta, pE, pA } = params;
        
        if (solveFor === 'power') {
            if (sampleSize && sampleSize > 0) {
                const z_alpha = jStat.normal.inv(1 - alpha, 0, 1);
                const pB = 1 - pA;
                const z = (delta - Math.abs(Math.log(hr))) * Math.sqrt(sampleSize * pA * pB * pE);
                const calculatedPower = 2 * jStat.normal.cdf(z - z_alpha, 0, 1) - 1;
                
                if (calculatedPower > 0 && calculatedPower < 1) {
                    const formattedPower = calculatedPower.toFixed(4);
                    setParams(p => ({ ...p, power: formattedPower }));
                } else {
                    setParams(p => ({...p, power: null}));
                }
            } else {
                setParams(p => ({...p, power: null}));
            }
        } else { // solveFor === 'sampleSize'
            const powerValue = power ? parseFloat(power) : null;
            if (powerValue && powerValue > 0 && powerValue < 1) {
                const z_alpha = jStat.normal.inv(1 - alpha, 0, 1);
                const z_beta_half = jStat.normal.inv((1 + powerValue) / 2, 0, 1);
                const numerator = z_alpha + z_beta_half;
                const denominator = delta - Math.abs(Math.log(hr));
                const pB = 1 - pA;

                if (denominator > 0) {
                    const calculatedSize = (1 / (pA * pB * pE)) * Math.pow(numerator / denominator, 2);
                    setParams(p => ({ ...p, sampleSize: Math.ceil(calculatedSize) }));
                } else {
                    setParams(p => ({...p, sampleSize: null}));
                }
            } else {
                setParams(p => ({...p, sampleSize: null}));
            }
        }
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
        { name: 'hr', label: 'Hazard Ratio (θ)', type: 'number' as const },
        { name: 'pE', label: 'Overall Event Probability (pE)', type: 'number' as const },
        { name: 'pA', label: 'Proportion in Group A (pA)', type: 'number' as const },
        { name: 'delta', label: 'Margin of Equivalence (δ)', type: 'number' as const },
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
                {/* TODO: 설명, 수식, R 코드, 참고 문헌을 업데이트하세요. */}
                <DescriptionSection
                    title="Calculate Sample Size Needed to Test Time-To-Event Data: Cox PH, Equivalence"
                    summary={`You can use this calculator to perform power and sample size calculations for a time-to-event analysis, sometimes called survival analysis. A two-group time-to-event analysis involves comparing the time it takes for a certain event to occur between two groups.

For example, we may be interested in whether there is a difference in recovery time following two different medical treatments. Or, in a marketing analysis we may be interested in whether there is a difference between two marketing campaigns with regards to the time between impression and action, where the action may be, for example, buying a product.

Since 'time-to-event' methods were originally developed as 'survival' methods, the primary parameter of interest is called the hazard ratio. The hazard is the probability of the event occurring in the next instant given that it hasn't yet occurred. The hazard ratio is then the ratio of the hazards between two groups Letting $\\theta$ represent the hazard ratio, the hypotheses of interest are

$H_0:|\\ln(\\theta)|\\ge\\delta$
$H_1:|\\ln(\\theta)|\\lt \\delta$

where $\\delta$ is the equivalence margin, just like in the other equivalence calculators here. The calculator above and the formulas below use the notation that
$\\theta$	is the hazard ratio
$\\ln(\\theta)$	is the natural logarithm of the hazard ratio, or the log-hazard ratio
$p_E$	is the overall probability of the event occurring within the study period
$p_A$ and $p_B$	are the proportions of the sample size allotted to the two groups, named 'A' and 'B'
$n$	is the total sample size
Notice that $p_B=1-p_A$.`}
                    formulas={`This calculator uses the following formulas to compute sample size and power, respectively:
$n=\\frac{1}{p_A\\;p_B\\;p_E}\\left(\\frac{z_{1-\\alpha}+z_{1-\\beta/2}}{\\delta-|\\ln(\\theta)|}\\right)^2$
$1-\\beta= 2\\Phi\\left( z-z_{1-\\alpha}\\right)-1 \\quad ,\\quad z=\\left(\\delta-|\\ln(\\theta)|\\right)\\sqrt{n\\;p_A\\;p_B\\;p_E}$

where

$n$ is sample size
$\\Phi$ is the standard Normal distribution function
$\\Phi^{-1}$ is the standard Normal quantile function
$\\alpha$ is Type I error
$\\beta$ is Type II error, meaning $1-\\beta$ is power
$\\delta$ is the testing margin`}
                    rCode={`hr=1
delta=0.5
pE=0.8
pA=0.5
alpha=0.05
beta=0.20
(n=((qnorm(1-alpha)+qnorm(1-beta/2))/(delta-abs(log(hr))))^2/(pA*(1-pA)*pE))
ceiling(n) # 172
(Power=2*pnorm((delta-abs(log(hr)))*sqrt(n*pA*(1-pA)*pE)-qnorm(1-alpha))-1)`}
                    references={[
                        "Chow S, Shao J, Wang H. 2008. Sample Size Calculations in Clinical Research. 2nd Ed. Chapman & Hall/CRC Biostatistics Series. page 177."
                    ]}
                />
            </div>
        </div>
    );
}
