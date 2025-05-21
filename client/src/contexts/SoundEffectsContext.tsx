import React, { createContext, useContext, ReactNode } from 'react';
import { useSoundEffects, SoundEffectType } from '@/hooks/useSoundEffects';

interface SoundEffectsContextType {
  playSound: (type: SoundEffectType) => void;
  setVolume: (volume: number) => void;
  setEnabled: (enabled: boolean) => void;
  volume: number;
  enabled: boolean;
}

const SoundEffectsContext = createContext<SoundEffectsContextType | undefined>(undefined);

interface SoundEffectsProviderProps {
  children: ReactNode;
  initialVolume?: number;
  initialEnabled?: boolean;
}

export const SoundEffectsProvider: React.FC<SoundEffectsProviderProps> = ({
  children,
  initialVolume = 0.5,
  initialEnabled = true,
}) => {
  const { playSound, setVolume, setEnabled, volume, enabled } = useSoundEffects({
    volume: initialVolume,
    enabled: initialEnabled,
  });

  return (
    <SoundEffectsContext.Provider
      value={{
        playSound,
        setVolume,
        setEnabled,
        volume,
        enabled,
      }}
    >
      {children}
    </SoundEffectsContext.Provider>
  );
};

export const useSoundEffectsContext = (): SoundEffectsContextType => {
  const context = useContext(SoundEffectsContext);
  if (context === undefined) {
    throw new Error('useSoundEffectsContext must be used within a SoundEffectsProvider');
  }
  return context;
};