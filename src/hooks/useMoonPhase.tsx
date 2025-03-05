'use client';

import { useState, useEffect } from 'react';

// Enum para as fases da lua, correspondente ao contrato
export enum MoonPhase {
  NewMoon = 0,
  WaxingCrescent = 1,
  FirstQuarter = 2,
  WaxingGibbous = 3,
  FullMoon = 4,
  WaningGibbous = 5,
  LastQuarter = 6,
  WaningCrescent = 7
}

// Nomes das fases da lua
export const moonPhaseNames = [
  "New Moon",
  "Waxing Crescent",
  "First Quarter",
  "Waxing Gibbous",
  "Full Moon",
  "Waning Gibbous",
  "Last Quarter",
  "Waning Crescent"
];

// Hook personalizado para obter a fase atual da lua
export function useMoonPhase() {
  const [currentPhase, setCurrentPhase] = useState<MoonPhase>(MoonPhase.NewMoon);
  const [currentPhaseName, setCurrentPhaseName] = useState<string>(moonPhaseNames[MoonPhase.NewMoon]);
  
  useEffect(() => {
    // Função para calcular a fase da lua atual
    // Esta lógica espelha a que está no contrato inteligente
    const calculateMoonPhase = () => {
      const secondsSinceEpoch = Math.floor(Date.now() / 1000);
      // Duração do ciclo lunar em segundos (29.5 dias)
      const lunarCycle = 29.5 * 24 * 60 * 60;
      // Calcula o índice da fase com base no timestamp atual
      const phaseIndex = Math.floor((secondsSinceEpoch % lunarCycle) * 8 / lunarCycle);
      
      setCurrentPhase(phaseIndex);
      setCurrentPhaseName(moonPhaseNames[phaseIndex]);
    };
    
    // Calcula a fase inicial
    calculateMoonPhase();
    
    // Define um intervalo para atualizar (a cada hora)
    const interval = setInterval(calculateMoonPhase, 60 * 60 * 1000);
    
    // Limpa o intervalo quando o componente é desmontado
    return () => clearInterval(interval);
  }, []);
  
  return {
    currentPhase,
    currentPhaseName,
    moonPhaseImage: `/img/${moonPhaseNames[currentPhase].replace(/\s+/g, '')}.png`
  };
}

export default useMoonPhase;