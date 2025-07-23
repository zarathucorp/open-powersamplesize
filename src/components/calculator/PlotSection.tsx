"use client";

import { useState, useEffect, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush,
} from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const formatNumber = (value: number | string) => {
  if (typeof value === 'number') {
    return value.toFixed(2);
  }
  return value;
};

const formatInteger = (value: number | string) => {
  if (typeof value === 'number') {
    return value.toFixed(0);
  }
  return value;
};

const formatPower = (value: number | string) => {
  if (typeof value === 'number') {
    return value.toFixed(4);
  }
  return value;
}

interface PlotPoint {
  [key: string]: number | null;
}

type PlotSectionProps = {
  plotData: PlotPoint[];
  xAxisVar: string;
  onXAxisVarChange: (value: string) => void;
  xAxisMin: number;
  onXAxisMinChange: (value: number) => void;
  xAxisMax: number;
  onXAxisMaxChange: (value: number) => void;
  yAxisLabel?: string;
  yAxisVars: string[];
  lineColors: { [key: string]: string };
  xAxisOptions: { value: string; label: string }[];
  isInteractive?: boolean;
  showControls?: boolean;
};

export function PlotSection({
  plotData,
  xAxisVar,
  onXAxisVarChange,
  xAxisMin,
  onXAxisMinChange,
  xAxisMax,
  onXAxisMaxChange,
  yAxisLabel,
  yAxisVars,
  lineColors,
  xAxisOptions,
  isInteractive = true,
  showControls = true,
}: PlotSectionProps) {

  const yAxisFormatter = yAxisLabel?.toLowerCase().includes('power') ? formatPower : formatInteger;

  const renderLegend = () => {
    return (
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', justifyContent: 'center' }}>
        {
          yAxisVars.map((yVar, index) => (
            <li key={`item-${index}`} style={{ marginRight: 10, color: lineColors[yVar], display: 'flex', alignItems: 'center' }}>
              <svg width="14" height="14" style={{ marginRight: 5 }}>
                <rect width="14" height="14" fill={lineColors[yVar]} />
              </svg>
              {yVar}
            </li>
          ))
        }
      </ul>
    );
  };

  const [localMin, setLocalMin] = useState(Number(xAxisMin.toFixed(4)));
  const [localMax, setLocalMax] = useState(Number(xAxisMax.toFixed(4)));
  const [zoomedDomain, setZoomedDomain] = useState({ min: xAxisMin, max: xAxisMax });

  useEffect(() => {
    setLocalMin(Number(xAxisMin.toFixed(4)));
    setLocalMax(Number(xAxisMax.toFixed(4)));
    setZoomedDomain({ min: xAxisMin, max: xAxisMax });
  }, [xAxisMin, xAxisMax, plotData]);

  const filteredData = useMemo(() => {
    if (!plotData || plotData.length === 0) return [];
    return plotData.filter(d => {
      const xValue = d[xAxisVar];
      return typeof xValue === 'number' && xValue >= xAxisMin && xValue <= xAxisMax;
    });
  }, [plotData, xAxisVar, xAxisMin, xAxisMax]);

  return (
    <div>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={filteredData}
          margin={{
            top: 0,
            right: 0,
            left: 0,
            bottom: 0,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey={xAxisVar}
            type="number"
            domain={[zoomedDomain.min, zoomedDomain.max]}
            tickFormatter={formatNumber}
            // label={{ value: xAxisOptions.find(opt => opt.value === xAxisVar)?.label, position: 'insideBottom', offset: -10 }}
            allowDataOverflow
          />
          <YAxis
            label={{ value: yAxisLabel, angle: -90, position: 'right', offset: 10 }}
            tickFormatter={yAxisFormatter}
          />
          <Tooltip formatter={yAxisFormatter} labelFormatter={formatNumber as (value: number | string) => string} />
          <Legend content={renderLegend} verticalAlign="top" wrapperStyle={{ paddingBottom: '20px' }} />
          {yAxisVars.map((yVar, index) => (
            <Line
              key={index}
              type="monotone"
              dataKey={yVar}
              stroke={lineColors[yVar]}
              dot={false}
              strokeWidth={2}
            />
          ))}
          {isInteractive && filteredData.length > 0 && (
            <Brush
              dataKey={xAxisVar}
              height={30}
              stroke="#8884d8"
              tickFormatter={formatNumber}
              onChange={(e) => {
                if (e.startIndex !== undefined && e.endIndex !== undefined) {
                  const startValue = filteredData[e.startIndex]?.[xAxisVar];
                  const endValue = filteredData[e.endIndex]?.[xAxisVar];
                  if (typeof startValue === 'number' && typeof endValue === 'number') {
                    setZoomedDomain({ min: startValue, max: endValue });
                  }
                }
              }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
      {showControls && (
        <div className="flex items-center justify-center space-x-4 mt-4">
          <div>
            <Label htmlFor="x-axis-var">X-Axis Variable</Label>
            <Select value={xAxisVar} onValueChange={onXAxisVarChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select X-axis variable" />
              </SelectTrigger>
              <SelectContent>
                {xAxisOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Label>Min</Label>
            <Input
              type="number"
              value={localMin}
              onChange={(e) => setLocalMin(Number(e.target.value))}
              onBlur={() => onXAxisMinChange(localMin)}
            />
          </div>
          <div className="flex-1">
            <Label>Max</Label>
            <Input
              type="number"
              value={localMax}
              onChange={(e) => setLocalMax(Number(e.target.value))}
              onBlur={() => onXAxisMaxChange(localMax)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
