import { CatechismHierarchy } from '../types';

// Hierarquia do Catecismo da Igreja Católica (dados mock/fallback)
export const CATECHISM_HIERARCHY_DATA: CatechismHierarchy[] = [
  {
    id: 'part1',
    title: 'A Profissão da Fé',
    level: 'part',
    number: 'Primeira Parte',
    description: 'O Credo - "Creio" - "Cremos"'
  },
  {
    id: 'part2',
    title: 'A Celebração do Mistério Cristão',
    level: 'part',
    number: 'Segunda Parte',
    description: 'A Liturgia Sacramental'
  },
  {
    id: 'part3',
    title: 'A Vida em Cristo',
    level: 'part',
    number: 'Terceira Parte',
    description: 'Os Mandamentos'
  },
  {
    id: 'part4',
    title: 'A Oração Cristã',
    level: 'part',
    number: 'Quarta Parte',
    description: 'O Pai Nosso'
  }
];

export const getCatechismHierarchyFallback = (parentId?: string): CatechismHierarchy[] => {
  if (!parentId) {
    return CATECHISM_HIERARCHY_DATA;
  }
  
  // Expandir com sub-níveis conforme necessário
  return [];
};
