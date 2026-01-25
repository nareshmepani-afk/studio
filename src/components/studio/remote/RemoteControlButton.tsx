import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface RemoteControlButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
}

export const RemoteControlButton = ({ children, className, ...props }: RemoteControlButtonProps) => {
    return (
        <Button 
            variant="ghost"
            size="icon"
            className={cn("bg-white/10 hover:bg-white/20 text-white rounded-full w-12 h-12", className)}
            {...props}
        >
            {children}
        </Button>
    )
}