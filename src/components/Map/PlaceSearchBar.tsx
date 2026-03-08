import { useCallback, useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import usePlaceSearch from '@/hooks/usePlaceSearch';
import type { PlaceResult } from '@/types';

interface PlaceSearchBarProps {
  onPlaceSelect: (place: PlaceResult) => void;
  className?: string;
}

const PlaceSearchBar = ({ onPlaceSelect, className }: PlaceSearchBarProps) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { results, search, clear } = usePlaceSearch();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    return () => clearTimeout(debounceRef.current);
  }, []);

  const handleChange = useCallback((value: string) => {
    setQuery(value);
    clearTimeout(debounceRef.current);
    if (!value.trim()) {
      clear();
      setIsOpen(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      search(value);
      setIsOpen(true);
    }, 300);
  }, [search, clear]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      clearTimeout(debounceRef.current);
      const q = query.trim();
      if (!q) return;
      search(q);
      setIsOpen(true);
    }
  }, [query, search]);

  const handleSelect = useCallback((place: PlaceResult) => {
    onPlaceSelect(place);
    setQuery(place.name);
    setIsOpen(false);
    clear();
  }, [onPlaceSelect, clear]);

  const handleClear = useCallback(() => {
    setQuery('');
    clear();
    setIsOpen(false);
  }, [clear]);

  return (
    <div className={cn('relative w-full', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-black-400" />
        <Input
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="장소를 검색해보세요"
          enterKeyHint="search"
          className="pl-9 pr-9 bg-transparent shadow-none rounded-none border-0 border-b border-black-300 focus-visible:border-primary focus-visible:ring-0 focus-visible:shadow-none"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-black-400 hover:text-black-600"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <ul className="absolute top-full mt-1 w-full bg-white rounded-xl shadow-lg border border-black-300/50 overflow-hidden z-20 max-h-60 overflow-y-auto">
          {results.map((place) => (
            <li key={place.placeId}>
              <button
                onClick={() => handleSelect(place)}
                className="flex flex-col gap-0.5 w-full px-4 py-3 text-left hover:bg-black-100 transition-colors"
              >
                <span className="text-sm font-pretendard-md text-black-800">{place.name}</span>
                <span className="text-xs text-black-400">{place.address}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PlaceSearchBar;
