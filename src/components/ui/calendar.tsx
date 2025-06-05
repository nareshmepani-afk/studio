
"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, type DayPickerProps } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = DayPickerProps

function Calendar({
  className,
  classNames: classNamesProp, // Renamed to avoid conflict
  showOutsideDays = true,
  captionLayout, // Explicitly destructure
  fromYear,    // Explicitly destructure
  toYear,      // Explicitly destructure
  month,
  defaultMonth,
  numberOfMonths,
  onMonthChange,
  selected,
  components: componentsProp, // Renamed to avoid conflict
  ...props
}: CalendarProps) {
  // Base classNames for DayPicker parts not related to caption/nav when dropdowns are used
  const baseDayPickerClassNames = {
    months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
    month: "space-y-4",
    table: "w-full border-collapse space-y-1",
    head_row: "flex",
    head_cell:
      "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
    row: "flex w-full mt-2",
    cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
    day: cn(
      buttonVariants({ variant: "ghost" }),
      "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
    ),
    day_range_end: "day-range-end",
    day_selected:
      "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
    day_today: "bg-accent text-accent-foreground",
    day_outside:
      "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
    day_disabled: "text-muted-foreground opacity-50",
    day_range_middle:
      "aria-selected:bg-accent aria-selected:text-accent-foreground",
    day_hidden: "invisible",
  };

  // Determine classNames and components based on captionLayout
  let effectiveClassNames;
  let effectiveComponents;

  if (captionLayout === 'dropdowns') {
    effectiveClassNames = {
      ...baseDayPickerClassNames,
      // For dropdowns, we let react-day-picker handle caption styling mostly.
      // We might need to ensure rdp-caption_dropdowns container has enough space if not default.
      // User can still pass their own `classNames` via props to override if needed.
      ...classNamesProp,
    };
    effectiveComponents = {
      // For dropdowns, don't provide custom nav icons, let RDP handle it.
      ...componentsProp, // User can still pass custom components if they know what they're doing.
    };
  } else {
    // Default Shadcn behavior (with custom arrows and caption styling)
    effectiveClassNames = {
      ...baseDayPickerClassNames,
      caption: "flex justify-center pt-1 relative items-center",
      caption_label: "text-sm font-medium",
      nav: "space-x-1 flex items-center",
      nav_button: cn(
        buttonVariants({ variant: "outline" }),
        "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
      ),
      nav_button_previous: "absolute left-1",
      nav_button_next: "absolute right-1",
      ...classNamesProp,
    };
    effectiveComponents = {
      IconLeft: ({ ...iconProps }) => <ChevronLeft className="h-4 w-4" {...iconProps} />,
      IconRight: ({ ...iconProps }) => <ChevronRight className="h-4 w-4" {...iconProps} />,
      ...componentsProp,
    };
  }

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={effectiveClassNames}
      components={effectiveComponents}
      captionLayout={captionLayout}
      fromYear={fromYear}
      toYear={toYear}
      month={month}
      defaultMonth={defaultMonth}
      numberOfMonths={numberOfMonths}
      onMonthChange={onMonthChange}
      selected={selected}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
