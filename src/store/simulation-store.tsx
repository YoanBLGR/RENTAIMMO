'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { Simulation, Scenario } from '@/domain/types';

// ===== TYPES =====

interface SimulationState {
  simulations: Simulation[];
  activeSimulationId: string | null;
  loaded: boolean;
}

type SimulationAction =
  | { type: 'LOAD'; simulations: Simulation[]; activeId: string | null }
  | { type: 'CREATE_SIMULATION'; simulation: Simulation }
  | { type: 'UPDATE_SIMULATION'; simulation: Simulation }
  | { type: 'DELETE_SIMULATION'; id: string }
  | { type: 'DUPLICATE_SIMULATION'; id: string; newId: string; simulation: Simulation }
  | { type: 'SET_ACTIVE'; id: string | null }
  | { type: 'ADD_SCENARIO'; simulationId: string; scenario: Scenario }
  | { type: 'UPDATE_SCENARIO'; simulationId: string; scenario: Scenario }
  | { type: 'DELETE_SCENARIO'; simulationId: string; scenarioId: string };

interface SimulationContextType {
  state: SimulationState;
  createSimulation: (simulation: Simulation) => void;
  updateSimulation: (simulation: Simulation) => void;
  deleteSimulation: (id: string) => void;
  duplicateSimulation: (id: string, newId: string) => void;
  setActive: (id: string | null) => void;
  addScenario: (simulationId: string, scenario: Scenario) => void;
  updateScenario: (simulationId: string, scenario: Scenario) => void;
  deleteScenario: (simulationId: string, scenarioId: string) => void;
  activeSimulation: Simulation | undefined;
}

// ===== STORAGE HELPERS =====

const STORAGE_KEY = 'rentaimmo_simulations';
const ACTIVE_KEY = 'rentaimmo_active_simulation';

function persistToStorage(simulations: Simulation[], activeId: string | null) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(simulations));
    if (activeId) {
      localStorage.setItem(ACTIVE_KEY, activeId);
    } else {
      localStorage.removeItem(ACTIVE_KEY);
    }
  } catch (e) {
    console.error('Failed to persist simulations to localStorage', e);
  }
}

function loadFromStorage(): { simulations: Simulation[]; activeId: string | null } {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    const activeId = localStorage.getItem(ACTIVE_KEY);
    return {
      simulations: data ? JSON.parse(data) : [],
      activeId: activeId || null,
    };
  } catch (e) {
    console.error('Failed to load simulations from localStorage', e);
    return { simulations: [], activeId: null };
  }
}

// ===== REDUCER =====

function simulationReducer(state: SimulationState, action: SimulationAction): SimulationState {
  switch (action.type) {
    case 'LOAD':
      return {
        simulations: action.simulations,
        activeSimulationId: action.activeId,
        loaded: true,
      };

    case 'CREATE_SIMULATION':
      return {
        ...state,
        simulations: [...state.simulations, action.simulation],
        activeSimulationId: action.simulation.id,
      };

    case 'UPDATE_SIMULATION':
      return {
        ...state,
        simulations: state.simulations.map((sim) =>
          sim.id === action.simulation.id ? action.simulation : sim
        ),
      };

    case 'DELETE_SIMULATION': {
      const filtered = state.simulations.filter((sim) => sim.id !== action.id);
      const newActiveId =
        state.activeSimulationId === action.id
          ? filtered[0]?.id || null
          : state.activeSimulationId;
      return {
        ...state,
        simulations: filtered,
        activeSimulationId: newActiveId,
      };
    }

    case 'DUPLICATE_SIMULATION':
      return {
        ...state,
        simulations: [...state.simulations, action.simulation],
        activeSimulationId: action.newId,
      };

    case 'SET_ACTIVE':
      return {
        ...state,
        activeSimulationId: action.id,
      };

    case 'ADD_SCENARIO':
      return {
        ...state,
        simulations: state.simulations.map((sim) =>
          sim.id === action.simulationId
            ? { ...sim, scenarios: [...sim.scenarios, action.scenario] }
            : sim
        ),
      };

    case 'UPDATE_SCENARIO':
      return {
        ...state,
        simulations: state.simulations.map((sim) =>
          sim.id === action.simulationId
            ? {
                ...sim,
                scenarios: sim.scenarios.map((scen) =>
                  scen.id === action.scenario.id ? action.scenario : scen
                ),
              }
            : sim
        ),
      };

    case 'DELETE_SCENARIO':
      return {
        ...state,
        simulations: state.simulations.map((sim) =>
          sim.id === action.simulationId
            ? {
                ...sim,
                scenarios: sim.scenarios.filter((scen) => scen.id !== action.scenarioId),
              }
            : sim
        ),
      };

    default:
      return state;
  }
}

