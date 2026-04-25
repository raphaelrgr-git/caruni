import * as React from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Send } from "lucide-react";
import { Avatar } from "@/components/Brand";
import { getPessoa, mensagens, formatHora, eu, type Rota } from "@/data/mock";

export function ChatPage({ rota }: { rota: Rota }) {
  const msgs = mensagens.filter((m) => m.rotaId === rota.id);
  const [draft, setDraft] = React.useState("");

  return (
    <div className="mx-auto flex h-[calc(100vh-7rem)] w-full max-w-3xl flex-col px-4 py-4 lg:px-8 lg:py-6">
      <div className="flex items-center justify-between">
        <Link
          to="/app"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={12} /> Voltar
        </Link>
        <div className="text-right">
          <p className="text-sm font-semibold text-foreground">{rota.nome}</p>
          <p className="text-[10px] text-muted-foreground">{rota.inscritos.length + 1} pessoas</p>
        </div>
      </div>

      <div className="mt-4 flex-1 space-y-3 overflow-y-auto rounded-xl border border-border bg-surface p-4">
        {msgs.map((m) => {
          if (m.autorId === "sistema") {
            return (
              <div key={m.id} className="text-center">
                <span className="num inline-block rounded-full bg-surface-2 px-3 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                  {m.texto}
                </span>
              </div>
            );
          }
          const autor = getPessoa(m.autorId);
          const meu = m.autorId === eu.id;
          return (
            <div key={m.id} className={`flex items-end gap-2 ${meu ? "flex-row-reverse" : ""}`}>
              <Avatar name={autor.nome} color={autor.cor} size={26} iniciais={autor.iniciais} />
              <div
                className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                  meu ? "bg-primary text-primary-foreground" : "bg-surface-2 text-foreground"
                }`}
              >
                {!meu && (
                  <p className="text-[10px] font-medium opacity-70">{autor.nome.split(" ")[0]}</p>
                )}
                <p>{m.texto}</p>
                <p className="num mt-0.5 text-[10px] opacity-60">{formatHora(m.ts)}</p>
              </div>
            </div>
          );
        })}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setDraft("");
        }}
        className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Mensagem para a galera da rota…"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground"
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}
