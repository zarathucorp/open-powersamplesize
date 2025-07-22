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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const formatNumber = (value: any) => {
  if (typeof value === 'number') {
    return value.toFixed(2);
  }
  return value;
};

const formatInteger = (value: any) => {
  if (typeof value === 'number') {
    return value.toFixed(0);
  }
  return value;
};

const formatPower = (value: any) => {
  if (typeof value === 'number') {
    return value.toFixed(4);
  }
  return value;
}

type PlotSectionProps = {
  plotData: any[];
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

  const [localMin, setLocalMin] = useState(xAxisMin);
  const [localMax, setLocalMax] = useState(xAxisMax);
  const [zoomedDomain, setZoomedDomain] = useState({ min: xAxisMin, max: xAxisMax });

  useEffect(() => {
    setLocalMin(xAxisMin);
    setLocalMax(xAxisMax);
    setZoomedDomain({ min: xAxisMin, max: xAxisMax });
  }, [xAxisMin, xAxisMax, plotData]);

  const filteredData = useMemo(() => {
    if (!plotData || plotData.length === 0) return [];
    return plotData.filter(d => d[xAxisVar] >= xAxisMin && d[xAxisVar] <= xAxisMax);
  }, [plotData, xAxisVar, xAxisMin, xAxisMax]);

  const handleBrushChange = (range: { startIndex?: number; endIndex?: number }) => {
    if (filteredData.length > 0 && range.startIndex !== undefined && range.endIndex !== undefined) {
      const newMin = filteredData[range.startIndex][xAxisVar];
      const newMax = filteredData[range.endIndex][xAxisVar];
      setZoomedDomain({ min: newMin, max: newMax });
    }
  };

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
            label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }}
            tickFormatter={yAxisFormatter}
          />
          <Tooltip formatter={yAxisFormatter} labelFormatter={formatNumber} />
          <Legend content={renderLegend} verticalAlign="top" wrapperStyle={{ paddingBottom: '20px' }} />
          {yAxisVars.map((yVar, index) => (
            <Line
              key={index}
              type="monotone"
              dataKey={yVar}
              stroke={lineColors[yVar]}
              dot={false}
              strokeWidth={2}
              connectNulls
            />
          ))}
          {isInteractive && plotData.length > 0 && (
            <Brush
              dataKey={xAxisVar}
              height={30}
              stroke="#8884d8"
              startIndex={0}
              endIndex={plotData.length - 1}
              tickFormatter={formatNumber}
              onChange={(e: any) => {
                if (e.startIndex !== null && e.endIndex !== null && plotData[e.startIndex] && plotData[e.endIndex]) {
                  setZoomedDomain({ min: plotData[e.startIndex][xAxisVar], max: plotData[e.endIndex][xAxisVar] });
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