// ===== CONTEXT =====

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

// ===== PROVIDER COMPONENT =====

interface SimulationProviderProps {
  children: React.ReactNode;
}

export function SimulationProvider({ children }: SimulationProviderProps) {
  const [state, dispatch] = useReducer(simulationReducer, {
    simulations: [],
    activeSimulationId: null,
    loaded: false,
  });

  // Load from localStorage on mount
  useEffect(() => {
    const { simulations, activeId } = loadFromStorage();
    dispatch({ type: 'LOAD', simulations, activeId });
  }, []);

  // Persist to localStorage whenever state changes (after initial load)
  useEffect(() => {
    if (state.loaded) {
      persistToStorage(state.simulations, state.activeSimulationId);
    }
  }, [state.simulations, state.activeSimulationId, state.loaded]);

  // Action callbacks
  const createSimulation = useCallback((simulation: Simulation) => {
    dispatch({ type: 'CREATE_SIMULATION', simulation });
  }, []);

  const updateSimulation = useCallback((simulation: Simulation) => {
    dispatch({ type: 'UPDATE_SIMULATION', simulation });
  }, []);

  const deleteSimulation = useCallback((id: string) => {
    dispatch({ type: 'DELETE_SIMULATION', id });
  }, []);

  const duplicateSimulation = useCallback((id: string, newId: string) => {
    const original = state.simulations.find((sim) => sim.id === id);
    if (!original) return;

    // Deep copy with new IDs
    const duplicated: Simulation = {
      ...original,
      id: newId,
      dateCreation: new Date().toISOString(),
      dateMiseAJour: new Date().toISOString(),
      nom: `${original.nom} (copie)`,
      scenarios: original.scenarios.map((scen) => ({
        ...scen,
        id: `${scen.id}-${Date.now()}`,
      })),
    };

    dispatch({ type: 'DUPLICATE_SIMULATION', id, newId, simulation: duplicated });
  }, [state.simulations]);

  const setActive = useCallback((id: string | null) => {
    dispatch({ type: 'SET_ACTIVE', id });
  }, []);

  const addScenario = useCallback((simulationId: string, scenario: Scenario) => {
    dispatch({ type: 'ADD_SCENARIO', simulationId, scenario });
  }, []);

  const updateScenario = useCallback((simulationId: string, scenario: Scenario) => {
    dispatch({ type: 'UPDATE_SCENARIO', simulationId, scenario });
  }, []);

  const deleteScenario = useCallback((simulationId: string, scenarioId: string) => {
    dispatch({ type: 'DELETE_SCENARIO', simulationId, scenarioId });
  }, []);

  // Derived values
  const activeSimulation = state.simulations.find((sim) => sim.id === state.activeSimulationId);

  const value: SimulationContextType = {
    state,
    createSimulation,
    updateSimulation,
    deleteSimulation,
    duplicateSimulation,
    setActive,
    addScenario,
    updateScenario,
    deleteScenario,
    activeSimulation,
  };

  return (
    <SimulationContext.Provider value={value}>{children}</SimulationContext.Provider>
  );
}

// ===== HOOK =====

export function useSimulationStore() {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('useSimulationStore must be used within SimulationProvider');
  }
  return context;
}
