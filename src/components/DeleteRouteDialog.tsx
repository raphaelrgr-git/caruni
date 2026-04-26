import * as React from "react";
import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function DeleteRouteDialog({
  routeName,
  onConfirm,
  disabled,
  triggerLabel = "Excluir rota",
  triggerClassName = "",
}: {
  routeName: string;
  onConfirm(): void;
  disabled?: boolean;
  triggerLabel?: string;
  triggerClassName?: string;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button
          disabled={disabled}
          className={`inline-flex items-center gap-1.5 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs font-medium text-destructive disabled:opacity-50 ${triggerClassName}`}
        >
          <Trash2 size={13} /> {triggerLabel}
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md rounded-3xl border-border bg-surface p-0">
        <div className="p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl text-foreground">
              Excluir rota
            </AlertDialogTitle>
            <AlertDialogDescription className="mt-2 text-sm leading-relaxed text-muted-foreground">
              A rota <span className="font-semibold text-foreground">{routeName}</span> será removida
              com bookings ativos, chat e corridas futuras. Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="mt-5 rounded-2xl border border-border bg-surface-2/80 p-4">
            <p className="label-cockpit">Impacto</p>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
              <li>Cancelamento das viagens futuras ligadas à rota</li>
              <li>Remoção do chat da rota</li>
              <li>Remoção das reservas associadas</li>
            </ul>
          </div>

          <AlertDialogFooter className="mt-6">
            <AlertDialogCancel className="rounded-full">Manter rota</AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirm}
              className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir agora
            </AlertDialogAction>
          </AlertDialogFooter>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
