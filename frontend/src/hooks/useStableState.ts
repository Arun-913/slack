import { useCallback, useState, Dispatch, SetStateAction } from "react";

export function useStableState<T>(inititialValue: T): [T, Dispatch<SetStateAction<T>>]  {
    const [state, setState] = useState<T>(inititialValue);
    
    const stableSetState = useCallback((value: SetStateAction<T>) => setState(value), []);
    
    return [state, stableSetState];
}