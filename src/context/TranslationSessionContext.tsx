/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  type ReactNode,
} from 'react';
import { useTranslationSession } from '../hooks/useTranslationSession';
import type { UseTranslationSessionReturn } from '../types';

interface TranslationSessionContextType extends UseTranslationSessionReturn {
  translationValue: string;
  setTranslationValue: (value: string) => void;
}

const TranslationSessionContext =
  createContext<TranslationSessionContextType | null>(null);

interface TranslationSessionProviderProps {
  children: ReactNode;
}

export const TranslationSessionProvider = ({
  children,
}: TranslationSessionProviderProps) => {
  const session = useTranslationSession();
  const [translationValue, setTranslationValueState] = useState('');

  // Stable callback reference to prevent unnecessary re-renders
  const setTranslationValue = useCallback((value: string) => {
    setTranslationValueState(value);
  }, []);

  // Memoize context value to prevent creating new object every render
  const contextValue = useMemo<TranslationSessionContextType>(
    () => ({
      ...session,
      translationValue,
      setTranslationValue,
    }),
    [session, translationValue, setTranslationValue]
  );

  return (
    <TranslationSessionContext.Provider value={contextValue}>
      {children}
    </TranslationSessionContext.Provider>
  );
};

export const useTranslationSessionContext =
  (): TranslationSessionContextType => {
    const context = useContext(TranslationSessionContext);
    if (!context) {
      throw new Error(
        'useTranslationSessionContext must be used within a TranslationSessionProvider'
      );
    }
    return context;
  };
