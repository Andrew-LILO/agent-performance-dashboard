// src/components/PerformanceTable.jsx
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

function PerformanceTable({ data, onRowClick }) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Agent Call Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8">
            <p className="text-muted-foreground">No data available for the selected filters</p>
            <p className="text-sm text-muted-foreground mt-2">Try selecting different dates or dispositions</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort data by total calls descending
  const sortedData = [...data].sort((a, b) => b.total_calls - a.total_calls);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Agent Call Summary</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-muted/50 z-10">Agent Name</TableHead>
                <TableHead>Agent ID</TableHead>
                <TableHead className="text-center">Total Calls</TableHead>
                <TableHead className="text-center">Selected Disposition Count</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((agent) => {
                // Calculate total disposition count for selected dispositions
                const selectedDispositionCount = Object.values(agent.dispositions || {})
                  .reduce((sum, dispo) => sum + (dispo.count || 0), 0);
                
                return (
                  <TableRow 
                    key={agent.id}
                    onClick={() => onRowClick(agent)}
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    <TableCell className="sticky left-0 bg-background hover:bg-muted/50 z-10 font-medium">
                      {agent.name || `Unknown Agent`}
                    </TableCell>
                    <TableCell>{agent.id}</TableCell>
                    <TableCell className="text-center">{agent.total_calls}</TableCell>
                    <TableCell className="text-center">{selectedDispositionCount}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export default PerformanceTable;