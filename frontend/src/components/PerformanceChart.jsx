// src/components/PerformanceChart.jsx
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

// Color palette matching Shadcn theme
const COLORS = [
  'hsl(215, 100%, 50%)',
  'hsl(252, 100%, 50%)',
  'hsl(262, 83%, 58%)',
  'hsl(0, 0%, 9%)',
  'hsl(0, 72%, 51%)',
  'hsl(142, 76%, 36%)',
  'hsl(191, 91%, 37%)',
  'hsl(344, 79%, 48%)',
];

const getColor = (index) => COLORS[index % COLORS.length];

function PerformanceChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Total Calls by Agent</CardTitle>
        </CardHeader>
        <CardContent className="pt-4" style={{ height: "400px" }}>
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-muted-foreground">No data available for the selected filters</p>
            <p className="text-sm text-muted-foreground mt-2">Try selecting different dates or dispositions</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort data for better visualization
  const sortedData = [...data].sort((a, b) => b.value - a.value);
  const chartDisplayData = sortedData;

  // Custom tooltip to make it prettier
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border p-3 rounded-md shadow-md">
          <p className="font-medium">{payload[0].payload.name}</p>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{payload[0].value}</span> calls
          </p>
        </div>
      );
    }
    return null;
  };

  // Calculate dynamic height based on number of agents
  const minHeight = 400; // Minimum height
  const heightPerAgent = 45; // Increased height per agent for better spacing
  const calculatedHeight = Math.max(minHeight, chartDisplayData.length * heightPerAgent);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Total Calls by Agent</CardTitle>
      </CardHeader>
      <CardContent className="pt-4" style={{ height: `${calculatedHeight}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartDisplayData}
            margin={{ top: 5, right: 30, left: 200, bottom: 5 }} // Increased left margin for names
            layout="vertical"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
            <XAxis 
              type="number" 
              allowDecimals={false} 
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis
              dataKey="name"
              type="category"
              width={180} // Increased width for names
              tick={{ 
                fontSize: 12, // Slightly larger font
                fill: 'hsl(var(--foreground))',
                lineHeight: 16 // Added line height
              }}
              interval={0}
              stroke="hsl(var(--muted-foreground))"
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="value" 
              name="Total Calls"
              barSize={30} // Increased bar height
              radius={[0, 4, 4, 0]}
            >
              {chartDisplayData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(index)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export default PerformanceChart;