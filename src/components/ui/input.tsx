import * as React from "react"

import { cn } from "@/lib/utils"

const NON_NARRATIVE_TYPES = new Set(['password', 'email', 'url', 'number', 'tel']);

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, spellCheck, autoCorrect, autoCapitalize, lang, ...props }, ref) => {
    const isNonNarrative = type ? NON_NARRATIVE_TYPES.has(type) : false;

    const defaultSpellCheck = isNonNarrative ? false : true;
    const defaultAutoCorrect = isNonNarrative ? "off" : "on";
    const defaultAutoCapitalize = isNonNarrative ? "none" : "sentences";
    const defaultLang = isNonNarrative ? undefined : "en-GB";

    return (
      <input
        type={type}
        spellCheck={spellCheck !== undefined ? spellCheck : defaultSpellCheck}
        autoCorrect={autoCorrect !== undefined ? autoCorrect : defaultAutoCorrect}
        autoCapitalize={autoCapitalize !== undefined ? autoCapitalize : defaultAutoCapitalize}
        lang={lang !== undefined ? lang : defaultLang}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-input_field_bg px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
