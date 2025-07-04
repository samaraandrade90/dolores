import Vector from '../imports/Vector.tsx';

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <div 
      className={className}
      style={{
        '--fill-0': 'currentColor'
      } as React.CSSProperties}
    >
      <Vector />
    </div>
  );
}