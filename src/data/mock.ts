// CarUni — dados mockados realistas BR
// Estrutura desenhada para virar tabelas Supabase sem reescrever telas.

export type LatLng = [number, number];

export interface Person {
  id: string;
  nome: string;
  iniciais: string;
  presenca: number; // 0-100
  avaliacao: number; // 0-5
  cnhVerificada?: boolean;
  uni?: string;
  desde?: string;
  carro?: { modelo: string; cor: string; placa: string };
  cor: string; // avatar bg (hex/oklch token name)
}

export interface Rota {
  id: string;
  nome: string;
  origem: { label: string; coord: LatLng };
  destino: { label: string; coord: LatLng };
  paradas?: { label: string; coord: LatLng }[];
  caminho: LatLng[]; // polyline
  motoristaId: string;
  diasSemana: number[]; // 0=Dom..6=Sab
  horarioIda: string; // HH:mm
  vagas: number;
  inscritos: string[]; // person ids
  precoBase: number; // R$ por vaga quando 1 pessoa
  km: number;
  cidade: string;
}

export interface Transacao {
  id: string;
  tipo: "carona" | "recarga" | "penalizacao" | "repasse";
  descricao: string;
  valor: number; // negativo = saída
  data: string; // ISO
  rotaId?: string;
}

export interface ChatMsg {
  id: string;
  rotaId: string;
  autorId: string | "sistema";
  texto: string;
  ts: string;
}

// ---------- Pessoas ----------
export const eu: Person = {
  id: "u1",
  nome: "Você",
  iniciais: "VC",
  presenca: 96,
  avaliacao: 4.8,
  cnhVerificada: true,
  uni: "UNICAMP · Eng. Computação",
  desde: "Mar 2024",
  carro: { modelo: "VW Polo 2020", cor: "Prata", placa: "FXG-2A47" },
  cor: "var(--primary)",
};

export const pessoas: Person[] = [
  eu,
  { id: "u2", nome: "Lucas Andrade", iniciais: "LA", presenca: 98, avaliacao: 4.9, cnhVerificada: true, uni: "UNICAMP · FEA", desde: "Jan 2024", carro: { modelo: "Honda Fit 2019", cor: "Branco", placa: "EWB-9H12" }, cor: "oklch(0.78 0.16 65)" },
  { id: "u3", nome: "Marina Costa", iniciais: "MC", presenca: 92, avaliacao: 4.7, cnhVerificada: true, uni: "USP · Direito", carro: { modelo: "Hyundai HB20 2021", cor: "Cinza", placa: "GHK-3M88" }, cor: "oklch(0.65 0.18 320)" },
  { id: "u4", nome: "Rafael Tanaka", iniciais: "RT", presenca: 88, avaliacao: 4.6, cnhVerificada: true, uni: "UFMG · Arquitetura", carro: { modelo: "Renault Kwid 2022", cor: "Vermelho", placa: "RJB-7Z21" }, cor: "oklch(0.7 0.15 200)" },
  { id: "u5", nome: "Beatriz Lima", iniciais: "BL", presenca: 94, avaliacao: 4.8, uni: "UNICAMP · Letras", cor: "oklch(0.62 0.18 45)" },
  { id: "u6", nome: "Pedro Henrique", iniciais: "PH", presenca: 90, avaliacao: 4.5, uni: "USP · Eng. Civil", cor: "oklch(0.55 0.14 165)" },
  { id: "u7", nome: "Júlia Mendes", iniciais: "JM", presenca: 99, avaliacao: 5.0, uni: "UFMG · Medicina", cor: "oklch(0.86 0.21 130)" },
  { id: "u8", nome: "Gabriel Souza", iniciais: "GS", presenca: 76, avaliacao: 4.2, uni: "UNICAMP · FEEC", cor: "oklch(0.72 0.17 70)" },
  { id: "u9", nome: "Camila Rocha", iniciais: "CR", presenca: 95, avaliacao: 4.9, uni: "USP · Psicologia", cor: "oklch(0.42 0.09 180)" },
  { id: "u10", nome: "Thiago Almeida", iniciais: "TA", presenca: 87, avaliacao: 4.4, uni: "UNICAMP · IC", cor: "oklch(0.65 0.18 320)" },
];

export const getPessoa = (id: string) => pessoas.find((p) => p.id === id) ?? eu;

