import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";

export type TimerState = {
  timeLeft: number;
  isRunning: boolean;
  startTime: number | null;
  endTime: number | null;
  duration: number;
  isFinished: boolean;
};

export type TimerAction =
  | { type: "START" }
  | { type: "PAUSE" }
  | { type: "RESET" }
  | { type: "TICK" };

type TimerContextValue = {
  state: TimerState;
  start: () => void;
  pause: () => void;
  reset: () => void;
};

type TimerProviderProps = {
  children: ReactNode;
  durationMs: number;
};

function createInitialState(durationMs: number): TimerState {
  return {
    timeLeft: durationMs,
    isRunning: false,
    startTime: null,
    endTime: null,
    duration: durationMs,
    isFinished: false,
  };
}

export function timerReducer(
  state: TimerState,
  action: TimerAction,
): TimerState {
  switch (action.type) {
    case "START": {
      if (state.isRunning) return state;

      const currentTime = Date.now();
      const remainingAmount =
        state.timeLeft > 0 ? state.timeLeft : state.duration;

      return {
        ...state,
        startTime: currentTime,
        endTime: currentTime + remainingAmount,
        timeLeft: remainingAmount,
        isRunning: true,
        isFinished: false,
      };
    }

    case "PAUSE": {
      const currentTime = Date.now();
      const remainingTime =
        state.endTime === null
          ? state.timeLeft
          : Math.max(0, state.endTime - currentTime);

      return {
        ...state,
        timeLeft: remainingTime,
        isRunning: false,
        endTime: null,
        isFinished: false,
      };
    }

    case "RESET": {
      return createInitialState(state.duration);
    }

    case "TICK": {
      if (state.endTime === null) return state;

      const currentTime = Date.now();
      const remainingTime = Math.max(0, state.endTime - currentTime);

      if (remainingTime === 0) {
        return {
          ...state,
          timeLeft: 0,
          isRunning: false,
          isFinished: true,
          startTime: null,
          endTime: null,
        };
      }

      return {
        ...state,
        timeLeft: remainingTime,
        isRunning: true,
        isFinished: false,
      };
    }

    default:
      return state;
  }
}

const TimerContext = createContext<TimerContextValue | null>(null);

export function TimerProvider({
  children,
  durationMs,
}: TimerProviderProps): JSX.Element {
  const [state, dispatch] = useReducer(
    timerReducer,
    durationMs,
    createInitialState,
  );

  useEffect(() => {
    if (!state.isRunning) return;

    const intervalId = setInterval(() => {
      dispatch({ type: "TICK" });
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [state.isRunning]);

  const value = useMemo<TimerContextValue>(
    () => ({
      state,
      start: () => dispatch({ type: "START" }),
      pause: () => dispatch({ type: "PAUSE" }),
      reset: () => dispatch({ type: "RESET" }),
    }),
    [state],
  );

  return (
    <TimerContext.Provider value={value}>{children}</TimerContext.Provider>
  );
}

export function useTimer(): TimerContextValue {
  const context = useContext(TimerContext);

  if (!context) {
    throw new Error("useTimer must be used inside a TimerProvider");
  }

  return context;
}