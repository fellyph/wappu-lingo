/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, type ReactNode } from 'react';
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
  const [translationValue, setTranslationValue] = useState('');

  return (
    <TranslationSessionContext.Provider
      value={{ ...session, translationValue, setTranslationValue }}
    >
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
