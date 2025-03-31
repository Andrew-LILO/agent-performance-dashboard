// src/components/FilterableList.jsx
import React from 'react';
import { Search } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

function FilterableList({
  title = "Filter Items",
  items = [],
  selectedIds = [],
  onToggleItem,
  onSelectAll,
  onSelectNone,
  searchTerm,
  onSearchChange,
  getItemId,
  getItemLabel,
  placeholder = "Search Items..."
}) {

  const filteredItems = items.filter(item =>
    String(getItemLabel(item) || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Select All / None Buttons */}
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onSelectAll}
            disabled={items.length === 0}
          >
            Select All
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onSelectNone}
            disabled={items.length === 0 || selectedIds.length === 0}
          >
            Select None
          </Button>
        </div>
        
        {/* Items List */}
        <div className="border rounded-md h-[200px]">
          <ScrollArea className="h-full">
            {items.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No {title.toLowerCase()} available.
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No {title.toLowerCase()} match search.
              </div>
            ) : (
              <div className="space-y-1 p-1">
                {filteredItems.map((item) => {
                  const id = getItemId(item);
                  const label = getItemLabel(item);
                  const isSelected = selectedIds.includes(id);
                  return (
                    <div key={id} className="flex items-center p-2 hover:bg-muted/50 rounded-sm">
                      <Checkbox
                        id={`${title}-item-${id}`}
                        checked={isSelected}
                        onCheckedChange={() => onToggleItem(id)}
                        className="mr-3"
                      />
                      <label
                        htmlFor={`${title}-item-${id}`}
                        className="text-sm cursor-pointer flex-grow truncate"
                        title={label}
                      >
                        {label}
                      </label>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}

export default FilterableList;