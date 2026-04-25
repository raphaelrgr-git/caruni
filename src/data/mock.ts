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
  uni: "UDESC Joinville · Eng. Mecânica",
  desde: "Mar 2024",
  carro: { modelo: "VW Polo 2020", cor: "Prata", placa: "QHB-2A47" },
  cor: "var(--primary)",
};

export const pessoas: Person[] = [
  eu,
  { id: "u2", nome: "Lucas Andrade", iniciais: "LA", presenca: 98, avaliacao: 4.9, cnhVerificada: true, uni: "UDESC · CCT", desde: "Jan 2024", carro: { modelo: "Honda Fit 2019", cor: "Branco", placa: "MJG-9H12" }, cor: "oklch(0.78 0.16 65)" },
  { id: "u3", nome: "Marina Costa", iniciais: "MC", presenca: 92, avaliacao: 4.7, cnhVerificada: true, uni: "UNIVILLE · Direito", carro: { modelo: "Hyundai HB20 2021", cor: "Cinza", placa: "PSK-3M88" }, cor: "oklch(0.65 0.18 320)" },
  { id: "u4", nome: "Rafael Tanaka", iniciais: "RT", presenca: 88, avaliacao: 4.6, cnhVerificada: true, uni: "IFSC Joinville · Mecatrônica", carro: { modelo: "Renault Kwid 2022", cor: "Vermelho", placa: "RJB-7Z21" }, cor: "oklch(0.7 0.15 200)" },
  { id: "u5", nome: "Beatriz Lima", iniciais: "BL", presenca: 94, avaliacao: 4.8, uni: "UNIVILLE · Letras", cor: "oklch(0.62 0.18 45)" },
  { id: "u6", nome: "Pedro Henrique", iniciais: "PH", presenca: 90, avaliacao: 4.5, uni: "UDESC · Eng. Civil", cor: "oklch(0.55 0.14 165)" },
  { id: "u7", nome: "Júlia Mendes", iniciais: "JM", presenca: 99, avaliacao: 5.0, uni: "UNIVILLE · Medicina", cor: "oklch(0.86 0.21 130)" },
  { id: "u8", nome: "Gabriel Souza", iniciais: "GS", presenca: 76, avaliacao: 4.2, uni: "UDESC · CCT", cor: "oklch(0.72 0.17 70)" },
  { id: "u9", nome: "Camila Rocha", iniciais: "CR", presenca: 95, avaliacao: 4.9, uni: "UNISOCIESC · Psicologia", cor: "oklch(0.42 0.09 180)" },
  { id: "u10", nome: "Thiago Almeida", iniciais: "TA", presenca: 87, avaliacao: 4.4, uni: "IFSC · Eletrotécnica", cor: "oklch(0.65 0.18 320)" },
];

export const getPessoa = (id: string) => pessoas.find((p) => p.id === id) ?? eu;

