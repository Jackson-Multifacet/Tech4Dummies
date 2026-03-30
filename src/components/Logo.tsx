import React from 'react';
import { cn } from '../lib/utils';

interface LogoProps {
  className?: string;
  size?: number;
}

export default function Logo({ className, size = 40 }: LogoProps) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 4334.92 4334.92"
      className={cn("fill-primary-500 transition-colors duration-300", className)}
    >
      <g id="Layer_x0020_1">
        {/* Main Text: DUMM ES */}
        <text 
          x="8.13" 
          y="2440.23" 
          style={{ 
            fontSize: '631.63px', 
            fontWeight: 800, 
            fontFamily: 'Inter, system-ui, sans-serif' 
          }}
        >
          DUMM  ES
        </text>
        
        {/* Decorative Path */}
        <path d="M2803.67 1189.06c0,0 414.52,-195.43 452,-352.39 37.48,-156.95 -184.1,1561.68 -16.03,1819.83 168.07,258.15 -1143.64,-1109.05 -435.97,-1467.44zm165.45 507.76c-41.16,-1.32 -26.55,27.17 -40.95,9.41 -14.41,-17.77 -10.35,-25.95 5.85,-79.04 16.21,-53.09 32.26,16.35 36.81,27.82 6.94,17.51 47.32,43.39 -1.71,41.81zm-129.56 139c0,0 236.09,62.79 209.12,-44.9 -26.96,-107.7 123.08,170.75 -77.11,108.42 -200.18,-62.32 -132.01,-63.52 -132.01,-63.52zm157.68 -403.25c65.71,-38.01 93.95,-10.41 115.41,-40.49 21.46,-30.07 -22.18,118.88 -94.4,95.22 -72.22,-23.66 -116.9,31.45 -72.14,-18.05 44.77,-49.5 63.53,-33.49 51.13,-36.68zm-268.9 71.25c65.87,-38.11 94.18,-10.44 115.7,-40.59 21.51,-30.15 -22.24,119.17 -94.64,95.45 -72.4,-23.72 -117.19,31.53 -72.31,-18.1 44.87,-49.62 63.68,-33.57 51.25,-36.76z"/>
        
        {/* Accent Circle */}
        <circle 
          transform="matrix(0.531435 0.173146 -1.73146E-001 0.531435 3365.87 2877.54)" 
          r="286.16"
        />
        
        {/* TECH Text */}
        <text 
          x="-16.27" 
          y="1985.12" 
          style={{ 
            fontSize: '560.59px', 
            fontWeight: 300, 
            fontFamily: 'Inter, system-ui, sans-serif' 
          }}
        >
          TECH
        </text>
        
        {/* 4 Text */}
        <text 
          x="1554.5" 
          y="1985.12" 
          style={{ 
            fontSize: '560.59px', 
            fontWeight: 800, 
            fontFamily: 'Inter, system-ui, sans-serif' 
          }}
        >
          4
        </text>
      </g>
    </svg>
  );
}