// ---------- Rotas (coordenadas reais SP/Campinas) ----------
// Caminho aproximado, suficiente para desenhar polyline visualmente convincente.
export const rotas: Rota[] = [
  {
    id: "r1",
    nome: "Centro Campinas → Barão Geraldo (UNICAMP)",
    cidade: "Campinas",
    origem: { label: "Centro · Cambuí", coord: [-22.9056, -47.0608] },
    destino: { label: "UNICAMP · Portaria 1", coord: [-22.8155, -47.0699] },
    caminho: [
      [-22.9056, -47.0608],
      [-22.8920, -47.0660],
      [-22.8780, -47.0700],
      [-22.8600, -47.0720],
      [-22.8400, -47.0710],
      [-22.8255, -47.0700],
      [-22.8155, -47.0699],
    ],
    motoristaId: "u2",
    diasSemana: [1, 2, 3, 4, 5],
    horarioIda: "07:42",
    vagas: 4,
    inscritos: ["u1", "u5", "u6"],
    precoBase: 18,
    km: 12.4,
  },
  {
    id: "r2",
    nome: "Pinheiros → Cidade Universitária (USP)",
    cidade: "São Paulo",
    origem: { label: "Pinheiros · Faria Lima", coord: [-23.5675, -46.6939] },
    destino: { label: "USP · Praça do Relógio", coord: [-23.5587, -46.7319] },
    caminho: [
      [-23.5675, -46.6939],
      [-23.5650, -46.7050],
      [-23.5620, -46.7150],
      [-23.5600, -46.7230],
      [-23.5587, -46.7319],
    ],
    motoristaId: "u3",
    diasSemana: [1, 2, 3, 4, 5],
    horarioIda: "07:15",
    vagas: 3,
    inscritos: ["u9"],
    precoBase: 15,
    km: 6.8,
  },
  {
    id: "r3",
    nome: "Santana → Av. Paulista",
    cidade: "São Paulo",
    origem: { label: "Santana · Tucuruvi", coord: [-23.4810, -46.6010] },
    destino: { label: "Av. Paulista · MASP", coord: [-23.5613, -46.6565] },
    caminho: [
      [-23.4810, -46.6010],
      [-23.5050, -46.6200],
      [-23.5300, -46.6350],
      [-23.5500, -46.6500],
      [-23.5613, -46.6565],
    ],
    motoristaId: "u4",
    diasSemana: [1, 2, 3, 4, 5],
    horarioIda: "08:00",
    vagas: 4,
    inscritos: ["u8"],
    precoBase: 22,
    km: 14.2,
  },
  {
    id: "r4",
    nome: "Savassi → Pampulha (UFMG)",
    cidade: "Belo Horizonte",
    origem: { label: "Savassi", coord: [-19.9387, -43.9357] },
    destino: { label: "UFMG · Pampulha", coord: [-19.8702, -43.9690] },
    caminho: [
      [-19.9387, -43.9357],
      [-19.9200, -43.9450],
      [-19.9000, -43.9550],
      [-19.8850, -43.9620],
      [-19.8702, -43.9690],
    ],
    motoristaId: "u4",
    diasSemana: [1, 3, 5],
    horarioIda: "07:30",
    vagas: 3,
    inscritos: ["u7"],
    precoBase: 14,
    km: 9.1,
  },
  {
    id: "r5",
    nome: "Vila Mariana → Berrini",
    cidade: "São Paulo",
    origem: { label: "Vila Mariana", coord: [-23.5876, -46.6342] },
    destino: { label: "Berrini · WTC", coord: [-23.6116, -46.6960] },
    caminho: [
      [-23.5876, -46.6342],
      [-23.5950, -46.6500],
      [-23.6020, -46.6700],
      [-23.6080, -46.6850],
      [-23.6116, -46.6960],
    ],
    motoristaId: "u2",
    diasSemana: [1, 2, 3, 4, 5],
    horarioIda: "08:15",
    vagas: 4,
    inscritos: [],
    precoBase: 19,
    km: 8.6,
  },
  {
    id: "r6",
    nome: "Sousas → UNICAMP",
    cidade: "Campinas",
    origem: { label: "Sousas · Centro", coord: [-22.8786, -46.9990] },
    destino: { label: "UNICAMP · Portaria 2", coord: [-22.8197, -47.0656] },
    caminho: [
      [-22.8786, -46.9990],
      [-22.8650, -47.0150],
      [-22.8500, -47.0350],
      [-22.8350, -47.0500],
      [-22.8197, -47.0656],
    ],
    motoristaId: "u3",
    diasSemana: [2, 4],
    horarioIda: "07:50",
    vagas: 3,
    inscritos: [],
    precoBase: 16,
    km: 11.2,
  },
];

export const getRota = (id: string) => rotas.find((r) => r.id === id);

// Quanto cada passageiro paga conforme vagas ocupadas. Motorista mantém 92% (taxa app 8%).
export function calcDivisao(rota: Rota, ocupadas: number) {
  const o = Math.max(1, Math.min(ocupadas, rota.vagas));
  // O preço da rota cheia é precoBase * vagas / 1.6  (gera economia evidente)
  const totalRota = rota.precoBase * 1.4;
  const porPassageiro = +(totalRota / o).toFixed(2);
  const ganhoMotorista = +(porPassageiro * o * 0.92).toFixed(2);
  return { porPassageiro, ganhoMotorista, totalRota: +totalRota.toFixed(2) };
}

// ---------- Carteira ----------
export const saldoAtual = 87.4;