// ---------- Rotas (coordenadas reais de Joinville/SC) ----------
// precoBase calibrado para média de R$ 3,50 por passageiro com carro cheio.
// Fórmula: porPassageiro = (precoBase * 1.4) / vagas. Com precoBase=10 e vagas=4 → R$3,50.
export const rotas: Rota[] = [
  {
    id: "r1",
    nome: "Centro → UDESC (Bom Retiro)",
    cidade: "Joinville",
    origem: { label: "Centro · Praça Nereu Ramos", coord: [-26.3045, -48.8487] },
    destino: { label: "UDESC · CCT Bom Retiro", coord: [-26.2906, -48.8793] },
    caminho: [
      [-26.3045, -48.8487],
      [-26.3010, -48.8560],
      [-26.2980, -48.8640],
      [-26.2955, -48.8710],
      [-26.2930, -48.8760],
      [-26.2906, -48.8793],
    ],
    motoristaId: "u2",
    diasSemana: [1, 2, 3, 4, 5],
    horarioIda: "07:30",
    vagas: 4,
    inscritos: ["u1", "u5", "u6"],
    precoBase: 10,
    km: 5.2,
  },
  {
    id: "r2",
    nome: "América → UNIVILLE (Bom Retiro)",
    cidade: "Joinville",
    origem: { label: "América · Rua Blumenau", coord: [-26.2955, -48.8420] },
    destino: { label: "UNIVILLE · Bloco A", coord: [-26.2625, -48.8710] },
    caminho: [
      [-26.2955, -48.8420],
      [-26.2880, -48.8500],
      [-26.2800, -48.8580],
      [-26.2720, -48.8650],
      [-26.2625, -48.8710],
    ],
    motoristaId: "u3",
    diasSemana: [1, 2, 3, 4, 5],
    horarioIda: "07:15",
    vagas: 4,
    inscritos: ["u9", "u7"],
    precoBase: 11,
    km: 6.4,
  },
  {
    id: "r3",
    nome: "Glória → IFSC Joinville",
    cidade: "Joinville",
    origem: { label: "Glória · Av. Santos Dumont", coord: [-26.2740, -48.8390] },
    destino: { label: "IFSC · Câmpus Joinville", coord: [-26.2417, -48.8635] },
    caminho: [
      [-26.2740, -48.8390],
      [-26.2680, -48.8460],
      [-26.2600, -48.8520],
      [-26.2510, -48.8580],
      [-26.2417, -48.8635],
    ],
    motoristaId: "u4",
    diasSemana: [1, 2, 3, 4, 5],
    horarioIda: "07:45",
    vagas: 4,
    inscritos: ["u8"],
    precoBase: 11,
    km: 5.8,
  },
  {
    id: "r4",
    nome: "Costa e Silva → UNIVILLE",
    cidade: "Joinville",
    origem: { label: "Costa e Silva · Av. Iririú", coord: [-26.2650, -48.8120] },
    destino: { label: "UNIVILLE · Portaria Norte", coord: [-26.2618, -48.8702] },
    caminho: [
      [-26.2650, -48.8120],
      [-26.2640, -48.8260],
      [-26.2630, -48.8400],
      [-26.2625, -48.8540],
      [-26.2618, -48.8702],
    ],
    motoristaId: "u4",
    diasSemana: [1, 3, 5],
    horarioIda: "07:20",
    vagas: 3,
    inscritos: ["u7"],
    precoBase: 8,
    km: 6.1,
  },
  {
    id: "r5",
    nome: "Saguaçu → Distrito Industrial (Perini)",
    cidade: "Joinville",
    origem: { label: "Saguaçu · Av. Beira Rio", coord: [-26.2810, -48.8230] },
    destino: { label: "Perini Business Park", coord: [-26.2358, -48.8598] },
    caminho: [
      [-26.2810, -48.8230],
      [-26.2700, -48.8330],
      [-26.2580, -48.8430],
      [-26.2470, -48.8520],
      [-26.2358, -48.8598],
    ],
    motoristaId: "u2",
    diasSemana: [1, 2, 3, 4, 5],
    horarioIda: "07:00",
    vagas: 4,
    inscritos: [],
    precoBase: 12,
    km: 7.5,
  },
  {
    id: "r6",
    nome: "Pirabeiraba → Centro",
    cidade: "Joinville",
    origem: { label: "Pirabeiraba · Centro", coord: [-26.2017, -48.9131] },
    destino: { label: "Centro · Rua do Príncipe", coord: [-26.3050, -48.8462] },
    caminho: [
      [-26.2017, -48.9131],
      [-26.2200, -48.9000],
      [-26.2450, -48.8850],
      [-26.2700, -48.8700],
      [-26.2900, -48.8580],
      [-26.3050, -48.8462],
    ],
    motoristaId: "u3",
    diasSemana: [1, 2, 3, 4, 5],
    horarioIda: "06:50",
    vagas: 4,
    inscritos: [],
    precoBase: 14,
    km: 13.2,
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
export const saldoAtual = 42.80;

export const transacoes: Transacao[] = [
  { id: "t1", tipo: "carona", descricao: "Centro → UDESC · Lucas A.", valor: -3.50, data: hojeMenos(0, 8), rotaId: "r1" },
  { id: "t2", tipo: "carona", descricao: "UDESC → Centro · Lucas A.", valor: -3.50, data: hojeMenos(0, 18), rotaId: "r1" },
  { id: "t3", tipo: "recarga", descricao: "Recarga via Pix", valor: 30.00, data: hojeMenos(2, 12) },
  { id: "t4", tipo: "carona", descricao: "Centro → UDESC · Lucas A.", valor: -3.50, data: hojeMenos(1, 8), rotaId: "r1" },
  { id: "t5", tipo: "penalizacao", descricao: "Falta sem aviso · qua 17/04", valor: -2.00, data: hojeMenos(3, 9) },
  { id: "t6", tipo: "repasse", descricao: "Repasse semanal · 4 caronas", valor: 14.20, data: hojeMenos(4, 20) },
  { id: "t7", tipo: "carona", descricao: "Centro → UDESC · Lucas A.", valor: -3.50, data: hojeMenos(5, 8), rotaId: "r1" },
  { id: "t8", tipo: "recarga", descricao: "Recarga via Pix", valor: 20.00, data: hojeMenos(7, 11) },
  { id: "t9", tipo: "carona", descricao: "América → UNIVILLE · Marina C.", valor: -3.85, data: hojeMenos(8, 7), rotaId: "r2" },
  { id: "t10", tipo: "carona", descricao: "Centro → UDESC · Lucas A.", valor: -3.50, data: hojeMenos(9, 8), rotaId: "r1" },
  { id: "t11", tipo: "carona", descricao: "Centro → UDESC · Lucas A.", valor: -3.50, data: hojeMenos(10, 8), rotaId: "r1" },
  { id: "t12", tipo: "carona", descricao: "Centro → UDESC · Lucas A.", valor: -3.50, data: hojeMenos(12, 8), rotaId: "r1" },
];

function hojeMenos(dias: number, hora: number) {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  d.setHours(hora, Math.floor(Math.random() * 50), 0, 0);
  return d.toISOString();
}

// ---------- Ganhos (motorista) ----------
// Realista para Joinville: ~R$3,50/passageiro × 3 pass × 2 trechos × 22 dias úteis ≈ R$ 462
export const ganhosMes = {
  total: 462.00,
  combustivelRecuperado: 218.00,
  caronasFeitas: 44,
  semanal: [98, 124, 110, 130],
  vsUberComum: 364.0, // economia total que passageiros tiveram no mês
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
  { dia: "Seg", data: "21/04", rotaId: "r1", status: "feita" as const, valor: 3.50 },
  { dia: "Ter", data: "22/04", rotaId: "r1", status: "feita" as const, valor: 3.50 },
  { dia: "Qua", data: "23/04", rotaId: "r1", status: "substituto" as const, valor: 3.50 },
  { dia: "Qui", data: "24/04", rotaId: "r1", status: "agendada" as const, valor: 3.50 },
  { dia: "Sex", data: "25/04", rotaId: "r1", status: "agendada" as const, valor: 3.50 },
];

// ---------- Chat ----------
export const mensagens: ChatMsg[] = [
  { id: "m1", rotaId: "r1", autorId: "u2", texto: "Bom dia, galera. Saindo em 5 min do Centro.", ts: hojeMenos(0, 7) },
  { id: "m2", rotaId: "r1", autorId: "u5", texto: "Tô descendo pra te encontrar na Nereu Ramos.", ts: hojeMenos(0, 7) },
  { id: "m3", rotaId: "r1", autorId: "sistema", texto: "Carona iniciada · Lucas Andrade no comando", ts: hojeMenos(0, 7) },
  { id: "m4", rotaId: "r1", autorId: "u6", texto: "Trânsito feio na Beira Rio hj.", ts: hojeMenos(0, 7) },
  { id: "m5", rotaId: "r1", autorId: "u2", texto: "Vou pela Visconde de Taunay, melhor.", ts: hojeMenos(0, 8) },
  { id: "m6", rotaId: "r1", autorId: "sistema", texto: "Chegada confirmada na UDESC · 7h54", ts: hojeMenos(0, 8) },
  { id: "m7", rotaId: "r1", autorId: "u1", texto: "Valeu, Lucas! Amanhã o mesmo horário?", ts: hojeMenos(0, 9) },
  { id: "m8", rotaId: "r1", autorId: "u2", texto: "Mesma coisa. 7h30 na praça.", ts: hojeMenos(0, 9) },
];

export const contatoEmergencia = {
  nome: "Maria Souza",
  relacao: "Mãe",
  telefone: "(47) 9****-1234",
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