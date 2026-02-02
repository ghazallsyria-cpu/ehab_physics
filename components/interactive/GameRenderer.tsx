import React from 'react';

// Placeholder component for GameRenderer
const GameRenderer: React.FC<{ game: any; onComplete: (points: number) => void }> = ({ game, onComplete }) => {
  return (
    <div className="p-8 bg-purple-500/10 border border-purple-500/20 rounded-2xl text-center">
      <h3 className="text-lg font-bold text-purple-300">Game: {game.title}</h3>
      <p className="text-sm text-gray-400 mt-2">Game component placeholder. Logic to be implemented.</p>
      <button onClick={() => onComplete(50)} className="mt-4 bg-purple-500 text-white px-4 py-2 rounded">Complete Game (Debug)</button>
    </div>
  );
};

export default GameRenderer;
