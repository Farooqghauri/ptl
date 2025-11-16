"use client";

import React from "react";
import clsx from "clsx";
import { Loader2 } from "lucide-react"; // ⬅️ Elegant Lucide spinner

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive" | "solid";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  children: React.ReactNode;
}

const variants = {
  primary: "bg-blue-600 text-white hover:bg-blue-700",
  secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300",
  outline: "border border-gray-300 text-gray-800 hover:bg-gray-50",
  ghost: "text-gray-700 hover:bg-gray-100",
  destructive: "bg-red-600 text-white hover:bg-red-700",
  solid: "bg-black text-white hover:bg-gray-900",
};

const sizes = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-6 py-3 text-lg",
};

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  isLoading = false,
  children,
  className,
  disabled,
  ...props
}) => {
  return (
    <button
      {...props}
      disabled={isLoading || disabled}
      className={clsx(
        "inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2",
        variants[variant],
        sizes[size],
        {
          "opacity-70 cursor-not-allowed": isLoading || disabled,
        },
        className
      )}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : null}
      {children}
    </button>
  );
};

export default Button;
