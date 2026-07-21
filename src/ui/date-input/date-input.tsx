import { Popover, PopoverContent, PopoverTrigger } from "@korapay/react";
import {
  Calendar,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@korapay/react/molecules";
import { CalendarIcon } from "@phosphor-icons/react";
import { forwardRef, useState, type ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

import {
  datesMatch,
  formatDateInputValue,
  parseDateInputValue,
} from "./date-input.utils";

export type DateInputProps = Omit<
  ComponentPropsWithoutRef<typeof InputGroupInput>,
  "onChange" | "value"
> & {
  value: Date | undefined;
  onValueChange: (value: Date | undefined) => void;
  inputClassName?: string;
  triggerAriaLabel?: string;
};

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  function DateInput(
    {
      className,
      inputClassName,
      inputMode = "numeric",
      onKeyDown,
      onValueChange,
      placeholder = "DD/MM/YYYY",
      triggerAriaLabel = "Select date",
      value,
      ...inputProps
    },
    forwardedRef,
  ) {
    const [draft, setDraft] = useState(() => ({
      inputValue: formatDateInputValue(value),
      dateValue: value,
    }));
    const [calendarMonth, setCalendarMonth] = useState(value);
    const [isOpen, setIsOpen] = useState(false);
    const inputValue = datesMatch(draft.dateValue, value)
      ? draft.inputValue
      : formatDateInputValue(value);

    const setOpen = (nextOpen: boolean) => {
      setIsOpen(nextOpen);

      if (nextOpen) {
        setCalendarMonth(value);
      }
    };

    return (
      <InputGroup className={cn("kora:h-14", className)}>
        <InputGroupInput
          {...inputProps}
          ref={forwardedRef}
          value={inputValue}
          placeholder={placeholder}
          inputMode={inputMode}
          className={inputClassName}
          onChange={(event) => {
            const nextInputValue = event.target.value;
            const nextDate = parseDateInputValue(nextInputValue);

            setDraft({ inputValue: nextInputValue, dateValue: nextDate });
            onValueChange(nextDate);

            if (nextDate) {
              setCalendarMonth(nextDate);
            }
          }}
          onKeyDown={(event) => {
            onKeyDown?.(event);

            if (event.defaultPrevented) {
              return;
            }

            if (event.key === "ArrowDown") {
              event.preventDefault();
              setOpen(true);
            }
          }}
        />

        <InputGroupAddon align="inline-end">
          <Popover open={isOpen} onOpenChange={setOpen}>
            <PopoverTrigger
              render={
                <InputGroupButton
                  size="icon-xs"
                  variant="primary-ghost"
                  aria-label={triggerAriaLabel}
                  onMouseDown={(event) => {
                    event.preventDefault();
                  }}
                >
                  <CalendarIcon aria-hidden />
                  <span className="kora:sr-only">{triggerAriaLabel}</span>
                </InputGroupButton>
              }
            />
            <PopoverContent
              className="kora:w-auto kora:overflow-hidden kora:p-0"
              align="end"
              alignOffset={-8}
              sideOffset={10}
            >
              <Calendar
                mode="single"
                selected={value}
                month={calendarMonth}
                onMonthChange={setCalendarMonth}
                onSelect={(nextDate) => {
                  setDraft({
                    inputValue: formatDateInputValue(nextDate),
                    dateValue: nextDate,
                  });
                  setCalendarMonth(nextDate);
                  onValueChange(nextDate);
                  setIsOpen(false);
                }}
              />
            </PopoverContent>
          </Popover>
        </InputGroupAddon>
      </InputGroup>
    );
  },
);
