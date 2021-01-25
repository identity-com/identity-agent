import React from "react";

const sizes = {
  small: "px-3 py-2 text-sm",
  large: "px-6 py-3 text-base"
}

export const Button: React.FC<
  { size?: "small" | "large" } & React.DetailedHTMLProps<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
  >
  > = ({ size = "small", children, ...props }) => (
  <button
    type="button"
    className={`${sizes[size]} inline-flex items-center border border-transparent font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
    {...props}
  >
    {children}
  </button>
);
