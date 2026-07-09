import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export default function Button({
  children,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={`bg-green-700 hover:bg-green-800 text-white px-5 py-2 rounded-xl font-medium transition ${className}`}
    >
      {children}
    </button>
  );
}