export const transacoes: Transacao[] = [
  { id: "t1", tipo: "carona", descricao: "Centro → UNICAMP · Lucas A.", valor: -6.30, data: hojeMenos(0, 8), rotaId: "r1" },
  { id: "t2", tipo: "carona", descricao: "UNICAMP → Centro · Lucas A.", valor: -6.30, data: hojeMenos(0, 18), rotaId: "r1" },
  { id: "t3", tipo: "recarga", descricao: "Recarga via Pix", valor: 50.00, data: hojeMenos(2, 12) },
  { id: "t4", tipo: "carona", descricao: "Centro → UNICAMP · Lucas A.", valor: -6.30, data: hojeMenos(1, 8), rotaId: "r1" },
  { id: "t5", tipo: "penalizacao", descricao: "Falta sem aviso · qua 17/04", valor: -3.00, data: hojeMenos(3, 9) },
  { id: "t6", tipo: "repasse", descricao: "Repasse semanal · 4 caronas", valor: 28.40, data: hojeMenos(4, 20) },
  { id: "t7", tipo: "carona", descricao: "Centro → UNICAMP · Lucas A.", valor: -6.30, data: hojeMenos(5, 8), rotaId: "r1" },
  { id: "t8", tipo: "recarga", descricao: "Recarga via Pix", valor: 30.00, data: hojeMenos(7, 11) },
  { id: "t9", tipo: "carona", descricao: "Pinheiros → USP · Marina C.", valor: -5.00, data: hojeMenos(8, 7), rotaId: "r2" },
  { id: "t10", tipo: "carona", descricao: "Centro → UNICAMP · Lucas A.", valor: -6.30, data: hojeMenos(9, 8), rotaId: "r1" },
  { id: "t11", tipo: "carona", descricao: "Centro → UNICAMP · Lucas A.", valor: -6.30, data: hojeMenos(10, 8), rotaId: "r1" },
  { id: "t12", tipo: "carona", descricao: "Centro → UNICAMP · Lucas A.", valor: -6.30, data: hojeMenos(12, 8), rotaId: "r1" },
];

function hojeMenos(dias: number, hora: number) {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  d.setHours(hora, Math.floor(Math.random() * 50), 0, 0);
  return d.toISOString();
}

// ---------- Ganhos (motorista) ----------
export const ganhosMes = {
  total: 612.40,
  combustivelRecuperado: 287.00,
  caronasFeitas: 38,
  semanal: [128, 156, 142, 186],
  vsUberComum: 412.0, // economia que passageiros tiveram total
};

// ---------- Próxima carona (sempre 23min no futuro) ----------
export function proximaCarona() {
  const r = rotas[0];
  const agora = new Date();
  const partida = new Date(agora.getTime() + 23 * 60 * 1000);
  return {
    rota: r,
    motorista: getPessoa(r.motoristaId),
    horario: partida,
    minutosFaltando: 23,
    valor: calcDivisao(r, r.inscritos.length).porPassageiro,
    ocupadas: r.inscritos.length,
  };
}

// ---------- Semana ----------
export const semanaCaronas = [
  { dia: "Seg", data: "21/04", rotaId: "r1", status: "feita" as const, valor: 6.30 },
  { dia: "Ter", data: "22/04", rotaId: "r1", status: "feita" as const, valor: 6.30 },
  { dia: "Qua", data: "23/04", rotaId: "r1", status: "substituto" as const, valor: 6.30 },
  { dia: "Qui", data: "24/04", rotaId: "r1", status: "agendada" as const, valor: 6.30 },
  { dia: "Sex", data: "25/04", rotaId: "r1", status: "agendada" as const, valor: 6.30 },
];

// ---------- Chat ----------
export const mensagens: ChatMsg[] = [
  { id: "m1", rotaId: "r1", autorId: "u2", texto: "Bom dia, galera. Saindo em 5 min do Cambuí.", ts: hojeMenos(0, 7) },
  { id: "m2", rotaId: "r1", autorId: "u5", texto: "Tô descendo pra te encontrar.", ts: hojeMenos(0, 7) },
  { id: "m3", rotaId: "r1", autorId: "sistema", texto: "Carona iniciada · Lucas Andrade no comando", ts: hojeMenos(0, 7) },
  { id: "m4", rotaId: "r1", autorId: "u6", texto: "Trânsito feio na Norte-Sul hj.", ts: hojeMenos(0, 7) },
  { id: "m5", rotaId: "r1", autorId: "u2", texto: "Tô indo pelo D. Pedro, melhor.", ts: hojeMenos(0, 8) },
  { id: "m6", rotaId: "r1", autorId: "sistema", texto: "Chegada confirmada na UNICAMP · 8h31", ts: hojeMenos(0, 8) },
  { id: "m7", rotaId: "r1", autorId: "u1", texto: "Valeu, Lucas! Amanhã o mesmo horário?", ts: hojeMenos(0, 9) },
  { id: "m8", rotaId: "r1", autorId: "u2", texto: "Mesma coisa. 7h42 na esquina.", ts: hojeMenos(0, 9) },
];

export const contatoEmergencia = {
  nome: "Maria Souza",
  relacao: "Mãe",
  telefone: "(19) 9****-1234",
};

export const diasSemanaLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export const formatBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const formatHora = (d: Date | string) => {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
};

export const formatData = (d: Date | string) => {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
};