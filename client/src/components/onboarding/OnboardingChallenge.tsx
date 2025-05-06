import { useState, useEffect } from 'react';
import { Terminal } from '@/components/ui/Terminal';

export interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  points: number;
  steps: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }[];
  terminalCommands?: {
    command: string;
    output: string;
  }[];
  reward: {
    type: 'token' | 'nft' | 'badge';
    value: string | number;
    description: string;
  };
  completionMessage: string;
  isCompleted?: boolean;
}

interface OnboardingChallengeProps {
  challenge: Challenge;
  onComplete: (challengeId: string, points: number) => void;
}

export function OnboardingChallenge({ challenge, onComplete }: OnboardingChallengeProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [progress, setProgress] = useState(0);
  const [terminalOutput, setTerminalOutput] = useState(
    "PIXELVAULT LEARNING TERMINAL v1.0\n> Loading challenge resources...\n> Type 'help' for available commands\n>"
  );
  
  const handleOptionSelect = (index: number) => {
    setSelectedOption(index);
  };
  
  const handleSubmitAnswer = () => {
    if (selectedOption === null) return;
    
    const isAnswerCorrect = selectedOption === challenge.steps[currentStep].correctIndex;
    setIsCorrect(isAnswerCorrect);
    setShowExplanation(true);
    
    if (isAnswerCorrect) {
      setTerminalOutput(prev => `${prev}\n$ verify answer\n✓ Correct answer! ${challenge.steps[currentStep].explanation}\n>`);
    } else {
      setTerminalOutput(prev => `${prev}\n$ verify answer\n✗ Incorrect. ${challenge.steps[currentStep].explanation}\n>`);
    }
  };
  
  const handleNextStep = () => {
    if (currentStep < challenge.steps.length - 1) {
      setCurrentStep(currentStep + 1);
      setSelectedOption(null);
      setShowExplanation(false);
      setIsCorrect(false);
      
      const newProgress = Math.round(((currentStep + 1) / challenge.steps.length) * 100);
      setProgress(newProgress);
      
      if (challenge.terminalCommands && challenge.terminalCommands[currentStep + 1]) {
        const cmd = challenge.terminalCommands[currentStep + 1];
        setTerminalOutput(prev => `${prev}\n$ ${cmd.command}\n${cmd.output}\n>`);
      }
    } else {
      setProgress(100);
      setTerminalOutput(prev => `${prev}\n$ complete_challenge\n✓ Challenge completed! You earned ${challenge.points} learning points.\n> ${challenge.completionMessage}\n>`);
      onComplete(challenge.id, challenge.points);
    }
  };
  
  // Initialize terminal with first command if available
  useEffect(() => {
    if (challenge.terminalCommands && challenge.terminalCommands[0]) {
      const cmd = challenge.terminalCommands[0];
      setTerminalOutput(prev => `${prev}\n$ ${cmd.command}\n${cmd.output}\n>`);
    }
  }, []);
  
  const currentQuestion = challenge.steps[currentStep];
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-blue-400 text-shadow-neon">{challenge.title}</h2>
          <p className="text-gray-400">{challenge.description}</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className={`px-2 py-1 rounded text-xs font-semibold ${
            challenge.difficulty === 'beginner' ? 'bg-green-800 text-green-200' : 
            challenge.difficulty === 'intermediate' ? 'bg-yellow-800 text-yellow-200' : 
            'bg-red-800 text-red-200'
          }`}>
            {challenge.difficulty.charAt(0).toUpperCase() + challenge.difficulty.slice(1)}
          </div>
          <div className="px-2 py-1 rounded text-xs font-semibold bg-gray-800 text-gray-200">
            {challenge.points} Points
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <div className="bg-black bg-opacity-80 border border-blue-500 rounded-lg overflow-hidden shadow-md shadow-blue-900/20">
            <div className="p-4 border-b border-blue-900">
              <h3 className="text-blue-400 font-medium text-shadow-neon">Challenge Progress</h3>
              <p className="text-gray-400 text-sm">
                Step {currentStep + 1} of {challenge.steps.length}
              </p>
              <div className="mt-2 w-full bg-gray-800 rounded-full h-2.5">
                <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
            
            <div className="p-4">
              <div className="space-y-4">
                <div className="text-lg text-white">{currentQuestion.question}</div>
                
                <div className="space-y-2">
                  {currentQuestion.options.map((option, index) => (
                    <div
                      key={index}
                      className={`p-3 border rounded-md cursor-pointer transition-colors ${
                        selectedOption === index
                          ? 'border-blue-500 bg-blue-900 bg-opacity-20'
                          : 'border-gray-700 hover:border-gray-500'
                      }`}
                      onClick={() => handleOptionSelect(index)}
                    >
                      <div className="flex items-center">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                          selectedOption === index ? 'bg-blue-500' : 'bg-gray-700'
                        }`}>
                          {selectedOption === index && <span className="text-white">✓</span>}
                        </div>
                        <span className="text-gray-200">{option}</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                {showExplanation && (
                  <div className={`p-4 rounded-md ${isCorrect ? 'bg-blue-900 bg-opacity-20' : 'bg-red-900 bg-opacity-20'}`}>
                    <p className={`text-sm ${isCorrect ? 'text-blue-400' : 'text-red-400'}`}>
                      {isCorrect ? '✓ Correct! ' : '✗ Incorrect. '} 
                      {currentQuestion.explanation}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-4 border-t border-green-900 flex justify-between">
              <button 
                className={`px-4 py-2 rounded-md border ${
                  currentStep === 0 
                    ? 'border-gray-700 bg-gray-800 text-gray-500 cursor-not-allowed' 
                    : 'border-gray-600 bg-gray-800 hover:bg-gray-700 text-white'
                }`}
                disabled={currentStep === 0}
                onClick={() => {
                  setCurrentStep(currentStep - 1);
                  setSelectedOption(null);
                  setShowExplanation(false);
                  const newProgress = Math.round(((currentStep - 1) / challenge.steps.length) * 100);
                  setProgress(newProgress);
                }}
              >
                Previous
              </button>
              
              <div className="space-x-2">
                {!showExplanation ? (
                  <button 
                    className={`px-4 py-2 rounded-md ${
                      selectedOption === null 
                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                        : 'bg-green-700 hover:bg-green-600 text-white'
                    }`}
                    disabled={selectedOption === null}
                    onClick={handleSubmitAnswer}
                  >
                    Check Answer
                  </button>
                ) : (
                  <button 
                    className="px-4 py-2 rounded-md bg-green-700 hover:bg-green-600 text-white"
                    onClick={handleNextStep}
                  >
                    {currentStep < challenge.steps.length - 1 ? 'Next Question' : 'Complete Challenge'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-2">
          <div className="bg-black bg-opacity-80 border border-green-500 rounded-lg overflow-hidden h-full">
            <div className="p-4 border-b border-green-900">
              <h3 className="text-green-400 font-medium">Learning Terminal</h3>
              <p className="text-gray-400 text-sm">
                Execute commands and see outputs
              </p>
            </div>
            
            <div className="p-4 h-[400px] overflow-y-auto">
              <Terminal 
                output={terminalOutput} 
                isRunning={true} 
                showControls={false}
                className="h-full" 
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-black bg-opacity-80 border border-green-500 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-green-900">
          <h3 className="text-green-400 font-medium">Reward</h3>
        </div>
        <div className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0 p-3 bg-green-900 bg-opacity-20 rounded-md">
              {challenge.reward.type === 'token' && (
                <div className="text-2xl text-green-400">🪙</div>
              )}
              {challenge.reward.type === 'nft' && (
                <div className="text-2xl text-green-400">🖼️</div>
              )}
              {challenge.reward.type === 'badge' && (
                <div className="text-2xl text-green-400">🏆</div>
              )}
            </div>
            <div>
              <h3 className="text-white font-medium">
                {challenge.reward.type === 'token'
                  ? `${challenge.reward.value} PVX Tokens`
                  : challenge.reward.type === 'nft'
                  ? 'Exclusive NFT'
                  : 'Achievement Badge'}
              </h3>
              <p className="text-gray-400 text-sm">{challenge.reward.description}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}