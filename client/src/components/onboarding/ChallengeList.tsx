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
        return 'text-green-400 bg-green-900 bg-opacity-70 border border-green-600/70 shadow-sm shadow-green-900/70 font-medium';
      case 'intermediate':
        return 'text-yellow-400 bg-yellow-900 bg-opacity-70 border border-yellow-600/70 shadow-sm shadow-yellow-900/70 font-medium';
      case 'advanced':
        return 'text-red-400 bg-red-900 bg-opacity-70 border border-red-600/70 shadow-sm shadow-red-900/70 font-medium';
      default:
        return 'text-gray-400 bg-gray-900 bg-opacity-70 border border-gray-600/70 shadow-sm shadow-gray-900/70 font-medium';
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-black bg-opacity-90 p-5 rounded-lg border border-blue-900 shadow-lg shadow-blue-900/20 mb-8">
        <h2 className="text-2xl font-bold text-blue-400 text-shadow-neon">Blockchain Learning Challenges</h2>
        
        <div className="flex items-center space-x-5">
          <div className="bg-black bg-opacity-80 px-4 py-2 rounded-md border border-blue-700/60 shadow-md shadow-blue-900/20 flex items-center">
            <span className="font-bold text-blue-400 text-shadow-neon text-xl mr-2">{userProgress.totalPoints}</span> 
            <span className="text-gray-300">Points</span>
          </div>
          <div className="bg-black bg-opacity-80 px-4 py-2 rounded-md border border-blue-700/60 shadow-md shadow-blue-900/20 flex items-center">
            <span className="text-gray-300 mr-2">Level</span>
            <span className="font-bold text-blue-400 text-shadow-neon text-xl">{userProgress.level}</span>
          </div>
        </div>
      </div>
      
      {/* Filter Tabs */}
      <div className="flex space-x-2 border-b border-blue-900 pb-3">
        <button 
          className={`px-4 py-2 rounded-md shadow-md transition-all font-medium ${
            filter === 'all' 
              ? 'bg-blue-800 bg-opacity-90 text-white text-shadow-neon border border-blue-500 shadow-blue-900/50' 
              : 'bg-gray-900 bg-opacity-90 text-gray-300 hover:bg-gray-800 hover:bg-opacity-90 border border-gray-700 hover:border-blue-500/50 hover:text-blue-300'
          }`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button 
          className={`px-4 py-2 rounded-md shadow-md transition-all font-medium ${
            filter === 'beginner' 
              ? 'bg-green-800 bg-opacity-90 text-white text-shadow-neon border border-green-500 shadow-green-900/50' 
              : 'bg-gray-900 bg-opacity-90 text-gray-300 hover:bg-gray-800 hover:bg-opacity-90 border border-gray-700 hover:border-green-500/50 hover:text-green-300'
          }`}
          onClick={() => setFilter('beginner')}
        >
          Beginner
        </button>
        <button 
          className={`px-4 py-2 rounded-md shadow-md transition-all font-medium ${
            filter === 'intermediate' 
              ? 'bg-yellow-800 bg-opacity-90 text-white text-shadow-neon border border-yellow-500 shadow-yellow-900/50' 
              : 'bg-gray-900 bg-opacity-90 text-gray-300 hover:bg-gray-800 hover:bg-opacity-90 border border-gray-700 hover:border-yellow-500/50 hover:text-yellow-300'
          }`}
          onClick={() => setFilter('intermediate')}
        >
          Intermediate
        </button>
        <button 
          className={`px-4 py-2 rounded-md shadow-md transition-all font-medium ${
            filter === 'advanced' 
              ? 'bg-red-800 bg-opacity-90 text-white text-shadow-neon border border-red-500 shadow-red-900/50' 
              : 'bg-gray-900 bg-opacity-90 text-gray-300 hover:bg-gray-800 hover:bg-opacity-90 border border-gray-700 hover:border-red-500/50 hover:text-red-300'
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
              className={`bg-black bg-opacity-90 rounded-lg border ${isCompleted ? 'border-blue-500' : 'border-gray-700'} overflow-hidden hover:border-blue-500 transition-all cursor-pointer shadow-lg ${isCompleted ? 'shadow-blue-900/40 hover:shadow-blue-900/60' : 'shadow-gray-900/30 hover:shadow-gray-900/50'}`}
              onClick={() => onSelect(challenge.id)}
            >
              <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-white">{challenge.title}</h3>
                  <div className={`px-3 py-1 rounded text-xs ${difficultyColor(challenge.difficulty)}`}>
                    {challenge.difficulty.charAt(0).toUpperCase() + challenge.difficulty.slice(1)}
                  </div>
                </div>
                
                <p className="text-gray-400 text-sm mb-5 h-12 overflow-hidden">{challenge.description}</p>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center bg-black bg-opacity-70 px-3 py-1.5 rounded-md border border-blue-900/50 shadow-inner shadow-blue-900/20">
                    <span className="text-blue-400 font-bold text-shadow-neon">{challenge.points}</span>
                    <span className="text-gray-400 ml-1">Points</span>
                  </div>
                  
                  {isCompleted ? (
                    <div className="flex items-center text-blue-400 bg-blue-900 bg-opacity-50 px-3 py-1.5 rounded-md border border-blue-500/60 shadow-md shadow-blue-900/20">
                      <span className="mr-1 text-shadow-neon">✓</span>
                      <span className="font-medium">Completed</span>
                    </div>
                  ) : (
                    <div className="flex items-center bg-gray-900 bg-opacity-70 px-3 py-1.5 rounded-md border border-gray-700/80 shadow-md shadow-gray-900/20">
                      <span className="text-gray-300 mr-1">{challenge.steps.length}</span>
                      <span className="text-gray-400">Steps</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className={`h-1.5 ${isCompleted ? 'bg-blue-500' : 'bg-gray-700'}`}></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}