import React from "react";

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit" | "reset";
}

export default function Button({
  children,
  onClick,
  disabled = false,
  className = "",
  type = "button",
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-5 py-3 rounded-xl font-medium transition
      bg-green-700 text-white hover:bg-green-800
      disabled:opacity-50 disabled:cursor-not-allowed
      ${className}`}
    >
      {children}
    </button>
  );
}