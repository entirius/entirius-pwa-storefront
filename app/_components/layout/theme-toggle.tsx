"use client";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const themeToggleVariants = cva("", {
  variants: {
    variant: {
      ghost: "ghost",
      outline: "outline",
      default: "default",
    },
    size: {
      icon: "icon",
      "icon-sm": "icon-sm",
      "icon-lg": "icon-lg",
    },
  },
  defaultVariants: {
    variant: "ghost",
    size: "icon",
  },
});

type ThemeToggleProps = VariantProps<typeof themeToggleVariants> & {
  className?: string;
};

export function ThemeToggle({ variant = "ghost", size = "icon", className }: ThemeToggleProps) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = stored ? stored === "dark" : prefersDark;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  return (
    <Button
      onClick={toggle}
      variant={variant}
      size={size}
      aria-label="Toggle theme"
      className={cn(className, "text-foreground")}
    >
      {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </Button>
  );
}
