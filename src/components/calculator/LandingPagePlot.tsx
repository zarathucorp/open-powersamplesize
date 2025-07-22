"use client";

import { useState, useEffect } from "react";
import { jStat } from "jstat";
import { PlotSection } from "@/components/calculator/PlotSection";
import { Card, CardContent } from "@/components/ui/card";

export function LandingPagePlot() {
    const [params] = useState({
        alpha: 0.05,
        power: "0.8000",
        mean: 2,
        nullHypothesisMean: 1.5,
        stdDev: 1,
    });
    const [plotData, setPlotData] = useState<any[]>([]);
    const [xAxisVar] = useState<string>("mean");
    const [xAxisMin, setXAxisMin] = useState<number>(0);
    const [xAxisMax, setXAxisMax] = useState<number>(0);
    const [yAxisVars, setYAxisVars] = useState<string[]>([]);
    const [lineColors, setLineColors] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        setXAxisMin(1.8);
        setXAxisMax(2.2);
    }, [params.mean]);

    useEffect(() => {
        const updatePlotData = () => {
            const { alpha, power, mean, nullHypothesisMean, stdDev } = params;
            const mu = mean;
            const mu0 = nullHypothesisMean;
            const sd = stdDev;
            const data = [];
            const effectSize = mu - mu0;

            if (effectSize === 0) {
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
                
                powerScenarios.forEach(scenario => {
                    if (x !== mu0) {
                        const requiredN = Math.ceil(Math.pow((sd * (jStat.normal.inv(1 - alpha / 2, 0, 1) + jStat.normal.inv(scenario.value, 0, 1))) / (x - mu0), 2));
                        point[scenario.name] = requiredN > 0 ? requiredN : null;
                    } else {
                        point[scenario.name] = null;
                    }
                });
                data.push(point);
            }
            setPlotData(data);
        };

        if (xAxisMin !== 0 && xAxisMax !== 0) {
            updatePlotData();
        }
    }, [params, xAxisMin, xAxisMax, xAxisVar]);

    const xAxisOptions = [
        { value: 'mean', label: 'Mean (μ)' },
        { value: 'nullHypothesisMean', label: 'Null Hypothesis Mean (μ₀)' },
        { value: 'stdDev', label: 'Standard Deviation (σ)' },
    ];

    return (
        <Card className="w-full max-w-4xl">
            <CardContent className="pt-2">
                <PlotSection 
                    plotData={plotData}
                    xAxisVar={xAxisVar}
                    onXAxisVarChange={() => {}}
                    xAxisMin={xAxisMin}
                    onXAxisMinChange={() => {}}
                    xAxisMax={xAxisMax}
                    onXAxisMaxChange={() => {}}
                    yAxisLabel="Sample Size"
                    yAxisVars={yAxisVars}
                    lineColors={lineColors}
                    xAxisOptions={xAxisOptions}
                    showControls={false}
                />
            </CardContent>
        </Card>
    );
}
