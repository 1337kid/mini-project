import React from 'react';

export default function GradientText({
  children,
  className = "",
  colors = ["#5227FF", "#FF9FFC", "#B19EEF", "#5227FF"],
  animationSpeed = 8,
  showBorder = false,
}: {
  children: React.ReactNode;
  className?: string;
  colors?: string[];
  animationSpeed?: number;
  showBorder?: boolean;
}) {
  const gradientStyle = {
    backgroundImage: `linear-gradient(to right, ${colors.join(", ")})`,
    animationDuration: `${animationSpeed}s`,
  };

  return (
    <div className={`relative mx-auto flex max-w-fit flex-row items-center justify-center font-bold transition-shadow duration-500 overflow-hidden ${className}`}>
      {showBorder && (
        <div 
          className="absolute inset-0 bg-cover z-0 pointer-events-none animate-gradient" 
          style={{ ...gradientStyle }}
        >
          <div className="absolute inset-[2px] bg-black rounded-[1.25rem] z-[-1]" />
        </div>
      )}
      <div 
        className="inline-block relative z-2 text-transparent bg-cover animate-gradient bg-clip-text" 
        style={{ ...gradientStyle }}
      >
        {children}
      </div>
    </div>
  );
}