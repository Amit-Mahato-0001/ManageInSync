import React from "react";

const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex">

      <div className="relative w-1/2 overflow-hidden">

        <img
          src="7.webp"
          className="absolute inset-0 h-full object-cover"
        />

        <div className="absolute inset-0 pr-2">
          <div className="h-full backdrop-blur-sm border border-white/20" />
        </div>

        <div className="relative z-10 p-10">
          <img
            src="Union.png"
            className="h-12 w-auto"
          />
        </div>

      </div>

      <div className="w-1/2 flex items-center justify-center bg-white">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>

    </div>
  );
};

export default AuthLayout;
