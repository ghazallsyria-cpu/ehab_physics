import React from 'react';

// Placeholder component for SimulationRenderer
const SimulationRenderer: React.FC<{ simulation: any; onComplete: (points: number) => void }> = ({ simulation, onComplete }) => {
  return (
    <div className="p-8 bg-green-500/10 border border-green-500/20 rounded-2xl text-center">
      <h3 className="text-lg font-bold text-green-300">Simulation: {simulation.title}</h3>
      <p className="text-sm text-gray-400 mt-2">Simulation component placeholder. Logic to be implemented.</p>
      <button onClick={() => onComplete(30)} className="mt-4 bg-green-500 text-white px-4 py-2 rounded">Complete Simulation (Debug)</button>
    </div>
  );
};

export default SimulationRenderer;
