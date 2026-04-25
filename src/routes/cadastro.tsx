import { createFileRoute } from "@tanstack/react-router";
import { CadastroPage } from "@/features/auth/CadastroPage";

export const Route = createFileRoute("/cadastro")({
  head: () => ({ meta: [{ title: "CarUni — Criar conta" }] }),
  component: CadastroPage,
});
