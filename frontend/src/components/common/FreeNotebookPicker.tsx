'use client';

import { useEffect, useState } from 'react';
import { imgUrl } from '@/lib/api';
import { Product } from '@/types';
import { fetchFreeNotebooks } from '@/lib/notebookOffer';

interface FreeNotebookPickerProps {
  selectedId?: string;
  onPick: (product: Product) => void;
  // Optional preloaded list so callers (e.g. landing) can avoid a second fetch.
  notebooks?: Product[];
  compact?: boolean;
}

const GREEN = '#1B6B1B';
const GOLD = '#D4AF37';

export default function FreeNotebookPicker({
  selectedId,
  onPick,
  notebooks,
  compact = false,
}: FreeNotebookPickerProps) {
  const [list, setList] = useState<Product[]>(notebooks ?? []);
  const [loading, setLoading] = useState(!notebooks);

  useEffect(() => {
    if (notebooks && notebooks.length) {
      setList(notebooks);
      setLoading(false);
      return;
    }
    let active = true;
    fetchFreeNotebooks().then((nbs) => {
      if (active) {
        setList(nbs);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [notebooks]);

  if (loading) {
    return (
      <div style={{ padding: '14px 16px', color: '#4A6B4A', fontFamily: "'Hind Siliguri', sans-serif", fontSize: 14 }}>
        নোটবুক লোড হচ্ছে...
      </div>
    );
  }
  if (list.length === 0) return null;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${list.length}, minmax(0, 1fr))`,
        gap: compact ? 8 : 12,
      }}
    >
      {list.map((p) => {
        const selected = selectedId === p._id;
        const src = imgUrl(p.images?.[0]);
        return (
          <button
            key={p._id}
            type="button"
            onClick={() => onPick(p)}
            aria-pressed={selected}
            style={{
              position: 'relative',
              border: selected ? `2px solid ${GREEN}` : '1.5px solid #C8E6C9',
              background: selected ? '#E8F5E9' : '#fff',
              borderRadius: 14,
              padding: compact ? 8 : 10,
              cursor: 'pointer',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              transition: 'border-color .15s ease, background .15s ease',
              fontFamily: "'Hind Siliguri', sans-serif",
            }}
          >
            {selected && (
              <span
                style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  width: 22,
                  height: 22,
                  borderRadius: 999,
                  background: GREEN,
                  color: '#fff',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                ✓
              </span>
            )}
            <div
              style={{
                width: '100%',
                aspectRatio: '3/4',
                borderRadius: 8,
                overflow: 'hidden',
                background: 'linear-gradient(160deg, #E8F5E9, #C8E6C9)',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              {src ? (
                <img src={src} alt={p.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: 28 }}>⚽</span>
              )}
            </div>
            <span
              style={{
                fontSize: compact ? 11 : 12.5,
                fontWeight: 600,
                color: '#071A07',
                lineHeight: 1.25,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {p.name}
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: selected ? GREEN : GOLD,
              }}
            >
              {selected ? 'নির্বাচিত ✓' : 'ফ্রি বেছে নিন'}
            </span>
          </button>
        );
      })}
    </div>
  );
}
