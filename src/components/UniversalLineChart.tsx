import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface LineConfig {
  dataKey: string;
  strokeColor: string;
  isDashed?: boolean;
}

interface Props {
  data: any[];
  xAxisKey: string;
  lines: LineConfig[];
  height?: number | string;
}

export const UniversalLineChart = ({ data, xAxisKey, lines, height = "100%" }: Props) => {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid stroke="#3f3f46" strokeDasharray="3 3" vertical={false} />
          <XAxis 
            dataKey={xAxisKey} 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#a1a1aa', fontSize: 10 }} 
            dy={10} 
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#a1a1aa', fontSize: 10 }} 
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'rgba(28, 28, 28, 0.8)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '12px',
              padding: '12px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
            }}
            itemStyle={{ color: '#fff', fontWeight: 'bold' }}
            cursor={{ stroke: '#52525b', strokeWidth: 1, strokeDasharray: '4 4' }}
          />
          {lines.map((line, idx) => (
            <Line
              key={idx}
              type="monotone"
              dataKey={line.dataKey}
              stroke={line.strokeColor}
              strokeWidth={3}
              strokeDasharray={line.isDashed ? "5 5" : undefined}
              dot={{ r: 4, fill: line.strokeColor, strokeWidth: 0 }}
              activeDot={{ r: 6, fill: '#fff', strokeWidth: 2, stroke: line.strokeColor }}
              animationDuration={800}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
