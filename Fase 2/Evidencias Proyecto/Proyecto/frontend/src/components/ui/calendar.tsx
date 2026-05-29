"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "./utils";
import { buttonVariants } from "./button";

type CalendarMode = "single"; // extend later if needed

interface CalendarProps {
  mode?: CalendarMode;
  selected?: Date;
  onSelect?: (date?: Date) => void;
  disabled?: (date: Date) => boolean;
  className?: string;
  showOutsideDays?: boolean;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getMonthGrid(currentMonth: Date, showOutsideDays: boolean) {
  // Returns a 6x7 matrix of dates (weeks x days)
  const first = startOfMonth(currentMonth);
  const last = endOfMonth(currentMonth);
  const firstWeekday = (first.getDay() + 6) % 7; // make Monday=0
  const daysInMonth = last.getDate();

  const grid: Date[] = [];

  // Previous month filler
  if (showOutsideDays) {
    for (let i = 0; i < firstWeekday; i++) {
      const d = new Date(first);
      d.setDate(d.getDate() - (firstWeekday - i));
      grid.push(d);
    }
  } else {
    for (let i = 0; i < firstWeekday; i++) grid.push(new Date(NaN));
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    grid.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
  }

  // Next month filler to reach 42 cells
  const remaining = 42 - grid.length;
  if (remaining > 0) {
    if (showOutsideDays) {
      const next = addMonths(currentMonth, 1);
      for (let i = 1; i <= remaining; i++) {
        grid.push(new Date(next.getFullYear(), next.getMonth(), i));
      }
    } else {
      for (let i = 0; i < remaining; i++) grid.push(new Date(NaN));
    }
  }

  // Chunk into weeks
  const weeks: Date[][] = [];
  for (let i = 0; i < 6; i++) {
    weeks.push(grid.slice(i * 7, i * 7 + 7));
  }
  return weeks;
}

function Calendar({
  className,
  showOutsideDays = true,
  selected,
  onSelect,
  disabled,
}: CalendarProps) {
  const [month, setMonth] = React.useState<Date>(() => startOfMonth(selected ?? new Date()));

  React.useEffect(() => {
    if (selected) {
      setMonth(startOfMonth(selected));
    }
  }, [selected]);

  const weeks = React.useMemo(() => getMonthGrid(month, showOutsideDays), [month, showOutsideDays]);

  const weekdayLabels = ["L", "M", "X", "J", "V", "S", "D"]; // Monday first

  const goPrev = () => setMonth((m) => addMonths(m, -1));
  const goNext = () => setMonth((m) => addMonths(m, 1));

  const monthLabel = month.toLocaleDateString("es-ES", { month: "long", year: "numeric" });

  return (
    <div className={cn("p-3", className)}>
      <div className="flex justify-center pt-1 relative items-center w-full mb-2">
        <button
          type="button"
          onClick={goPrev}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "size-7 bg-transparent p-0 opacity-70 hover:opacity-100 absolute left-1",
          )}
          aria-label="Mes anterior"
        >
          <ChevronLeft className="size-4" />
        </button>
        <div className="text-sm font-medium capitalize">{monthLabel}</div>
        <button
          type="button"
          onClick={goNext}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "size-7 bg-transparent p-0 opacity-70 hover:opacity-100 absolute right-1",
          )}
          aria-label="Mes siguiente"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="w-full">
        <div className="flex text-muted-foreground">
          {weekdayLabels.map((wl) => (
            <div key={wl} className="rounded-md w-8 font-normal text-[0.8rem] text-center">
              {wl}
            </div>
          ))}
        </div>

        <div className="mt-2">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex w-full">
              {week.map((day, di) => {
                const isInvalid = isNaN(day.getTime());
                const isOutside = !isInvalid && day.getMonth() !== month.getMonth();
                const isDisabled = isInvalid || (!!disabled && disabled(day));
                const isSelected = !!selected && !isInvalid && isSameDay(day, selected);

                const baseBtn = cn(
                  buttonVariants({ variant: "ghost" }),
                  "size-8 p-0 font-normal aria-selected:opacity-100",
                );

                const stateClasses = cn(
                  isSelected && "bg-primary text-primary-foreground hover:bg-primary",
                  isOutside && "text-muted-foreground",
                  isDisabled && "text-muted-foreground opacity-50",
                );

                const label = isInvalid ? "" : String(day.getDate());

                return (
                  <div key={di} className="relative p-0 text-center text-sm">
                    <button
                      type="button"
                      disabled={isDisabled}
                      aria-selected={isSelected}
                      onClick={() => !isDisabled && onSelect?.(day)}
                      className={cn(baseBtn, stateClasses)}
                    >
                      {label}
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export { Calendar };
