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
    mean: number;
    nullHypothesisMean: number;
    stdDev: number;
};

type ValidationErrors = {
    power?: string;
}

export default function Test1Mean2SidedEqualityPage() {
    const [solveFor, setSolveFor] = useState<string>("sampleSize");
    const [params, setParams] = useState<CalcParams>({
        alpha: 0.05,
        power: "0.8000",
        sampleSize: 32,
        mean: 2,
        nullHypothesisMean: 1.5,
        stdDev: 1,
    });
    const [plotData, setPlotData] = useState<any[]>([]);
    const [xAxisVar, setXAxisVar] = useState<string>("mean");
    const [xAxisMin, setXAxisMin] = useState<number>(1.6);
    const [xAxisMax, setXAxisMax] = useState<number>(2.4);
    const [yAxisVars, setYAxisVars] = useState<string[]>([]);
    const [lineColors, setLineColors] = useState<{ [key: string]: string }>({});
    const [errors, setErrors] = useState<ValidationErrors>({});

    useEffect(() => {
        if (xAxisVar === 'mean') {
            setXAxisMin(1.8);
            setXAxisMax(2.2);
        } else if (xAxisVar === 'nullHypothesisMean') {
            setXAxisMin(1.35);
            setXAxisMax(1.65);
        } else if (xAxisVar === 'stdDev') {
            setXAxisMin(0.9);
            setXAxisMax(1.1);
        }
    }, [xAxisVar]);

    const validate = () => {
        const newErrors: ValidationErrors = {};
        if (params.power) {
            const powerValue = parseFloat(params.power);
            if (powerValue <= 0 || powerValue >= 1) {
                newErrors.power = "Power must be between 0 and 1.";
            }
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    const updatePlotData = () => {
        const { alpha, power, mean, nullHypothesisMean, stdDev } = params;
        const mu = mean;
        const mu0 = nullHypothesisMean;
        const sd = stdDev;
        const data = [];
        const effectSize = mu - mu0;

        if (solveFor === 'power' && effectSize === 0) {
            setPlotData([]);
            return;
        }

        const powerValue = power ? parseFloat(power) : null;
        const powerScenarios: { name: string, value: number }[] = [];
        const colors = ['#8884d8', '#82ca9d', '#ffc658'];
        const newColors: { [key: string]: string } = {};

        if (powerValue && powerValue > 0 && powerValue < 1) {
            const powerName = `${(powerValue * 100).toFixed(2)}%`;
            powerScenarios.push({ name: powerName, value: powerValue });
        }

        [0.9, 0.7].forEach(val => {
            if (!powerScenarios.some(s => s.value === val)) {
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
            
            if (xAxisVar === 'mean') {
                powerScenarios.forEach(scenario => {
                    if (x !== mu0) {
                        const requiredN = Math.ceil(Math.pow((sd * (jStat.normal.inv(1 - alpha / 2, 0, 1) + jStat.normal.inv(scenario.value, 0, 1))) / (x - mu0), 2));
                        point[scenario.name] = requiredN > 0 ? requiredN : null;
                    } else {
                        point[scenario.name] = null;
                    }
                });
            } else if (xAxisVar === 'nullHypothesisMean') {
                powerScenarios.forEach(scenario => {
                    if (mu !== x) {
                        const requiredN = Math.ceil(Math.pow((sd * (jStat.normal.inv(1 - alpha / 2, 0, 1) + jStat.normal.inv(scenario.value, 0, 1))) / (mu - x), 2));
                        point[scenario.name] = requiredN > 0 ? requiredN : null;
                    } else {
                        point[scenario.name] = null;
                    }
                });
            } else if (xAxisVar === 'stdDev') {
                powerScenarios.forEach(scenario => {
                    if (x > 0 && effectSize !== 0) {
                        const requiredN = Math.ceil(Math.pow((x * (jStat.normal.inv(1 - alpha / 2, 0, 1) + jStat.normal.inv(scenario.value, 0, 1))) / (mu - mu0), 2));
                        point[scenario.name] = requiredN > 0 ? requiredN : null;
                    } else {
                        point[scenario.name] = null;
                    }
                });
            }
            data.push(point);
        }
        setPlotData(data);
    };

    const handleCalculate = () => {
        if (!validate()) return;

        const { alpha, power, sampleSize, mean, nullHypothesisMean, stdDev } = params;
        const mu = mean;
        const mu0 = nullHypothesisMean;
        const sd = stdDev;

        if (solveFor === 'power') {
            if (sampleSize && sampleSize > 0) {
                const z = (mu - mu0) / sd * Math.sqrt(sampleSize);
                const calculatedPower = jStat.normal.cdf(z - jStat.normal.inv(1 - alpha / 2, 0, 1), 0, 1) + jStat.normal.cdf(-z - jStat.normal.inv(1 - alpha / 2, 0, 1), 0, 1);
                const formattedPower = calculatedPower.toFixed(4);
                if (params.power !== formattedPower) {
                    setParams(p => ({ ...p, power: formattedPower }));
                }
            } else {
                setParams(p => ({...p, power: null}));
            }
        } else {
            const powerValue = power ? parseFloat(power) : null;
            if (powerValue && powerValue > 0 && powerValue < 1 && mu !== mu0) {
                const n = Math.ceil(Math.pow((sd * (jStat.normal.inv(1 - alpha / 2, 0, 1) + jStat.normal.inv(powerValue, 0, 1))) / (mu - mu0), 2));
                if (params.sampleSize !== n) {
                    setParams(p => ({ ...p, sampleSize: n }));
                }
            } else {
                setParams(p => ({...p, sampleSize: null}));
            }
        }
        updatePlotData();
    };

    useEffect(() => {
        updatePlotData();
    }, [xAxisVar, xAxisMin, xAxisMax]);

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
                                onParamsChange={setParams}
                                solveFor={solveFor}
                                onSolveForChange={setSolveFor}
                                onCalculate={handleCalculate}
                                errors={errors}
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
                                yAxisLabel="Sample Size"
                                yAxisVars={yAxisVars}
                                lineColors={lineColors}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div>
                <DescriptionSection
                    title="Test 1 Mean: 1-Sample, 2-Sided Equality"
                    summary={`This calculator is useful for tests concerning whether a mean, $\\mu$, is equal to a reference value, $\\mu_0$. The Null and Alternative hypotheses are
$H_0: \\mu = \\mu_0$
$H_1: \\mu \\neq \\mu_0$`}
                    formulas={`This calculator uses the following formulas to compute sample size and power, respectively:

$n = \\left(\\frac{\\sigma(z_{1-\\alpha/2} + z_{1-\\beta})}{\\mu - \\mu_0}\\right)^2$

$1-\\beta = \\Phi(z - z_{1-\\alpha/2}) + \\Phi(-z - z_{1-\\alpha/2}), \\quad z = \\frac{\\mu - \\mu_0}{\\sigma / \\sqrt{n}}$

where:
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
z=(mu-mu0)/sd*sqrt(n)(Power=pnorm(z-qnorm(1-alpha/2))+pnorm(-z-qnorm(1-alpha/2)))`}
                    references={[
                        "Chow S, Shao J, Wang H. 2008. Sample Size Calculations in Clinical Research. 2nd Ed. Chapman & Hall/CRC Biostatistics Series. page 51.",
                        "Rosner B. 2010. Fundamentals of Biostatistics. 7th Ed. Brooks/Cole. page 232."
                    ]}
                />
            </div>
        </div>
    );
}
