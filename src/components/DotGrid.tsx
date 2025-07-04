import { useEffect, useRef } from 'react';

interface DotGridProps {
  isDarkMode: boolean;
}

interface Dot {
  anchor: { x: number; y: number };
  position: { x: number; y: number };
  smooth: { x: number; y: number };
  velocity: { x: number; y: number };
  move: { x: number;
  y: number };
  el: SVGCircleElement;
}

interface Mouse {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  speed: number;
}

interface SVGData {
  el: SVGSVGElement | null;
  width: number;
  height: number;
  x: number;
  y: number;
  // pixelRatio: number; // Não mais necessário para a lógica interna de tamanho, o navegador cuida
}

export function DotGrid({ isDarkMode }: DotGridProps) {
  const containerRef = useRef<HTMLDivElement>(null); // Correção de tipo para HTMLDivElement
  const svgRef = useRef<SVGSVGElement>(null);
  const dotsRef = useRef<Dot[]>([]);
  const mouseRef = useRef<Mouse>({
    x: 0,
    y: 0,
    prevX: 0,
    prevY: 0,
    speed: 0
  });
  const svgDataRef = useRef<SVGData>({
    el: null,
    width: 1,
    height: 1,
    x: 0,
    y: 0,
    // pixelRatio: 1 // Não mais necessário
  });
  const animationFrameRef = useRef<number>();
  const speedCheckRef = useRef<NodeJS.Timeout>();
  const isInitializedRef = useRef(false);

  // Circle properties - Radius is fixed, Margin is base for dynamic spacing
  const circle = {
    radius: 2,      // FIXED: Always 2px visual radius (in CSS pixels)
    margin: 30      // BASE: Base spacing in CSS pixels
  };

  // Resize handler
  const resizeHandler = () => {
    if (!containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    // const dpr = window.devicePixelRatio || 1; // DPR não mais usado para dimensionamento interno

    svgDataRef.current = {
      el: svgRef.current,
      width: containerRect.width,
      height: containerRect.height,
      x: containerRect.left,
      y: containerRect.top,
      // pixelRatio: dpr // Não mais armazenado para uso interno de tamanho
    };

    if (svgRef.current) {
      // Definir largura e altura do SVG em pixels CSS
      svgRef.current.setAttribute('width', containerRect.width.toString());
      svgRef.current.setAttribute('height', containerRect.height.toString());

      // Definir viewBox para corresponder aos pixels CSS (1 unidade = 1 pixel CSS)
      // O navegador se encarregará de escalar isso para a tela de alta DPI
      svgRef.current.setAttribute('viewBox', `0 0 ${containerRect.width} ${containerRect.height}`);
      
      // Assegurar que os estilos CSS de width/height estejam corretos
      svgRef.current.style.width = `${containerRect.width}px`;
      svgRef.current.style.height = `${containerRect.height}px`;
    }
  };

  // Create dots
  const createDots = () => {
    if (!svgRef.current || !containerRef.current) return;
    dotsRef.current = [];
    svgRef.current.innerHTML = '';

    resizeHandler(); // Get updated container dimensions

    const svg = svgDataRef.current;
    // currentDPR não é mais usado para escalonar raios/posições

    // Calculate total cell size (dot diameter + margin) in CSS pixels
    // Margin will appear larger on high-DPI screens due to pixel density
    const totalCellSize = (circle.radius * 2) + circle.margin; // Diameter + margin

    // Calculate number of columns and rows based on CSS pixels
    const cols = Math.floor(svg.width / totalCellSize);
    const rows = Math.floor(svg.height / totalCellSize);

    const offsetX = (svg.width - (cols * totalCellSize)) / 2;
    const offsetY = (svg.height - (rows * totalCellSize)) / 2;

    console.log('Creating dots grid:', { cols, rows, width: svg.width, height: svg.height, totalCellSize });

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const dot: Dot = {
          anchor: {
            // Anchor points are now in CSS pixel units
            x: offsetX + (col * totalCellSize) + (totalCellSize / 2),
            y: offsetY + (row * totalCellSize) + (totalCellSize / 2)
          },
          position: { x: 0, y: 0 },
          smooth: { x: 0, y: 0 },
          velocity: { x: 0, y: 0 },
          move: { x: 0, y: 0 },
          el: document.createElementNS('http://www.w3.org/2000/svg', 'circle')
        };
        
        dot.position = { x: dot.anchor.x, y: dot.anchor.y };
        dot.smooth = { x: dot.anchor.x, y: dot.anchor.y };

        // Set circle attributes in CSS pixel units
        dot.el.setAttribute('cx', dot.anchor.x.toString());
        dot.el.setAttribute('cy', dot.anchor.y.toString());
        dot.el.setAttribute('r', circle.radius.toString()); // Radius is fixed at 2px CSS
        
        dot.el.setAttribute('fill', isDarkMode ? '#363636' : '#EBEBEB');
        svgRef.current!.appendChild(dot.el);
        dotsRef.current.push(dot);
      }
    }

    console.log('Created', dotsRef.current.length, 'dots with fixed 2px radius and dynamic spacing');
  };

  // Mouse move handler
  const mouseHandler = (e: MouseEvent) => {
    mouseRef.current.x = e.clientX;
    mouseRef.current.y = e.clientY;
  };

  // Mouse speed calculation
  const mouseSpeed = () => {
    const mouse = mouseRef.current;
    const distX = mouse.prevX - mouse.x;
    const distY = mouse.prevY - mouse.y;
    const dist = Math.hypot(distX, distY);
    mouse.speed += (dist - mouse.speed) * 0.5;
    if (mouse.speed < 0.001) {
      mouse.speed = 0;
    }

    mouse.prevX = mouse.x;
    mouse.prevY = mouse.y;
    
    speedCheckRef.current = setTimeout(mouseSpeed, 20);
  };

  // Animation tick
  const tick = () => {
    const mouse = mouseRef.current;
    const svg = svgDataRef.current;
    // currentDPR não é mais usado aqui para escalonamento de tamanho

    dotsRef.current.forEach(dot => {
      // Mouse coordinates and dot positions are now all in CSS pixel units
      const mouseX = mouse.x - svg.x; // Mouse X relative to SVG origin
      const mouseY = mouse.y - svg.y; // Mouse Y relative to SVG origin

      const distX = mouseX - dot.position.x;
      const distY = mouseY - dot.position.y;
      const dist = Math.max(Math.hypot(distX, distY), 1);

      const angle = Math.atan2(distY, distX);
      // 'effectRadius' (100) e 'moveForceMagnitude' (500) permanecem em CSS pixels
      const effectRadius = 100; // Original effect radius in CSS pixels
      const moveForceMagnitude = (500 / dist) * (mouse.speed * 0.1);


      if (dist < effectRadius) {
        dot.velocity.x += Math.cos(angle) * -moveForceMagnitude;
        dot.velocity.y += Math.sin(angle) * -moveForceMagnitude;
      }

      dot.velocity.x *= 0.9;
      dot.velocity.y *= 0.9;

      dot.position.x = dot.anchor.x + dot.velocity.x;
      dot.position.y = dot.anchor.y + dot.velocity.y;

      dot.smooth.x += (dot.position.x - dot.smooth.x) * 0.1;
      dot.smooth.y += (dot.position.y - dot.smooth.y) * 0.1;

      // Update DOM - maintain fixed size in CSS pixels
      dot.el.setAttribute('cx', dot.smooth.x.toString());
      dot.el.setAttribute('cy', dot.smooth.y.toString());
      dot.el.setAttribute('r', circle.radius.toString()); // Radius is fixed at 2px CSS
    });
    
    animationFrameRef.current = requestAnimationFrame(tick);
  };

  // Update dot colors when theme changes
  useEffect(() => {
    dotsRef.current.forEach(dot => {
      dot.el.setAttribute('fill', isDarkMode ? '#363636' : '#EBEBEB');
    });
  }, [isDarkMode]);

  // Initialize and cleanup
  useEffect(() => {
    if (!containerRef.current || isInitializedRef.current) return;

    console.log('Initializing DotGrid with fixed radius and scaled spacing...');
    isInitializedRef.current = true;

    window.addEventListener('resize', resizeHandler);
    window.addEventListener('mousemove', mouseHandler);
    
    createDots();
    
    mouseSpeed();
    tick();

    return () => {
      window.removeEventListener('resize', resizeHandler);
      window.removeEventListener('mousemove', mouseHandler);
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      if (speedCheckRef.current) {
        clearTimeout(speedCheckRef.current);
      }
      
      isInitializedRef.current = false;
    };
  }, []);

  // Recreate dots on significant size changes
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (isInitializedRef.current) {
          createDots();
        }
      }, 250); // Debounce resize
    };

    const resizeObserver = new ResizeObserver(handleResize);

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
    };
  }, [isDarkMode]);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none z-0"
      style={{
        background: isDarkMode ? '#0E0E0E' : '#FEFEFE'
      }}
    >
      <svg
        ref={svgRef}
        className="w-full h-full block"
        style={{ 
          overflow: 'visible',
          display: 'block',
          width: '100%',
          height: '100%'
        }}
        xmlns="http://www.w3.org/2000/svg"
      />
    </div>
  );
}