export function formatRideStatus(status: string) {
  switch (status) {
    case "SCHEDULED":
      return "Agendada";
    case "CONFIRMED":
      return "Confirmada";
    case "ACTIVE":
      return "Em andamento";
    case "DISPUTE":
      return "Em disputa";
    case "CANCELLED":
      return "Cancelada";
    default:
      return status;
  }
}

export function formatBookingStatus(status: string) {
  switch (status) {
    case "ACTIVE":
      return "Ativa";
    case "PENDING_APPROVAL":
      return "Aguardando aprovação";
    case "CANCELLED":
      return "Cancelada";
    default:
      return status;
  }
}

export function formatBookingType(type: string) {
  switch (type) {
    case "RECORRENTE":
      return "Fixa";
    case "AVULSO":
      return "Avulsa";
    default:
      return type;
  }
}

export function formatRelativeTimePt(dateLike: string | Date) {
  const date = typeof dateLike === "string" ? new Date(dateLike) : dateLike;
  const diffMs = date.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / 60_000);
  const rtf = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });

  const ranges: Array<[number, Intl.RelativeTimeFormatUnit, number]> = [
    [60, "minute", 1],
    [24, "hour", 60],
    [7, "day", 60 * 24],
    [4.34524, "week", 60 * 24 * 7],
    [12, "month", 60 * 24 * 30],
    [Infinity, "year", 60 * 24 * 365],
  ];

  let value = diffMinutes;
  for (const [threshold, unit, divisor] of ranges) {
    value = Math.round(diffMinutes / divisor);
    if (Math.abs(value) < threshold) {
      return rtf.format(value, unit);
    }
  }

  return rtf.format(0, "day");
}

export function formatNegotiationStatus(status: string) {
  switch (status) {
    case "PENDING":
      return "Aguardando resposta";
    case "COUNTERED":
      return "Contraproposta recebida";
    case "ACCEPTED":
      return "Aceita";
    case "REJECTED":
      return "Recusada";
    case "EXPIRED":
      return "Expirada";
    case "CANCELLED":
      return "Cancelada";
    default:
      return status;
  }
}
