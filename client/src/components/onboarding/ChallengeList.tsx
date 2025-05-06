import { useState } from 'react';
import { Challenge } from './OnboardingChallenge';

interface ChallengeListProps {
  challenges: Challenge[];
  onSelect: (challengeId: string) => void;
  userProgress: {
    completedChallenges: string[];
    totalPoints: number;
    level: number;
  };
}

export function ChallengeList({ challenges, onSelect, userProgress }: ChallengeListProps) {
  const [filter, setFilter] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');
  
  const filteredChallenges = filter === 'all'
    ? challenges
    : challenges.filter(c => c.difficulty === filter);
  
  const difficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'text-green-400 bg-green-900 bg-opacity-40 border border-green-600/40';
      case 'intermediate':
        return 'text-yellow-400 bg-yellow-900 bg-opacity-40 border border-yellow-600/40';
      case 'advanced':
        return 'text-red-400 bg-red-900 bg-opacity-40 border border-red-600/40';
      default:
        return 'text-gray-400 bg-gray-900 bg-opacity-40 border border-gray-600/40';
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-blue-400 text-shadow-neon">Blockchain Learning Challenges</h2>
        
        <div className="flex items-center space-x-4">
          <div className="text-gray-400">
            <span className="font-bold text-blue-400 text-shadow-neon">{userProgress.totalPoints}</span> Points
          </div>
          <div className="text-gray-400">
            Level <span className="font-bold text-blue-400 text-shadow-neon">{userProgress.level}</span>
          </div>
        </div>
      </div>
      
      {/* Filter Tabs */}
      <div className="flex space-x-2 border-b border-blue-900 pb-3">
        <button 
          className={`px-4 py-2 rounded-md shadow-md transition-all ${
            filter === 'all' 
              ? 'bg-blue-700 text-white text-shadow-neon border border-blue-500' 
              : 'bg-gray-900 bg-opacity-90 text-gray-300 hover:bg-gray-800 border border-gray-700 hover:border-blue-500/50'
          }`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button 
          className={`px-4 py-2 rounded-md shadow-md transition-all ${
            filter === 'beginner' 
              ? 'bg-green-800 text-white text-shadow-neon border border-green-500' 
              : 'bg-gray-900 bg-opacity-90 text-gray-300 hover:bg-gray-800 border border-gray-700 hover:border-green-500/50'
          }`}
          onClick={() => setFilter('beginner')}
        >
          Beginner
        </button>
        <button 
          className={`px-4 py-2 rounded-md shadow-md transition-all ${
            filter === 'intermediate' 
              ? 'bg-yellow-800 text-white text-shadow-neon border border-yellow-500' 
              : 'bg-gray-900 bg-opacity-90 text-gray-300 hover:bg-gray-800 border border-gray-700 hover:border-yellow-500/50'
          }`}
          onClick={() => setFilter('intermediate')}
        >
          Intermediate
        </button>
        <button 
          className={`px-4 py-2 rounded-md shadow-md transition-all ${
            filter === 'advanced' 
              ? 'bg-red-800 text-white text-shadow-neon border border-red-500' 
              : 'bg-gray-900 bg-opacity-90 text-gray-300 hover:bg-gray-800 border border-gray-700 hover:border-red-500/50'
          }`}
          onClick={() => setFilter('advanced')}
        >
          Advanced
        </button>
      </div>
      
      {/* Challenge Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredChallenges.map(challenge => {
          const isCompleted = userProgress.completedChallenges.includes(challenge.id);
          
          return (
            <div 
              key={challenge.id} 
              className={`bg-black bg-opacity-90 rounded-lg border ${isCompleted ? 'border-blue-500' : 'border-gray-700'} overflow-hidden hover:border-blue-500 transition-colors cursor-pointer shadow-md ${isCompleted ? 'shadow-blue-900/40' : 'shadow-gray-900/20'}`}
              onClick={() => onSelect(challenge.id)}
            >
              <div className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-white">{challenge.title}</h3>
                  <div className={`px-2 py-1 rounded text-xs ${difficultyColor(challenge.difficulty)}`}>
                    {challenge.difficulty.charAt(0).toUpperCase() + challenge.difficulty.slice(1)}
                  </div>
                </div>
                
                <p className="text-gray-400 text-sm mb-4 h-12 overflow-hidden">{challenge.description}</p>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <span className="text-blue-400 font-bold text-shadow-neon">{challenge.points}</span>
                    <span className="text-gray-400 ml-1">Points</span>
                  </div>
                  
                  {isCompleted ? (
                    <div className="flex items-center text-blue-400 bg-blue-900 bg-opacity-30 px-2 py-1 rounded border border-blue-500/30">
                      <span className="mr-1 text-shadow-neon">✓</span>
                      <span className="font-medium">Completed</span>
                    </div>
                  ) : (
                    <div className="flex items-center bg-gray-900 bg-opacity-50 px-2 py-1 rounded border border-gray-700">
                      <span className="text-gray-400 mr-1">{challenge.steps.length}</span>
                      <span className="text-gray-400">Steps</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className={`h-1 ${isCompleted ? 'bg-blue-500' : 'bg-gray-700'}`}></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}