import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export function AppBackButton({
  fallbackTo,
  label = "Voltar",
  className = "",
}: {
  fallbackTo: string;
  label?: string;
  className?: string;
}) {
  const navigate = useNavigate();

  const handleBack = React.useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
      return;
    }
    void navigate({ to: fallbackTo as never });
  }, [fallbackTo, navigate]);

  return (
    <button
      onClick={handleBack}
      className={`inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground ${className}`}
    >
      <ArrowLeft size={15} /> {label}
    </button>
  );
}
