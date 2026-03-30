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
      className={cn("fill-emerald-500 transition-colors duration-300", className)}
      style={{
        shapeRendering: 'geometricPrecision',
        textRendering: 'geometricPrecision',
        imageRendering: 'optimizeQuality',
        fillRule: 'evenodd',
        clipRule: 'evenodd'
      }}
    >
      <g id="Layer_x0020_1">
        <path 
          d="M2188.17 24.96c1202.94,0 2178.12,975.18 2178.12,2178.13 0,1202.94 -975.18,2178.12 -2178.12,2178.12 -1202.95,0 -2178.13,-975.18 -2178.13,-2178.12 0,-1202.95 975.18,-2178.13 2178.13,-2178.13zm338.42 2107.22l-118.64 -200.69 128.34 67.24 -107.11 -267.79 216.87 352.73 -133.32 -55.29 124.38 304.5 -110.52 -200.7zm-1667.53 -506.33l-250.4 -68.99 154.88 -45.45 -293.08 -131.68 446.78 114.79 -149.62 58.89 335.34 147.73 -243.9 -75.29zm1617.85 -658.03l96.96 -408.76 82.48 247.71 195.81 -481.41 -159.58 728.88 -103.88 -238.44 -219.31 550.66 107.52 -398.64zm176.67 2696.48c155.04,50.51 239.78,217.16 189.27,372.2 -50.52,155.04 -217.16,239.78 -372.2,189.26 -155.04,-50.51 -239.78,-217.15 -189.27,-372.19 50.52,-155.04 217.16,-239.78 372.2,-189.27zm-1129.29 -2836.21c0,0 765.21,-360.77 834.39,-650.52 69.19,-289.73 -339.85,2882.88 -29.59,3359.42 310.26,476.55 -2111.16,-2047.31 -804.8,-2708.9zm305.42 937.33c-75.98,-2.44 -49.01,50.15 -75.59,17.37 -26.6,-32.81 -19.11,-47.91 10.8,-145.91 29.92,-98.01 59.55,30.18 67.95,51.36 12.81,32.32 87.35,80.09 -3.16,77.18zm-239.17 256.59c0,0 435.83,115.91 386.04,-82.88 -49.77,-198.82 227.21,315.2 -142.35,200.14 -369.53,-115.04 -243.69,-117.26 -243.69,-117.26zm291.08 -744.4c121.3,-70.17 173.43,-19.22 213.05,-74.75 39.61,-55.5 -40.95,219.46 -174.26,175.78 -133.32,-43.67 -215.8,58.06 -133.18,-33.32 82.65,-91.38 117.28,-61.82 94.39,-67.71zm-496.39 131.53c121.6,-70.35 173.86,-19.27 213.58,-74.93 39.71,-55.66 -41.05,219.99 -174.7,176.2 -133.65,-43.79 -216.34,58.2 -133.49,-33.41 82.83,-91.6 117.56,-61.97 94.61,-67.86z"
        />
        <text 
          x="-4055.61" 
          y="-1245.1" 
          stroke="currentColor"
          strokeWidth="7.62"
          strokeMiterlimit="22.9256"
          style={{ fontSize: '631.63px', fontWeight: 800, fontFamily: 'Akira Expanded, system-ui, sans-serif' }}
        >
          DUMM ES
        </text>
        <text 
          x="-4080.01" 
          y="-1700.21" 
          stroke="currentColor"
          strokeWidth="7.62"
          strokeMiterlimit="22.9256"
          style={{ fontSize: '560.59px', fontWeight: 300, fontFamily: 'Campton Light, system-ui, sans-serif' }}
        >
          TECH
        </text>
        <text 
          x="-2509.24" 
          y="-1700.21" 
          stroke="currentColor"
          strokeWidth="7.62"
          strokeMiterlimit="22.9256"
          style={{ fontSize: '560.59px', fontWeight: 800, fontFamily: 'Akira Expanded, system-ui, sans-serif' }}
        >
          4
        </text>
      </g>
    </svg>
  );
}
