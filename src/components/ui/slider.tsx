
"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, value, defaultValue, ...props }, ref) => {
  const sliderValue = value ?? defaultValue;
  const isRange = Array.isArray(sliderValue);

  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        className
      )}
      value={value} 
      defaultValue={defaultValue} 
      {...props}
    >
      <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      {isRange && Array.isArray(value) ? ( 
        value.map((_, index) => (
          <SliderPrimitive.Thumb
            key={index}
            className={cn(
              "block h-0 w-0 cursor-pointer ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
              // Custom triangle styles for upward-pointing triangles
              "border-l-[8px] border-r-[8px] border-b-[12px]", // Triangle shape: base 16px, height 12px, points up
              "border-l-transparent border-r-transparent", // Transparent sides
              index === 0
                ? "border-b-green-500" // Start thumb: green upward triangle
                : "border-b-red-500"   // End thumb: red upward triangle
            )}
          />
        ))
      ) : isRange && Array.isArray(defaultValue) ? ( 
        defaultValue.map((_, index) => (
          <SliderPrimitive.Thumb
            key={index}
            className={cn(
              "block h-0 w-0 cursor-pointer ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
              "border-l-[8px] border-r-[8px] border-b-[12px]",
              "border-l-transparent border-r-transparent",
              index === 0
                ? "border-b-green-500"
                : "border-b-red-500"
            )}
          />
        ))
      ) : (
        <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
      )}
    </SliderPrimitive.Root>
  )
})
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
