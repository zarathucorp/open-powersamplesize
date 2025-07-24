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
    // 여기에 다른 파라미터를 추가하세요.
    p: number;
    p0: number;
};

type PlotDataPoint = {
    [key: string]: number | null;
};

type ValidationErrors = {
    power?: string;
    // 여기에 다른 유효성 검사 오류 필드를 추가하세요.
    p?: string;
    p0?: string;
};

// TODO: 계산기 페이지에 맞게 컴포넌트 이름을 변경하세요.
export default function Test1Proportion2SidedEquality() {
    const [solveFor, setSolveFor] = useState<string>("sampleSize");
    // TODO: 초기 파라미터 값을 설정하세요.
    const [params, setParams] = useState<CalcParams>({
        power: "0.8000",
        sampleSize: 50,
        alpha: 0.05,
        // 여기에 다른 파라미터의 초기값을 설정하세요.
        p: 0.5,
        p0: 0.3,
    });
    const [plotData, setPlotData] = useState<PlotDataPoint[]>([]);
    const [xAxisVar, setXAxisVar] = useState<string>("p"); // TODO: 기본 x축 변수를 설정하세요.
    const [xAxisMin, setXAxisMin] = useState<number>(0); // Default
    const [xAxisMax, setXAxisMax] = useState<number>(0); // Default
    const [yAxisVars, setYAxisVars] = useState<string[]>([]);
    const [lineColors, setLineColors] = useState<{ [key: string]: string }>({});
    const [errors, setErrors] = useState<ValidationErrors>({});

    useEffect(() => {
        const { p, p0 } = params;
        if (xAxisVar === 'p') {
            setXAxisMin(Math.max(0.01, p * 0.5));
            setXAxisMax(Math.min(0.99, p * 1.5));
        } else if (xAxisVar === 'p0') {
            setXAxisMin(Math.max(0.01, p0 * 0.5));
            setXAxisMax(Math.min(0.99, p0 * 1.5));
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
        // TODO: 여기에 다른 유효성 검사 로직을 추가하세요.
        if (params.p <= 0 || params.p >= 1) {
            newErrors.p = "Proportion (p) must be between 0 and 1.";
        }
        if (params.p0 <= 0 || params.p0 >= 1) {
            newErrors.p0 = "Comparison Proportion (p0) must be between 0 and 1.";
        }
        if (params.p === params.p0) {
            const err = "Proportion (p) and Comparison Proportion (p0) cannot be equal.";
            newErrors.p = err;
            newErrors.p0 = err;
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const updatePlotData = useCallback(() => {
        // TODO: 플롯 데이터를 생성하도록 이 함수를 업데이트하세요.
        const { alpha, power, p, p0 } = params;
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

        const z_alpha_half = jStat.normal.inv(1 - alpha / 2, 0, 1);

        for (let i = 0; i < 100; i++) {
            const x = xAxisMin + (xAxisMax - xAxisMin) * (i / 99);
            const point: PlotDataPoint = { [xAxisVar]: x };
            
            powerScenarios.forEach(scenario => {
                let sampleSize: number | null = null;
                
                // TODO: x축 변수와 power 시나리오에 따라 표본 크기 계산을 구현하세요.
                let currentP = p;
                let currentP0 = p0;

                if (xAxisVar === 'p') {
                    currentP = x;
                } else if (xAxisVar === 'p0') {
                    currentP0 = x;
                }
                
                if (currentP > 0 && currentP < 1 && currentP0 > 0 && currentP0 < 1 && currentP !== currentP0) {
                    const z_beta = jStat.normal.inv(scenario.value, 0, 1);
                    const numerator = z_alpha_half + z_beta;
                    const denominator = currentP - currentP0;
                    const calculatedN = currentP * (1 - currentP) * Math.pow(numerator / denominator, 2);
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

        const { alpha, power, sampleSize, p, p0 } = params;
        
        if (solveFor === 'power') {
            // TODO: Power 계산을 구현하세요.
            if (sampleSize && sampleSize > 0) {
                const z = (p - p0) / Math.sqrt(p * (1 - p) / sampleSize);
                const z_alpha_half = jStat.normal.inv(1 - alpha / 2, 0, 1);
                const calculatedPower = jStat.normal.cdf(z - z_alpha_half, 0, 1) + jStat.normal.cdf(-z - z_alpha_half, 0, 1);
                const formattedPower = calculatedPower.toFixed(4);
                setParams(p => ({ ...p, power: formattedPower }));
            } else {
                setParams(p => ({...p, power: null}));
            }
        } else { // solveFor === 'sampleSize'
            const powerValue = power ? parseFloat(power) : null;
            // TODO: 표본 크기 계산을 구현하세요.
            if (powerValue && powerValue > 0 && powerValue < 1) {
                const z_alpha_half = jStat.normal.inv(1 - alpha / 2, 0, 1);
                const z_beta = jStat.normal.inv(powerValue, 0, 1);
                const numerator = z_alpha_half + z_beta;
                const denominator = p - p0;
                const calculatedSize = p * (1 - p) * Math.pow(numerator / denominator, 2);
                setParams(p => ({ ...p, sampleSize: Math.ceil(calculatedSize) }));
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
        setParams((prevParams: CalcParams) => ({ ...prevParams, ...newParams }));
    };

    // TODO: 계산기의 입력 필드를 정의하세요.
    const inputFields = [
        { name: 'power', label: 'Power (1-β)', type: 'text' as const, solve: 'power' as const },
        { name: 'sampleSize', label: 'Sample Size (n)', type: 'number' as const, solve: 'sampleSize' as const },
        { name: 'alpha', label: 'Type I error rate (α)', type: 'number' as const },
        { name: 'p', label: 'True Proportion (p)', type: 'number' as const },
        { name: 'p0', label: 'Null Hypothesis Proportion (p_0)', type: 'number' as const },
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
          title="Calculate Sample Size Needed to Test 1 Proportion: 1-Sample, 2-Sided Equality"
          summary={`This calculator is useful for tests concerning whether a proportion, $p$, is equal to a reference value, $p_0$. The Null and Alternative hypotheses are

$H_0:p=p_0$
$H_1:p\\neq p_0$`}
          formulas={`This calculator uses the following formulas to compute sample size and power, respectively:
$n=p(1-p)\\left(\\frac{z_{1-\\alpha/2}+z_{1-\\beta}}{p-p_0}\\right)^2$
$1-\\beta= \\Phi\\left(z-z_{1-\\alpha/2}\\right)+\\Phi\\left(-z-z_{1-\\alpha/2}\\right) \\quad ,\\quad z=\\frac{p-p_0}{\\sqrt{\\frac{p(1-p)}{n}}}$
where

$n$ is sample size
$p_0$ is the comparison value
$\\Phi$ is the standard Normal distribution function
$\\Phi^{-1}$ is the standard Normal quantile function
$\\alpha$ is Type I error
$\\beta$ is Type II error, meaning $1-\\beta$ is power`}
          rCode={`p=0.5
p0=0.3
alpha=0.05
beta=0.20(n=p*(1-p)*((qnorm(1-alpha/2)+qnorm(1-beta))/(p-p0))^2)
ceiling(n) # 50
z=(p-p0)/sqrt(p*(1-p)/n)(Power=pnorm(z-qnorm(1-alpha/2))+pnorm(-z-qnorm(1-alpha/2)))`}
          references={[
            "Chow S, Shao J, Wang H. 2008. Sample Size Calculations in Clinical Research. 2nd Ed. Chapman & Hall/CRC Biostatistics Series. page 85."
          ]}
        />
      </div>
    </div>
  );
}
