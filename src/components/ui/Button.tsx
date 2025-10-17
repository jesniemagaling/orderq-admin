import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  fullWidth?: boolean;
}

export default function Button({
  children,
  fullWidth,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={`
        ${fullWidth ? "w-full" : ""}
        bg-primary-500 hover:bg-[#6e0b13]
        text-white font-semibold py-2 px-4 rounded-lg
        focus:outline-none focus:ring-2 focus:ring-[#820D17]/40
        transition-all duration-150
        ${className}
      `}
    >
      {children}
    </button>
  );
}
