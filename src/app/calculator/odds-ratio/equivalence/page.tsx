"use client";

import { useState, useEffect } from "react";
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
    pA: number | null;
    pB: number | null;
    delta: number | null;
    kappa: number | null;
};

type ValidationErrors = {
    power?: string;
    pA?: string;
    pB?: string;
    delta?: string;
    kappa?: string;
    general?: string;
};

// 계산기 페이지에 맞게 컴포넌트 이름을 변경하세요.
export default function OddsRatioEquivalenceCalculator() {
    const [solveFor, setSolveFor] = useState<string>("sampleSize");
    // 초기 파라미터 값을 설정하세요.
    const [params, setParams] = useState<CalcParams>({
        power: "0.80",
        sampleSize: 366,
        alpha: 0.05,
        pA: 0.25,
        pB: 0.25,
        delta: 0.50,
        kappa: 1,
    });
    const [plotData, setPlotData] = useState<any[]>([]);
    const [xAxisVar, setXAxisVar] = useState<string>("pA"); // 가장 처음 나오는 값을 기본 x축 변수로 설정하세요.
    const [xAxisMin, setXAxisMin] = useState<number>(0); // 고정
    const [xAxisMax, setXAxisMax] = useState<number>(0); // 고정
    const [yAxisVars, setYAxisVars] = useState<string[]>([]);
    const [lineColors, setLineColors] = useState<{ [key: string]: string }>({});
    const [errors, setErrors] = useState<ValidationErrors>({});

    useEffect(() => {
        const { pA, pB, delta, kappa } = params;
        if (xAxisVar === 'delta' && delta) {
            const OR = (pA && pB) ? Math.abs(Math.log((pA * (1 - pB)) / (pB * (1 - pA)))) : 0;
            setXAxisMin(Math.max(OR * 1.01, delta * 0.5));
            setXAxisMax(delta * 1.5);
        } else if (xAxisVar === 'pA' && pA) {
            setXAxisMin(Math.max(0.01, pA * 0.5));
            setXAxisMax(Math.min(0.99, pA * 1.5));
        } else if (xAxisVar === 'pB' && pB) {
            setXAxisMin(Math.max(0.01, pB * 0.5));
            setXAxisMax(Math.min(0.99, pB * 1.5));
        } else if (xAxisVar === 'kappa' && kappa) {
            setXAxisMin(Math.max(0.1, kappa * 0.5));
            setXAxisMax(kappa * 1.5);
        }
    }, [xAxisVar, params]);

    const validate = () => {
        const newErrors: ValidationErrors = {};
        const { power, pA, pB, delta, kappa } = params;
        if (power) {
            const powerValue = parseFloat(power);
            if (powerValue <= 0 || powerValue >= 1) {
                newErrors.power = "Power must be between 0 and 1.";
            }
        }
        if (pA === null || pA <= 0 || pA >= 1) {
            newErrors.pA = "p(Outcome in Group A) must be between 0 and 1.";
        }
        if (pB === null || pB <= 0 || pB >= 1) {
            newErrors.pB = "p(Outcome in Group B) must be between 0 and 1.";
        }
        if (delta === null || delta <= 0) {
            newErrors.delta = "Equivalence margin (δ) must be greater than 0.";
        }
        if (kappa === null || kappa <= 0) {
            newErrors.kappa = "Sample size ratio (κ) must be greater than 0.";
        }

        if (pA && pB && delta && pA > 0 && pA < 1 && pB > 0 && pB < 1 && delta > 0) {
            const OR = (pA * (1 - pB)) / (pB * (1 - pA));
            if (Math.abs(Math.log(OR)) >= delta) {
                newErrors.general = "Equivalence margin (δ) must be greater than |ln(OR)|.";
            }
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const updatePlotData = () => {
        const { alpha, power, pA, pB, delta, kappa } = params;
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

        const z_alpha = jStat.normal.inv(1 - alpha, 0, 1);

        for (let i = 0; i < 100; i++) {
            const x = xAxisMin + (xAxisMax - xAxisMin) * (i / 99);
            let point: any = { [xAxisVar]: x };
            
            powerScenarios.forEach(scenario => {
                let sampleSize: number | null = null;
                
                let currentPA = pA;
                let currentPB = pB;
                let currentDelta = delta;
                let currentKappa = kappa;

                if (xAxisVar === 'pA') currentPA = x;
                if (xAxisVar === 'pB') currentPB = x;
                if (xAxisVar === 'delta') currentDelta = x;
                if (xAxisVar === 'kappa') currentKappa = x;
                
                if (currentPA && currentPB && currentDelta && currentKappa &&
                    currentPA > 0 && currentPA < 1 &&
                    currentPB > 0 && currentPB < 1 &&
                    currentDelta > 0 && currentKappa > 0) {
                    
                    const OR = (currentPA * (1 - currentPB)) / (currentPB * (1 - currentPA));

                    if (Math.abs(Math.log(OR)) < currentDelta) {
                        const z_beta_2 = jStat.normal.inv(1 - scenario.value / 2, 0, 1);
                        const term1 = 1 / (currentKappa * currentPA * (1 - currentPA)) + 1 / (currentPB * (1 - currentPB));
                        const term2 = Math.pow((z_alpha + z_beta_2) / (currentDelta - Math.abs(Math.log(OR))), 2);
                        const calculatedN = term1 * term2;
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

        const { alpha, power, sampleSize, pA, pB, delta, kappa } = params;
        
        if (solveFor === 'power') {
            if (sampleSize && sampleSize > 0 && pA && pB && delta && kappa) {
                const OR = (pA * (1 - pB)) / (pB * (1 - pA));
                const lnOR = Math.log(OR);

                const term1 = 1 / (kappa * pA * (1 - pA)) + 1 / (pB * (1 - pB));
                const sigma = Math.sqrt(term1 / sampleSize);
                
                const z = (Math.abs(lnOR) - delta) / sigma;
                
                const z_alpha = jStat.normal.inv(1 - alpha, 0, 1);
                
                const calculatedPower = jStat.normal.cdf(z - z_alpha, 0, 1) + 
                                      jStat.normal.cdf(-z - z_alpha, 0, 1);

                const formattedPower = calculatedPower.toFixed(4);
                if (params.power !== formattedPower) {
                    setParams(p => ({ ...p, power: formattedPower }));
                }
            } else {
                setParams(p => ({...p, power: null}));
            }
        } else { // solveFor === 'sampleSize'
            const powerValue = power ? parseFloat(power) : null;
            if (powerValue && powerValue > 0 && powerValue < 1 && pA && pB && delta && kappa) {
                const OR = (pA * (1 - pB)) / (pB * (1 - pA));
                const z_alpha = jStat.normal.inv(1 - alpha, 0, 1);

                const beta = 1 - powerValue;
                const z_beta_2 = jStat.normal.inv(1 - beta / 2, 0, 1);
                
                const term1 = 1 / (kappa * pA * (1 - pA)) + 1 / (pB * (1 - pB));
                const term2 = Math.pow((z_alpha + z_beta_2) / (Math.abs(Math.log(OR)) - delta), 2);
                
                const calculatedSize = term1 * term2;
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

    // 바꾸지 말 것
    useEffect(() => {
        updatePlotData();
    }, [xAxisVar, xAxisMin, xAxisMax]);

    const handleParamsChange = (newParams: { [key: string]: any }) => {
        setParams(prevParams => ({ ...prevParams, ...newParams }));
    };

    // TODO: 계산기의 입력 필드를 정의하세요.
    const inputFields = [
        // 필수 입력 필드
        { name: 'power', label: 'Power (1-β)', type: 'text' as const, solve: 'power' as const },
        { name: 'sampleSize', label: 'Sample Size (nB)', type: 'number' as const, solve: 'sampleSize' as const },
        { name: 'alpha', label: 'Alpha (α)', type: 'number' as const },
        { name: 'pA', label: 'p(Outcome in Group A) (pA)', type: 'number' as const },
        { name: 'pB', label: 'p(Outcome in Group B) (pB)', type: 'number' as const },
        { name: 'delta', label: 'Equivalence Margin (δ)', type: 'number' as const },
        { name: 'kappa', label: 'Sample Size Ratio (κ=nA/nB)', type: 'number' as const },
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
                                yAxisLabel="Sample Size (nB)" // TODO: Y축 레이블을 조정하세요.
                                yAxisVars={yAxisVars}
                                lineColors={lineColors}
                                xAxisOptions={xAxisOptions}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div>
                {/* BUG: Power 계산이 잘못되었습니다. */}
                <div style={{ color: "red", marginBottom: "1rem" }}>
                    Power calculation is not working correctly. Please check the implementation.
                </div>
                {/* TODO: 설명, 수식, R 코드, 참고 문헌을 업데이트하세요. */}
                <DescriptionSection
                    title="Calculate Sample Size Needed to Test Odds Ratio: Equivalence"
                    summary={`This calculator is useful when we wish to test whether the odds of an outcome in two groups are equivalent, without concern of which group's odds is larger. Suppose we collect a sample from a group 'A' and a group 'B'; that is we collect two samples, and will conduct a two-sample test. For example, we may wish to test whether a new product is equivalent to an existing, industry standard product. Here, the 'burden of proof', so to speak, falls on the new product; that is, equivalence is actually represented by the alternative, rather than the null hypothesis.

$H_0:|\\ln(OR)|\\ge\\delta$
$H_1:|\\ln(OR)|<\\delta$

where $\\delta$ is the superiority or non-inferiority margin and the ratio between the sample sizes of the two groups is
$\\kappa=\\frac{n_A}{n_B}$`}
                    formulas={`This calculator uses the following formulas to compute sample size and power, respectively:
$n_A=\\kappa n_B \\;\\text{ and }\\; n_B=\\left(\\frac{1}{\\kappa p_A(1-p_A)}+\\frac{1}{p_B(1-pB)}\\right) \\left(\\frac{z_{1-\\alpha}+z_{1-\\beta/2}}{|\\ln(OR)|-\\delta}\\right)^2$
$1-\\beta= \\Phi\\left(z-z_{1-\\alpha}\\right)+\\Phi\\left(-z-z_{1-\\alpha}\\right) \\quad ,\\quad z=\\frac{(|\\ln(OR)|-\\delta)\\sqrt{n_B}}{\\sqrt{\\frac{1}{\\kappa p_A(1-p_A)}+\\frac{1}{p_B(1-p_B)}}}$
where
$OR=\\frac{p_A(1-p_B)}{p_B(1-p_A)}$
and where

$\\kappa=n_A/n_B$ is the matching ratio
$\\Phi$ is the standard Normal distribution function
$\\Phi^{-1}$ is the standard Normal quantile function
$\\alpha$ is Type I error
$\\beta$ is Type II error, meaning $1-\\beta$ is power
$\\delta$ is the testing margin`}
                    rCode={`pA=0.25
pB=0.25
delta=0.50
kappa=1
alpha=0.05
beta=0.20
(OR=pA*(1-pB)/pB/(1-pA)) # 1
(nB=(1/(kappa*pA*(1-pA))+1/(pB*(1-pB)))*((qnorm(1-alpha)+qnorm(1-beta/2))/(delta-abs(log(OR))))^2)
ceiling(nB) # 366
z=(abs(log(OR))-delta)*sqrt(nB)/sqrt(1/(kappa*pA*(1-pA))+1/(pB*(1-pB)))
(Power=pnorm(z-qnorm(1-alpha))+pnorm(-z-qnorm(1-alpha)))`}
                    references={[
                        "Chow S, Shao J, Wang H. 2008. Sample Size Calculations in Clinical Research. 2nd Ed. Chapman & Hall/CRC Biostatistics Series. page 107."
                    ]}
                />
            </div>
        </div>
    );
}
