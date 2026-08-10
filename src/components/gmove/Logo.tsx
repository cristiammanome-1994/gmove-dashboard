import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  inverted?: boolean;
  showTagline?: boolean;
}

const sizes = {
  sm: { wrap: "gap-2", icon: "h-7 w-7", text: "text-xl", tag: "text-[10px]" },
  md: { wrap: "gap-2.5", icon: "h-9 w-9", text: "text-2xl", tag: "text-xs" },
  lg: { wrap: "gap-3", icon: "h-12 w-12", text: "text-4xl", tag: "text-sm" },
  xl: { wrap: "gap-4", icon: "h-20 w-20", text: "text-7xl md:text-8xl", tag: "text-base md:text-lg" },
};

export const Logo = ({ className, size = "md", inverted = false, showTagline = false }: LogoProps) => {
  const s = sizes[size];
  return (
    <div className={cn("flex items-center", s.wrap, className)}>
      <div
        className={cn(
          "relative flex items-center justify-center rounded-2xl shadow-elegant",
          s.icon,
          inverted ? "bg-white text-primary" : "bg-gradient-primary text-white"
        )}
      >
        <Activity className="h-1/2 w-1/2" strokeWidth={2.5} />
        <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-status-met border-2 border-white animate-pulse" />
      </div>
      <div className="flex flex-col leading-none">
        <span
          className={cn(
            "font-black tracking-tight",
            s.text,
            inverted ? "text-white" : "text-primary-deep"
          )}
        >
          G<span className={inverted ? "text-status-met" : "text-primary-glow"}>Move</span>
        </span>
        {showTagline && (
          <span className={cn("mt-1 font-medium tracking-wide", s.tag, inverted ? "text-white/80" : "text-muted-foreground")}>
            Movimento que transforma
          </span>
        )}
      </div>
    </div>
  );
};
