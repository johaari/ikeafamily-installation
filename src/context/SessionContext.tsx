import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  type ReactNode,
} from 'react';
import type { SessionState, Contribution, Idea, Member } from '../data/types';

const STORAGE_KEY = 'ikea-community-voice-session';

const emptySession: SessionState = {
  contributions: [],
  idea: undefined,
  completed: false,
};

function loadSession(): SessionState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SessionState) : emptySession;
  } catch {
    return emptySession;
  }
}

type Action =
  | { type: 'SAVE_MEMBER'; payload: Member }
  | { type: 'SAVE_CONTRIBUTION'; payload: Contribution }
  | { type: 'SAVE_IDEA'; payload: Idea }
  | { type: 'SET_COMPLETED' }
  | { type: 'RESET' };

function reducer(state: SessionState, action: Action): SessionState {
  switch (action.type) {
    case 'SAVE_MEMBER':
      return { ...state, member: action.payload };
    case 'SAVE_CONTRIBUTION': {
      const existing = state.contributions.findIndex(
        (c) => c.initiativeId === action.payload.initiativeId
      );
      const contributions =
        existing >= 0
          ? state.contributions.map((c, i) =>
              i === existing ? action.payload : c
            )
          : [...state.contributions, action.payload];
      return { ...state, contributions };
    }
    case 'SAVE_IDEA':
      return { ...state, idea: action.payload };
    case 'SET_COMPLETED':
      return { ...state, completed: true };
    case 'RESET':
      return emptySession;
    default:
      return state;
  }
}

type SessionContextValue = {
  session: SessionState;
  saveMember: (m: Member) => void;
  saveContribution: (c: Contribution) => void;
  saveIdea: (idea: Idea) => void;
  setCompleted: () => void;
  reset: () => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, dispatch] = useReducer(reducer, undefined, loadSession);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }, [session]);

  const value: SessionContextValue = {
    session,
    saveMember: (m) => dispatch({ type: 'SAVE_MEMBER', payload: m }),
    saveContribution: (c) => dispatch({ type: 'SAVE_CONTRIBUTION', payload: c }),
    saveIdea: (idea) => dispatch({ type: 'SAVE_IDEA', payload: idea }),
    setCompleted: () => dispatch({ type: 'SET_COMPLETED' }),
    reset: () => {
      dispatch({ type: 'RESET' });
      localStorage.removeItem(STORAGE_KEY);
    },
  };

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside SessionProvider');
  return ctx;
}
