export interface Entry {
  id: string;
  date: string;
  service: string;
  photo: string;
  teamSize: number;
  duration: string;
  description: string;
  category: string;
}

export interface Project {
  id: string;
  name: string;
  location: string;
  color: string;
}

export const projects: Project[] = [
  {
    id: '1',
    name: 'Edifício Residencial Parque das Flores',
    location: 'São Paulo, SP',
    color: '#2563EB',
  },
  {
    id: '2',
    name: 'Centro Comercial Boa Vista',
    location: 'Rio de Janeiro, RJ',
    color: '#22C55E',
  },
  {
    id: '3',
    name: 'Galpão Industrial Zona Sul',
    location: 'Curitiba, PR',
    color: '#A855F7',
  },
];

export const entries: Entry[] = [
  {
    id: '1',
    date: '2026-04-10',
    service: 'Concretagem',
    photo: 'https://images.unsplash.com/photo-1773432114391-f85c1674b233?w=800',
    teamSize: 8,
    duration: '4h',
    description:
      'Concretagem da laje do 3º pavimento finalizada conforme cronograma. Equipe de 8 funcionários trabalhou durante 4 horas.',
    category: 'Estrutura',
  },
  {
    id: '2',
    date: '2026-04-10',
    service: 'Alvenaria',
    photo: 'https://images.unsplash.com/photo-1628847115161-d6793dc59c7f?w=800',
    teamSize: 5,
    duration: '6h',
    description:
      'Execução de alvenaria interna no 2º pavimento. Avanço de aproximadamente 40m² de parede.',
    category: 'Vedação',
  },
  {
    id: '3',
    date: '2026-04-09',
    service: 'Estrutura Metálica',
    photo: 'https://images.unsplash.com/photo-1655936072893-921e69ae9038?w=800',
    teamSize: 6,
    duration: '5h',
    description:
      'Montagem de estrutura metálica do mezanino. Instalação de vigas e pilares conforme projeto estrutural.',
    category: 'Estrutura',
  },
  {
    id: '4',
    date: '2026-04-09',
    service: 'Fundação',
    photo: 'https://images.unsplash.com/photo-1603080296081-81f47189df91?w=800',
    teamSize: 4,
    duration: '3h',
    description: 'Escavação para fundação dos blocos B1 a B4. Profundidade atingida conforme projeto.',
    category: 'Fundação',
  },
  {
    id: '5',
    date: '2026-04-08',
    service: 'Instalações Elétricas',
    photo: 'https://images.unsplash.com/photo-1650630718105-497674381f3c?w=800',
    teamSize: 3,
    duration: '7h',
    description: 'Instalação de eletrodutos e caixas no 1º pavimento. Passagem de cabos iniciada.',
    category: 'Instalações',
  },
];
