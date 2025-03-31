// src/components/DateRangePicker.jsx
import React from 'react';
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

function DateRangePicker({ startDate, endDate, onStartDateChange, onEndDateChange }) {
  // Two separate date states instead of a range
  const [startDateObj, setStartDateObj] = React.useState(
    startDate ? new Date(startDate) : new Date()
  );
  
  const [endDateObj, setEndDateObj] = React.useState(
    endDate ? new Date(endDate) : new Date()
  );

  // Format date for display
  const formatDisplayDate = (date) => {
    return date ? format(date, "MMM d, yyyy") : "Pick a date";
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-gray-700">Date Range</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Start Date */}
        <div>
          <label className="block text-sm font-medium mb-2">Start Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formatDisplayDate(startDateObj)}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDateObj}
                onSelect={(date) => {
                  setStartDateObj(date);
                  onStartDateChange(format(date, "yyyy-MM-dd"));
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        
        {/* End Date */}
        <div>
          <label className="block text-sm font-medium mb-2">End Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formatDisplayDate(endDateObj)}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDateObj}
                onSelect={(date) => {
                  setEndDateObj(date);
                  onEndDateChange(format(date, "yyyy-MM-dd"));
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </CardContent>
    </Card>
  );
}

export default DateRangePicker;