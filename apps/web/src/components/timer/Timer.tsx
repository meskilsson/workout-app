import { useReducer, useRef, useState, type SetStateAction } from "react";
import Button from "../ui/button/Button";
import Box from "../ui/box/Box";
import Card from "../ui/cards/Card";
import { secondsToMilliseconds } from "../../hooks/formatTime";

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

const initialState: TimerState = {
  timeLeft: 0,
  isRunning: false,
  startTime: null,
  endTime: null,
  duration: 60,
  isFinished: false,
};

function TimerReducer(state: TimerState, action: TimerAction) {
  switch (action.type) {
    case "START": {
      const currentTime = Date.now();
      const durationInMs = secondsToMilliseconds(state.duration);
      const remainingTime =
        state.endTime === null ? state.timeLeft : state.endTime - currentTime;
      return {
        ...state,
        startTime: currentTime,
        endTime: currentTime + durationInMs,
        timeLeft: durationInMs,
        isRunning: true,
        isFinished: false,
      };
    }
    case "PAUSE": {
      const currentTime = Date.now();
      const remainingTime =
        state.endTime === null ? state.timeLeft : state.endTime - currentTime;

      return {
        ...state,
        timeLeft: remainingTime,
        isRunning: false,
        isFinished: false,
      };
    }

    case "RESET": {
      return {
        ...initialState,
      };
    }

    case "TICK": {
      const currentTime = Date.now();
      const remainingTime =
        state.endTime === null ? state.timeLeft : state.endTime - currentTime;

      return {
        ...state,
        timeLeft: remainingTime,
        isFinished: remainingTime <= 0 ? true : false,
        isRunning: remainingTime !== 0 ? true : false,
      };
    }

    default:
      return state;
  }
}

export default function Timer() {
  const [state, dispatch] = useReducer(TimerReducer, initialState);

  const TIMER_DURATION = 60;

  const handleStart = () => {
    dispatch({ type: "START" });
    if (state.isRunning) {
      const intervalId = setInterval(() => {
        dispatch({ type: "TICK" });
      }, 1000);
      return () => {
        clearInterval(intervalId);
      };
    }
  };

  const handlePause = () => {
    dispatch({ type: "PAUSE" });
  };

  const handleReset = () => {
    dispatch({ type: "RESET" });
  };

  return (
    <Box>
      <Box>
        <Card title="Timer" variant="primary">
          <p>InitialState.duration {initialState.duration}</p>
          <span>Duration: {state.duration}</span>
          <p>isRunning? {state.isRunning}</p>
          <p>TimeLeft: {state.timeLeft}</p>

          <div>
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
    </Box>
  );
}
