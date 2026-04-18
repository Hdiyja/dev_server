import React, { useEffect, useState } from 'react';

export default function WasmTelemetry() {
  const [telemetry, setTelemetry] = useState<{alloc: number, drop: number, safety: boolean, latency: number}>({
    alloc: 0x1048a0,
    drop: 0x1048b0,
    safety: true,
    latency: 0.00
  });

  const [message, setMessage] = useState<string>('STATE PURIFIED.');
  const [warning, setWarning] = useState<boolean>(false);

  useEffect(() => {
    const handleTelemetry = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setTelemetry(customEvent.detail);
      }
    };

    const handleLog = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setMessage(customEvent.detail.message);
        setWarning(customEvent.detail.warning);
      }
    };

    document.addEventListener('quantum:telemetry', handleTelemetry);
    document.addEventListener('quantum:log', handleLog);

    return () => {
      document.removeEventListener('quantum:telemetry', handleTelemetry);
      document.removeEventListener('quantum:log', handleLog);
    };
  }, []);

  return (
    <div className="fixed bottom-0 right-0 p-4 font-mono text-[10px] md:text-xs z-50 pointer-events-none w-full md:w-auto">
      <div className={`p-3 border backdrop-blur-md transition-colors duration-500 flex flex-col gap-1
        ${warning ? 'border-brand-rust bg-[#1a0a0a]/80 text-brand-rust' : 'border-gray-800 bg-black/80 text-gray-500'}`}>
        
        {warning && (
          <div className="animate-pulse mb-1 font-bold text-red-500 uppercase tracking-widest">
            [ WARNING: QUBIT DECOHERENCE DETECTED. NOISE RATIO INCREASING. ]
          </div>
        )}
        {!warning && (
          <div className="mb-1 text-brand-wave uppercase tracking-widest">
            [ {message} ]
          </div>
        )}

        <div className="flex gap-4">
          <span>
            <span className="text-gray-600">WASM_ALLOC: </span>
            <span className="text-gray-300">0x{telemetry.alloc.toString(16)}</span>
          </span>
          <span>
            <span className="text-gray-600">WASM_DROP: </span>
            <span className="text-gray-300">0x{telemetry.drop.toString(16)}</span>
          </span>
        </div>

        <div className="flex gap-4">
          <span>
            <span className="text-gray-600">CALC_LATENCY: </span>
            <span className="text-brand-wave transition-colors duration-100">{telemetry.latency.toFixed(2)}ms</span>
          </span>
          <span>
            <span className="text-gray-600">MEM_SAFETY: </span>
            <span className={telemetry.safety ? 'text-green-500' : 'text-red-500'}>
              {telemetry.safety ? 'TRUE' : 'FALSE'}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}