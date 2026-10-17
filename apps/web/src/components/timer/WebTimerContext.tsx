import { createContext, useContext } from 'react';
import type { WebTimerStore } from '../../utils/webTimerStore';
export const WebTimerContext = createContext<WebTimerStore | null>(null);
export function useWebTimers() {
    const value = useContext(WebTimerContext);
    if (!value) throw new Error('Web timers must be used inside WebRestTimerProvider');
    return value;
}
