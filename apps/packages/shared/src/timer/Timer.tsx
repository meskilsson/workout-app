import { useReducer, useRef, useEffect } from "react";
import Button from "../../../../web/src/components/ui/button/Button";
import Box from "../../../../web/src/components/ui/box/Box";
import Card from "../../../../web/src/components/ui/cards/Card";
import {
  secondsToMilliseconds,
  formatMilliseconds,
} from "../../../../web/src/utils/formatTime";
import "./timer.css";
import "../../../../web/src/components/ui/cards/card.css";

type TimerState = {
  timeLeft: number;
  isRunning: boolean;
  startTime: number | null;
  endTime: number | null;
  duration: number;
  isFinished: boolean;
};

type TimerAction =
  | { type: "START" }
  | { type: "PAUSE" }
  | { type: "RESET" }
  | { type: "TICK" };

const TIMER_DURATION_MS = secondsToMilliseconds(60);

const initialState: TimerState = {
  timeLeft: TIMER_DURATION_MS,
  isRunning: false,
  startTime: null,
  endTime: null,
  duration: TIMER_DURATION_MS,
  isFinished: false,
};

function TimerReducer(state: TimerState, action: TimerAction) {
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
      return {
        ...initialState,
      };
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
export default function Timer() {
  const [state, dispatch] = useReducer(TimerReducer, initialState);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!state.isRunning) return;

    const intervalId = setInterval(() => {
      dispatch({ type: "TICK" });
    }, 1000);
    intervalRef.current = intervalId;

    return () => {
      clearInterval(intervalId);
      intervalRef.current = null;
    };
  }, [state.isRunning]);

  const handleStart = () => {
    dispatch({ type: "START" });
  };

  const handlePause = () => {
    dispatch({ type: "PAUSE" });
  };

  const handleReset = () => {
    dispatch({ type: "RESET" });
  };

  return (
    <Box className="timer-root">
      <Card title="Timer" className="timer-card" variant="timer">
        <p>TimeLeft: {formatMilliseconds(state.timeLeft)}</p>

        <div className="timer-actions">
          <Button variant="primary" onClick={handleStart}>
            Start
          </Button>
          <Button variant="primary" onClick={handlePause}>
            Pause
          </Button>
          <Button variant="primary" onClick={handleReset}>
            Reset
          </Button>
        </div>
      </Card>
    </Box>
  );
}
