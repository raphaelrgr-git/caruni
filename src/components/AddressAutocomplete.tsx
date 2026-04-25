import * as React from "react";
import { geocodeAddress, type GeocodeSuggestion } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface AddressAutocompleteProps {
  label: string;
  value: GeocodeSuggestion | null;
  onChange: (place: GeocodeSuggestion) => void;
  placeholder?: string;
  className?: string;
}

export function AddressAutocomplete({
  label,
  value,
  onChange,
  placeholder = "Digite um endereço…",
  className,
}: AddressAutocompleteProps) {
  const [query, setQuery] = React.useState(value?.label ?? "");
  const [suggestions, setSuggestions] = React.useState<GeocodeSuggestion[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  // Close dropdown on outside click
  React.useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Sync input when external value changes
  React.useEffect(() => {
    if (value) setQuery(value.label);
  }, [value]);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setQuery(q);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (q.length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await geocodeAddress(q);
        setSuggestions(results);
        setOpen(results.length > 0);
      } catch {
        setSuggestions([]);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }, 400);
  }

  function handleSelect(place: GeocodeSuggestion) {
    setQuery(place.label);
    setSuggestions([]);
    setOpen(false);
    onChange(place);
  }

  const id = React.useId();

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative mt-1.5">
        <Input
          id={id}
          value={query}
          onChange={handleInputChange}
          placeholder={placeholder}
          autoComplete="off"
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            …
          </span>
        )}
      </div>

      {open && (
        <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-popover shadow-md">
          {suggestions.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">
              Nenhum endereço encontrado
            </li>
          ) : (
            suggestions.map((s, i) => (
              <li key={i}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(s);
                  }}
                >
                  {s.label.length > 70 ? s.label.slice(0, 70) + "…" : s.label}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
