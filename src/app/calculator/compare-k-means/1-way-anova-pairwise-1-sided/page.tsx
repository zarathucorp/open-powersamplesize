"use client";

import { useState, useEffect } from "react";
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
    meanA: number;
    meanB: number;
    stdDevA: number;
    stdDevB: number;
    kappa: number;
    tau: number;
};

type ValidationErrors = {
    power?: string;
    meanA?: string;
    meanB?: string;
    stdDevA?: string;
    stdDevB?: string;
    kappa?: string;
    tau?: string;
};

// TODO: 계산기 페이지에 맞게 컴포넌트 이름을 변경하세요.
export default function OneWayAnovaPairwise1Sided() {
    const [solveFor, setSolveFor] = useState<string>("sampleSize");
    // TODO: 초기 파라미터 값을 설정하세요.
    const [params, setParams] = useState<CalcParams>({
        power: "0.8000",
        sampleSize: 85,
        alpha: 0.05,
        meanA: 132.86,
        meanB: 127.44,
        stdDevA: 15.34,
        stdDevB: 18.23,
        kappa: 2,
        tau: 1,
    });
    const [plotData, setPlotData] = useState<any[]>([]);
    const [xAxisVar, setXAxisVar] = useState<string>("meanA"); // TODO: 기본 x축 변수를 설정하세요.
    const [xAxisMin, setXAxisMin] = useState<number>(0); // Default
    const [xAxisMax, setXAxisMax] = useState<number>(0); // Default
    const [yAxisVars, setYAxisVars] = useState<string[]>([]);
    const [lineColors, setLineColors] = useState<{ [key: string]: string }>({});
    const [errors, setErrors] = useState<ValidationErrors>({});

    useEffect(() => {
        const { meanA, meanB, stdDevA, stdDevB, kappa, tau } = params;
        if (xAxisVar === 'meanA') {
            setXAxisMin(meanA * 0.8);
            setXAxisMax(meanA * 1.2);
        } else if (xAxisVar === 'meanB') {
            setXAxisMin(meanB * 0.8);
            setXAxisMax(meanB * 1.2);
        } else if (xAxisVar === 'stdDevA') {
            setXAxisMin(stdDevA * 0.5);
            setXAxisMax(stdDevA * 1.5);
        } else if (xAxisVar === 'stdDevB') {
            setXAxisMin(stdDevB * 0.5);
            setXAxisMax(stdDevB * 1.5);
        } else if (xAxisVar === 'kappa') {
            setXAxisMin(Math.max(0.1, kappa * 0.5));
            setXAxisMax(kappa * 1.5);
        } else if (xAxisVar === 'tau') {
            setXAxisMin(Math.max(1, tau * 0.5));
            setXAxisMax(tau * 1.5);
        }
    }, [xAxisVar, params.meanB, params.stdDevA, params.stdDevB, params.kappa, params.tau]);

    const validate = () => {
        const newErrors: ValidationErrors = {};
        if (params.power) {
            const powerValue = parseFloat(params.power);
            if (powerValue <= 0 || powerValue >= 1) {
                newErrors.power = "Power must be between 0 and 1.";
            }
        }
        if (params.meanA <= 0) newErrors.meanA = "Mean of Group A must be > 0";
        if (params.meanB <= 0) newErrors.meanB = "Mean of Group B must be > 0";
        if (params.stdDevA <= 0) newErrors.stdDevA = "Std Dev of Group A must be > 0";
        if (params.stdDevB <= 0) newErrors.stdDevB = "Std Dev of Group B must be > 0";
        if (params.kappa <= 0) newErrors.kappa = "Matching Ratio must be > 0";
        if (params.tau < 1) newErrors.tau = "Number of Comparisons must be >= 1";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const updatePlotData = () => {
        const { alpha, power, meanA, meanB, stdDevA, stdDevB, kappa, tau } = params;
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

        // Calculate으로 생성된 power는 항상 #8884d8 색상을 사용합니다.
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
                
                let currentMeanA = meanA;
                let currentMeanB = meanB;
                let currentStdDevA = stdDevA;
                let currentStdDevB = stdDevB;
                let currentKappa = kappa;
                let currentTau = tau;

                if (xAxisVar === 'meanA') currentMeanA = x;
                if (xAxisVar === 'meanB') currentMeanB = x;
                if (xAxisVar === 'stdDevA') currentStdDevA = x;
                if (xAxisVar === 'stdDevB') currentStdDevB = x;
                if (xAxisVar === 'kappa') currentKappa = x;
                if (xAxisVar === 'tau') currentTau = x;
                
                const z_alpha = jStat.normal.inv(1 - alpha / currentTau, 0, 1);
                const z_beta = jStat.normal.inv(scenario.value, 0, 1);

                if (currentMeanA !== currentMeanB) {
                    const numerator = (Math.pow(currentStdDevA, 2) + Math.pow(currentStdDevB, 2) / currentKappa) * Math.pow(z_alpha + z_beta, 2);
                    const denominator = Math.pow(currentMeanA - currentMeanB, 2);
                    const calculatedN = numerator / denominator;
                    sampleSize = Math.ceil(calculatedN);
                }
                
                point[scenario.name] = sampleSize && sampleSize > 0 ? sampleSize : null;
            });
            data.push(point);
        }
        setPlotData(data);
    };

    const handleCalculate = () => {
        if (!validate()) return;

        const { alpha, power, sampleSize, meanA, meanB, stdDevA, stdDevB, kappa, tau } = params;
        
        if (solveFor === 'power') {
            if (sampleSize && sampleSize > 0) {
                const z_alpha = jStat.normal.inv(1 - alpha / tau, 0, 1);
                const term1 = Math.abs(meanA - meanB) / Math.sqrt((Math.pow(stdDevA, 2) + Math.pow(stdDevB, 2) / kappa));
                const term2 = Math.sqrt(sampleSize);
                const calculatedPower = jStat.normal.cdf(term1 * term2 - z_alpha, 0, 1);
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
                const z_alpha = jStat.normal.inv(1 - alpha / tau, 0, 1);
                const z_beta = jStat.normal.inv(powerValue, 0, 1);
                const numerator = (Math.pow(stdDevA, 2) + Math.pow(stdDevB, 2) / kappa) * Math.pow(z_alpha + z_beta, 2);
                const denominator = Math.pow(meanA - meanB, 2);
                const calculatedSize = numerator / denominator;
                if (params.sampleSize !== calculatedSize) {
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
    }, [xAxisVar, xAxisMin, xAxisMax, params.alpha]);

    const handleParamsChange = (newParams: { [key: string]: any }) => {
        setParams(prevParams => ({ ...prevParams, ...newParams }));
    };

    const inputFields = [
        { name: 'power', label: 'Power (1-β)', type: 'text' as const, solve: 'power' as const },
        { name: 'sampleSize', label: 'Sample Size (nA)', type: 'number' as const, solve: 'sampleSize' as const },
        { name: 'alpha', label: 'Alpha (α)', type: 'number' as const },
        { name: 'meanA', label: 'Mean of Group A (μA)', type: 'number' as const },
        { name: 'meanB', label: 'Mean of Group B (μB)', type: 'number' as const },
        { name: 'stdDevA', label: 'Std Dev of Group A (σA)', type: 'number' as const },
        { name: 'stdDevB', label: 'Std Dev of Group B (σB)', type: 'number' as const },
        { name: 'kappa', label: 'Matching Ratio (κ=nA/nB)', type: 'number' as const },
        { name: 'tau', label: 'Number of Comparisons (τ)', type: 'number' as const },
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
                                yAxisLabel="Sample Size (nA)" // TODO: Y축 레이블을 조정하세요.
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
                    title="Calculate Sample Size Needed to Compare k Means: 1-Way ANOVA Pairwise, 1-Sided"
                    summary={`This calculator is useful for testing the means of several groups. The statistical model is called an Analysis of Variance, or ANOVA model. This calculator is for the particular situation where we wish to make pairwise comparisons between groups. That is, we compare two groups at a time, and we make several of these comparisons.

For example, suppose we want to compare the means of three groups called foo, bar, and ack. These groups may represent groups of people that have been exposed to three different medical procedures, marketing schemes, etc. The complete list of pairwise comparisons are foo vs. bar, foo vs. ack, and bar vs. ack.

In more general terms, we may have $k$ groups, meaning there are a total of $K\\equiv\\binom{k}{2}=k(k-1)/2$ possible pairwise comparisons. When we test $\\tau\\le K$ of these pairwise comparisons, we have $\\tau$ hypotheses of the form


$H_0:\\mu_A=\\mu_B$
$H_1:\\mu_A\\lt\\mu_B$

or
$H_0:\\mu_A=\\mu_B$
$H_1:\\mu_A\\lt\\mu_B$

where $\\mu_A$ and $\\mu_B$ represent the means of two of the $k$ groups, groups 'A' and 'B'. We'll compute the required sample size for each of the $\\tau$ comparisons, and total sample size needed is the largest of these.`}
                    formulas={`This calculator uses the following formulas to compute sample size and power, respectively: 
                        $n_A=\\left(\\sigma_A^2+\\sigma_B^2/\\kappa\\right)\\left(\\frac{z_{1-\\alpha/\\tau}+z_{1-\\beta}}{\\mu_A-\\mu_B}\\right)^2$
$n_B=\\kappa n_A$
$1-\\beta=\\Phi\\left(\\frac{|\\mu_A-\\mu_B|\\sqrt{n_A}}{\\sqrt{\\sigma_A^2+\\sigma_B^2/\\kappa}}-z_{1-\\alpha/\\tau}\\right)$
where

$\\kappa=n_A/n_B$ is the matching ratio
$\\sigma$ is standard deviation
$\\sigma_A$ is standard deviation in Group "A"
$\\sigma_B$ is standard deviation in Group "B"
$\\Phi$ is the standard Normal distribution function
$\\Phi^{-1}$ is the standard Normal quantile function
$\\alpha$ is Type I error
$\\tau$ is the number of comparisons to be made
$\\beta$ is Type II error, meaning $1-\\beta$ is power`}
                    rCode={`muA=132.86
muB=127.44
kappa=2
sdA=15.34
sdB=18.23
tau=1
alpha=0.05
beta=0.20
(nA=(sdA^2+sdB^2/kappa)*((qnorm(1-alpha/tau)+qnorm(1-beta))/(muA-muB))^2)
ceiling(nA) # 85
z=(muA-muB)/sqrt(sdA^2+sdB^2/kappa)*sqrt(nA)
(Power=pnorm(z-qnorm(1-alpha/tau)))
## Note: Rosner example on p.303 is for 2-sided test.
## These formulas give the numbers in that example
## after dividing alpha by 2, to get 2-sided alpha.
## Also, we don't yet have an example using tau!=1.
## If you'd like to contribute one please let us know!`}
                    references={[
                        "Rosner B. 2010. Fundamentals of Biostatistics. 7th Ed. Brooks/Cole. page 302 and 303.",
                        "Chow S, Shao J, Wang H. 2008. Sample Size Calculations in Clinical Research. 2nd Ed. Chapman & Hall/CRC Biostatistics Series. page 58.",
                    ]}
                />
            </div>
        </div>
    );
}
