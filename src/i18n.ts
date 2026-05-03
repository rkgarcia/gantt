export type Locale = 'en' | 'es';

interface LanguagePack {
  dayAbbreviations: string;
  weekPrefix: string;
  locale: string;
  legendTitle: string;
  legendLabels: {
    milestone: string;
    progress: string;
    today: string;
    dependency: string;
  };
}

export const LANGUAGES: Record<Locale, LanguagePack> = {
  en: {
    dayAbbreviations: 'SMTWTFS',
    weekPrefix: 'W',
    locale: 'en-US',
    legendTitle: 'LEGEND:',
    legendLabels: {
      milestone: 'Milestone',
      progress: 'Progress',
      today: 'Today',
      dependency: 'Dependency',
    },
  },
  es: {
    dayAbbreviations: 'DLMMJVS',
    weekPrefix: 'S',
    locale: 'es-ES',
    legendTitle: 'LEYENDA:',
    legendLabels: {
      milestone: 'Hito',
      progress: 'Progreso',
      today: 'Hoy',
      dependency: 'Dependencia',
    },
  },
};

export function getLanguagePack(language: Locale = 'en'): LanguagePack {
  return LANGUAGES[language];
}
