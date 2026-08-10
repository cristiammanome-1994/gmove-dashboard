export type Participant = {
  id: number;
  name: string;
  daysActive: number;
  points: number;
  videos: number;
  posted: boolean;
  videoLinks?: string[];
  historicalAvg: number;
  projection: number;
};

export type InactiveParticipant = {
  id: number;
  name: string;
  lastCheckIn: string;
  historicalCheckIns: number;
  activeMonths: number;
};

export const monthLabel = "Abril / 2026";

export const summary = {
  active: 47,
  realActive: 38,
  inactive: 12,
  totalCheckIns: 892,
  avgPerActive: 23.5,
  goalReachedCount: 28,
  goalReachedPct: 59.6,
  videosSubmitted: 19,
};

export const participants: Participant[] = [
  { id: 1, name: "Ana Carolina Silva", daysActive: 22, points: 1840, videos: 4, posted: true, videoLinks: ["#", "#", "#", "#"], historicalAvg: 18.4, projection: 23 },
  { id: 2, name: "Bruno Ferreira Costa", daysActive: 20, points: 1650, videos: 3, posted: true, videoLinks: ["#", "#", "#"], historicalAvg: 16.2, projection: 21 },
  { id: 3, name: "Juliana Mendes Rocha", daysActive: 18, points: 1520, videos: 3, posted: true, videoLinks: ["#", "#", "#"], historicalAvg: 19.0, projection: 19 },
  { id: 4, name: "Rafael Souza Lima", daysActive: 15, points: 1200, videos: 2, posted: true, videoLinks: ["#", "#"], historicalAvg: 12.8, projection: 16 },
  { id: 5, name: "Camila Oliveira Santos", daysActive: 15, points: 1180, videos: 2, posted: true, videoLinks: ["#", "#"], historicalAvg: 14.5, projection: 16 },
  { id: 6, name: "Diego Marques Teixeira", daysActive: 14, points: 980, videos: 1, posted: true, videoLinks: ["#"], historicalAvg: 15.3, projection: 15 },
  { id: 7, name: "Fernanda Alves Gomes", daysActive: 13, points: 870, videos: 1, posted: true, videoLinks: ["#"], historicalAvg: 11.0, projection: 14 },
  { id: 8, name: "Matheus Ribeiro Pinto", daysActive: 12, points: 760, videos: 0, posted: false, historicalAvg: 13.2, projection: 13 },
  { id: 9, name: "Larissa Cardoso Neves", daysActive: 10, points: 640, videos: 1, posted: true, videoLinks: ["#"], historicalAvg: 9.5, projection: 11 },
  { id: 10, name: "Rodrigo Castro Melo", daysActive: 8, points: 510, videos: 0, posted: false, historicalAvg: 10.8, projection: 9 },
  { id: 11, name: "Patrícia Lima Duarte", daysActive: 7, points: 440, videos: 1, posted: true, videoLinks: ["#"], historicalAvg: 8.1, projection: 8 },
  { id: 12, name: "Gustavo Andrade Pires", daysActive: 6, points: 380, videos: 0, posted: false, historicalAvg: 11.4, projection: 7 },
  { id: 13, name: "Beatriz Moreira Cunha", daysActive: 5, points: 320, videos: 1, posted: true, videoLinks: ["#"], historicalAvg: 6.0, projection: 6 },
  { id: 14, name: "Felipe Nogueira Brito", daysActive: 4, points: 260, videos: 0, posted: false, historicalAvg: 9.7, projection: 5 },
];

export const inactives: InactiveParticipant[] = [
  { id: 101, name: "Pedro Henrique Barros", lastCheckIn: "15/03/2026", historicalCheckIns: 87, activeMonths: 9 },
  { id: 102, name: "Thais Nascimento Vieira", lastCheckIn: "28/02/2026", historicalCheckIns: 45, activeMonths: 6 },
  { id: 103, name: "Marcelo Tavares Rios", lastCheckIn: "20/02/2026", historicalCheckIns: 38, activeMonths: 5 },
  { id: 104, name: "Vanessa Pires Coelho", lastCheckIn: "12/02/2026", historicalCheckIns: 28, activeMonths: 4 },
  { id: 105, name: "Lucas Monteiro Freitas", lastCheckIn: "10/01/2026", historicalCheckIns: 12, activeMonths: 2 },
  { id: 106, name: "Renata Cavalcanti Sá", lastCheckIn: "05/01/2026", historicalCheckIns: 9, activeMonths: 2 },
];

export const modalities = [
  { name: "Musculação", value: 34 },
  { name: "Corrida", value: 22 },
  { name: "Ciclismo", value: 14 },
  { name: "Funcional", value: 11 },
  { name: "Futebol", value: 8 },
  { name: "Natação", value: 6 },
  { name: "Outros", value: 5 },
];

export const schedules = [
  { name: "Manhã", value: 48 },
  { name: "Noite", value: 31 },
  { name: "Tarde", value: 15 },
  { name: "Madrugada", value: 6 },
];

export const evolution = [
  { month: "Jun/25", "Ana Carolina": 14, "Bruno": 12, "Juliana": 16, "Rafael": 10, "Camila": 13 },
  { month: "Jul/25", "Ana Carolina": 16, "Bruno": 13, "Juliana": 17, "Rafael": 11, "Camila": 14 },
  { month: "Ago/25", "Ana Carolina": 17, "Bruno": 15, "Juliana": 18, "Rafael": 12, "Camila": 13 },
  { month: "Set/25", "Ana Carolina": 18, "Bruno": 16, "Juliana": 19, "Rafael": 13, "Camila": 14 },
  { month: "Out/25", "Ana Carolina": 19, "Bruno": 17, "Juliana": 18, "Rafael": 14, "Camila": 15 },
  { month: "Nov/25", "Ana Carolina": 19, "Bruno": 17, "Juliana": 19, "Rafael": 13, "Camila": 14 },
  { month: "Dez/25", "Ana Carolina": 17, "Bruno": 15, "Juliana": 17, "Rafael": 12, "Camila": 13 },
  { month: "Jan/26", "Ana Carolina": 20, "Bruno": 18, "Juliana": 18, "Rafael": 14, "Camila": 15 },
  { month: "Fev/26", "Ana Carolina": 20, "Bruno": 19, "Juliana": 17, "Rafael": 13, "Camila": 14 },
  { month: "Mar/26", "Ana Carolina": 21, "Bruno": 19, "Juliana": 18, "Rafael": 14, "Camila": 15 },
  { month: "Abr/26", "Ana Carolina": 22, "Bruno": 20, "Juliana": 18, "Rafael": 15, "Camila": 15 },
];
