import React, { useEffect, useRef } from 'react';
import BlochCanvas from './BlochCanvas.tsx';

// Note: GSAP does not work natively inside Astro server, so we must inject it during React mount
export default function PersistentBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    
    // Import dynamically so it runs strictly client-side
    import('gsap').then(({ gsap }) => {
      import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
        gsap.registerPlugin(ScrollTrigger);

        const ctx = gsap.context(() => {
            // Track the scroll distance natively 
            ScrollTrigger.create({
                trigger: document.body,
                start: "top top",
                end: "bottom bottom",
                onUpdate: (self) => {
                    // Extract progress between 0 and 1
                    const progress = self.progress;

                    // Ping our Rust/Wasm exposed function window.updateQuantumState
                    // @ts-ignore
                    if (window.updateQuantumState) {
                       // @ts-ignore
                       window.updateQuantumState(progress);
                    }
                }
            });
        }, containerRef);
        
        cleanup = () => ctx.revert();
      });
    });

    const handleOpen = () => {
        import('gsap').then(({ gsap }) => {
            if (containerRef.current) {
                gsap.to(containerRef.current, { x: '-15vw', duration: 0.8, ease: "power3.inOut" });
            }
            gsap.to('#app-main', { x: '-15vw', duration: 0.8, ease: "power3.inOut" });
        });
    };

    const handleClose = () => {
        import('gsap').then(({ gsap }) => {
            if (containerRef.current) {
                gsap.to(containerRef.current, { x: '0vw', duration: 0.8, ease: "power3.inOut" });
            }
            gsap.to('#app-main', { x: '0vw', duration: 0.8, ease: "power3.inOut" });
        });
    };

    document.addEventListener('telemetry:open', handleOpen);
    document.addEventListener('telemetry:close', handleClose);

    return () => {
        if(cleanup) cleanup();
        document.removeEventListener('telemetry:open', handleOpen);
        document.removeEventListener('telemetry:close', handleClose);
    };
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0 w-full h-full -z-10 pointer-events-none opacity-40 mix-blend-screen">
      <BlochCanvas />
    </div>
  );
}
