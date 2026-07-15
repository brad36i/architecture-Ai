'use client';

import { ChevronDown } from 'lucide-react';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';

export interface SortOption<T extends string = string> {
  value: T;
  label: string;
  icon: React.ReactNode;
}

interface SortDropdownProps<T extends string = string> {
  options: SortOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function SortDropdown<T extends string = string>({
  options,
  value,
  onChange,
  className,
}: SortDropdownProps<T>) {
  const current = options.find((o) => o.value === value) ?? options[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='sm' className={cn('h-8 gap-1.5 text-zinc-600', className)}>
          {current.icon}
          {current.label}
          <ChevronDown className='size-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        {options.map((opt) => (
          <DropdownMenuItem key={opt.value} onClick={() => onChange(opt.value as T)}>
            {opt.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
