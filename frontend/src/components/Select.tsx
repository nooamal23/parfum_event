'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  hasError?: boolean;
  id?: string;
}

// Enlève les caractères non alphanumériques en tête de chaîne (ex. l'emoji
// drapeau 🇹🇳 devant "Tunisie") pour que la recherche au clavier ("taper T
// pour sauter à Tunisie") ignore le drapeau et compare le vrai nom.
function normalizeForSearch(label: string): string {
  return label.replace(/^[^\p{L}\p{N}]+/u, '').toLowerCase();
}

export default function Select({
  value,
  onChange,
  options,
  placeholder = 'Sélectionnez…',
  disabled,
  hasError,
  id,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  // Mémorise les lettres tapées récemment pour la recherche au clavier
  // (ex. taper "tu" rapidement doit chercher "Tunisie", pas repartir de zéro
  // à chaque lettre). Remis à zéro après 600ms d'inactivité.
  const typeaheadRef = useRef<{ buffer: string; timeoutId: ReturnType<typeof setTimeout> | null }>({
    buffer: '',
    timeoutId: null,
  });

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (open) {
      const el = listRef.current?.children[highlighted] as HTMLElement | undefined;
      el?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlighted, open]);

  function openWithHighlightOnSelected() {
    const idx = options.findIndex((o) => o.value === value);
    setHighlighted(idx >= 0 ? idx : 0);
    setOpen(true);
  }

  function commitSelection(idx: number) {
    const opt = options[idx];
    if (opt) onChange(opt.value);
  }

  function handleTypeahead(char: string) {
    const buffer = (typeaheadRef.current.buffer + char).toLowerCase();
    typeaheadRef.current.buffer = buffer;
    if (typeaheadRef.current.timeoutId) clearTimeout(typeaheadRef.current.timeoutId);
    typeaheadRef.current.timeoutId = setTimeout(() => {
      typeaheadRef.current.buffer = '';
    }, 600);

    const idx = options.findIndex((o) => normalizeForSearch(o.label).startsWith(buffer));
    if (idx < 0) return;

    if (open) {
      // Menu ouvert : on déplace juste le surlignage, l'utilisateur confirme avec Entrée ou un clic.
      setHighlighted(idx);
    } else {
      // Menu fermé : sélection directe, comme le ferait un <select> natif.
      onChange(options[idx].value);
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (disabled) return;

    if (!open && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown')) {
      e.preventDefault();
      openWithHighlightOnSelected();
      return;
    }

    // Recherche par lettre : fonctionne menu ouvert OU fermé.
    if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      handleTypeahead(e.key);
      return;
    }

    if (!open) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, options.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      commitSelection(highlighted);
      setOpen(false);
    } else if (e.key === 'Escape' || e.key === 'Tab') {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openWithHighlightOnSelected())}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex w-full items-center justify-between rounded-lg border bg-surface px-4 py-2.5 text-left text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:bg-lavender-50 disabled:text-muted ${
          hasError ? 'border-danger-border' : 'border-lavender-200'
        } ${selected ? 'text-ink' : 'text-muted'}`}
      >
        <span className="truncate">{selected ? selected.label : placeholder}</span>
        <svg className="ml-2 h-4 w-4 flex-shrink-0 text-muted" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <ul
          ref={listRef}
          role="listbox"
          className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-lavender-200 bg-surface py-1 text-sm shadow-card"
        >
          {options.length === 0 && <li className="px-4 py-2 text-muted">Aucune option</li>}
          {options.map((opt, idx) => (
            <li
              key={opt.value}
              role="option"
              aria-selected={opt.value === value}
              onMouseEnter={() => setHighlighted(idx)}
              // onMouseDown (avec preventDefault) plutôt que onClick : évite que le
              // bouton perde le focus une fraction de seconde avant que le clic ne
              // soit traité, ce qui pouvait laisser la liste ouverte de façon
              // incohérente selon le navigateur. stopPropagation empêche aussi le
              // gestionnaire "clic en dehors" (document mousedown) d'interférer.
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onChange(opt.value);
                setOpen(false);
              }}
              className={`cursor-pointer px-4 py-2 ${
                opt.value === value
                  ? 'bg-primary text-surface'
                  : idx === highlighted
                  ? 'bg-lavender-100 text-ink'
                  : 'text-ink'
              }`}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}