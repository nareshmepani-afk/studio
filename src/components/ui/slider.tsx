
"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, value, defaultValue, ...props }, ref) => {
  // Determine if this is a range slider by checking if value or defaultValue is an array
  // Radix's `value` prop for a range slider is `number[]`.
  // If `value` is provided, use it; otherwise, use `defaultValue`.
  // If neither, Radix might default, but for styling thumbs, we need to know.
  // For our specific use case in MediaCaptureControl, `value` will be `[startTime, endTime]`.
  const sliderValue = value ?? defaultValue;
  const isRange = Array.isArray(sliderValue);

  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        className
      )}
      value={value} // Pass controlled value
      defaultValue={defaultValue} // Pass default value
      {...props}
    >
      <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      {isRange && Array.isArray(value) ? ( // Ensure value is an array for mapping if controlled
        value.map((_, index) => (
          <SliderPrimitive.Thumb
            key={index}
            className={cn(
              "block h-0 w-0 cursor-pointer ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
              // Custom triangle styles
              "border-l-[8px] border-r-[8px] border-t-[12px]", // Triangle shape: base 16px, height 12px
              "border-l-transparent border-r-transparent", // Transparent sides
              index === 0
                ? "border-t-green-500" // Start thumb: green downward triangle
                : "border-t-red-500"   // End thumb: red downward triangle
            )}
            // To allow dragging, Radix Slider needs draggable thumbs.
            // The default styles are removed, so ensure it's still draggable.
            // Radix handles the dragging logic if the element is a Thumb.
          />
        ))
      ) : isRange && Array.isArray(defaultValue) ? ( // Handle uncontrolled range slider
        defaultValue.map((_, index) => (
          <SliderPrimitive.Thumb
            key={index}
            className={cn(
              "block h-0 w-0 cursor-pointer ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
              "border-l-[8px] border-r-[8px] border-t-[12px]",
              "border-l-transparent border-r-transparent",
              index === 0
                ? "border-t-green-500"
                : "border-t-red-500"
            )}
          />
        ))
      ) : (
        // Fallback for single value slider (default ShadCN style)
        <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
      )}
    </SliderPrimitive.Root>
  )
})
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
