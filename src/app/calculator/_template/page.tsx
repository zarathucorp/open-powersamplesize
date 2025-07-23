"use client";

import { useState, useEffect, useCallback } from "react";
// import { jStat } from "jstat";
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
};

type PlotDataPoint = {
    [key: string]: number | null;
};

type ValidationErrors = {
    power?: string;
    // 여기에 다른 유효성 검사 오류 필드를 추가하세요.
};

// TODO: 계산기 페이지에 맞게 컴포넌트 이름을 변경하세요.
export default function CalculatorPageTemplate() {
    const [solveFor, setSolveFor] = useState<string>("sampleSize");
    // TODO: 초기 파라미터 값을 설정하세요.
    const [params, setParams] = useState<CalcParams>({
        power: "0.8000", // 고정
        sampleSize: 50,
        alpha: 0.05,
        // 여기에 다른 파라미터의 초기값을 설정하세요.
    });
    const [plotData, setPlotData] = useState<PlotDataPoint[]>([]);
    const [xAxisVar, setXAxisVar] = useState<string>(""); // TODO: 가장 처음 나오는 값을 기본 x축 변수로 설정하세요.
    const [xAxisMin, setXAxisMin] = useState<number>(0); // 고정
    const [xAxisMax, setXAxisMax] = useState<number>(0); // 고정
    const [yAxisVars, setYAxisVars] = useState<string[]>([]);
    const [lineColors, setLineColors] = useState<{ [key: string]: string }>({});
    const [errors, setErrors] = useState<ValidationErrors>({});

    useEffect(() => {
        // TODO: 파라미터에 따라 x축 범위를 설정하는 로직을 적당히 조정하세요.
        // const { stdDev, delta } = params; // 예시 파라미터, 이 항목이 없을 수 있음
        // if (xAxisVar === 'stdDev') {
        //     setXAxisMin(Math.max(0.1, stdDev * 0.5));
        //     setXAxisMax(stdDev * 1.5);
        // } else if (xAxisVar === 'delta') {
        //     setXAxisMin(Math.max(0.1, delta * 0.5));
        //     setXAxisMax(delta * 1.5);
        // }
    }, [xAxisVar]);

    const validate = () => {
        const newErrors: ValidationErrors = {};
        if (params.power) {
            const powerValue = parseFloat(params.power);
            if (powerValue <= 0 || powerValue >= 1) {
                newErrors.power = "Power must be between 0 and 1.";
            }
        }
        // TODO: 여기에 다른 유효성 검사 로직을 추가하세요.
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const updatePlotData = useCallback(() => {
        // TODO: 플롯 데이터를 생성하도록 이 함수를 업데이트하세요.
        // const { alpha } = params;
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

        // sort 하지 말 것

        // Calculate으로 생성된 power는 항상 #8884d8 색상을 사용합니다.
        powerScenarios.forEach((scenario, i) => {
            newColors[scenario.name] = colors[i % colors.length];
        });

        setYAxisVars(powerScenarios.map(s => s.name));
        setLineColors(newColors);

        // const z_alpha = jStat.normal.inv(1 - alpha, 0, 1);

        for (let i = 0; i < 100; i++) {
            const x = xAxisMin + (xAxisMax - xAxisMin) * (i / 99);
            const point: PlotDataPoint = { [xAxisVar]: x };
            
            powerScenarios.forEach(scenario => {
                const sampleSize: number | null = null;
                
                // TODO: x축 변수와 power 시나리오에 따라 표본 크기 계산을 구현하세요.
                // 원본 파일과 유사한 구조를 사용하여 다른 x축 변수를 처리하세요.
                // 예:
                // let currentParam = params.someParam;
                // if (xAxisVar === 'someParam') currentParam = x;
                
                // const calculatedN = ... 여기에 수식을 입력하세요 수식은 페이지마다 다릅니다 ...
                // sampleSize = Math.ceil(calculatedN);

                // const z_beta = jStat.normal.inv(scenario.value, 0, 1);
                // const numerator = ...; // 여기에 수식을 입력하세요
                // const denominator = ...; // 여기에 수식을 입력하세요
                
                point[scenario.name] = sampleSize && sampleSize > 0 ? sampleSize : null;
            });
            data.push(point);
        }
        setPlotData(data);
    }, [params, xAxisMin, xAxisMax, xAxisVar]);

    const handleCalculate = () => {
        if (!validate()) return;

        const { power } = params;
        
        if (solveFor === 'power') {
            // TODO: Power 계산을 구현하세요.
            // if (sampleSize && sampleSize > 0) {
            //     const calculatedPower = ... 여기에 수식을 입력하세요 ...
            //     const formattedPower = calculatedPower.toFixed(4);
            //     if (params.power !== formattedPower) {
            //         setParams(p => ({ ...p, power: formattedPower }));
            //     }
            // } else {
            //     setParams(p => ({...p, power: null}));
            // }
        } else { // solveFor === 'sampleSize'
            const powerValue = power ? parseFloat(power) : null;
            // TODO: 표본 크기 계산을 구현하세요.
            if (powerValue && powerValue > 0 && powerValue < 1) {
                //     const calculatedSize = ... 여기에 수식을 입력하세요 ...
                //     if (params.sampleSize !== calculatedSize) {
                //         setParams(p => ({ ...p, sampleSize: Math.ceil(calculatedSize) }));
                //     }
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
        { name: 'alpha', label: 'Alpha (α)', type: 'number' as const },
        // 여기에 다른 입력 필드를 추가하세요.
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
                    title="계산기 제목"
                    summary={`여기에 요약을 작성하세요. 수식에는 $\\alpha$와 같이 LaTeX를 사용하세요.`}
                    formulas={`여기에 수식을 작성하세요. $n = ...$와 같이 LaTeX를 사용하세요.`}
                    rCode={`여기에 R 코드를 작성하세요.`}
                    references={[
                        "여기에 참고 문헌을 작성하세요."
                    ]}
                />
            </div>
        </div>
    );
}
