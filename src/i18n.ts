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

export const LANGUAGES = {
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
} satisfies Record<string, LanguagePack>;

export type Locale = keyof typeof LANGUAGES;

export function getLanguagePack(language: Locale = 'en'): LanguagePack {
  return LANGUAGES[language];
}
