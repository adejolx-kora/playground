import type { ComponentProps } from "react";

import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxSeparator,
  ComboboxTrigger,
  ComboboxValue,
} from "@korapay/react/combobox";

import { cn } from "@/lib/utils";

export const CommandDropdownRoot = Combobox;
export const CommandDropdownValue = ComboboxValue;
export const CommandDropdownContent = ComboboxContent;
export const CommandDropdownEmpty = ComboboxEmpty;
export const CommandDropdownList = ComboboxList;
export const CommandDropdownItem = ComboboxItem;
export const CommandDropdownGroup = ComboboxGroup;
export const CommandDropdownLabel = ComboboxLabel;
export const CommandDropdownCollection = ComboboxCollection;
export const CommandDropdownSeparator = ComboboxSeparator;

export type CommandDropdownRootProps = ComponentProps<typeof Combobox>;
export type CommandDropdownValueProps = ComponentProps<typeof ComboboxValue>;
export type CommandDropdownContentProps = ComponentProps<
  typeof ComboboxContent
>;
export type CommandDropdownEmptyProps = ComponentProps<typeof ComboboxEmpty>;
export type CommandDropdownListProps = ComponentProps<typeof ComboboxList>;
export type CommandDropdownItemProps = ComponentProps<typeof ComboboxItem>;
export type CommandDropdownGroupProps = ComponentProps<typeof ComboboxGroup>;
export type CommandDropdownLabelProps = ComponentProps<typeof ComboboxLabel>;
export type CommandDropdownCollectionProps = ComponentProps<
  typeof ComboboxCollection
>;
export type CommandDropdownSeparatorProps = ComponentProps<
  typeof ComboboxSeparator
>;

export type CommandDropdownTriggerProps = ComponentProps<
  typeof ComboboxTrigger
>;

export function CommandDropdownTrigger({
  className,
  ...props
}: CommandDropdownTriggerProps) {
  return (
    <ComboboxTrigger
      className={cn(
        "kora:flex kora:w-fit kora:items-center kora:justify-between kora:gap-1.5 kora:rounded-3xs kora:border-sm kora:border-input-border kora:bg-input-background-default kora:py-2 kora:pr-2 kora:pl-2.5 kora:text-sm kora:whitespace-nowrap kora:text-input-text-filled kora:transition-colors kora:outline-none kora:select-none kora:group-data-[invalid=true]/field:border-input-border-error kora:group-data-[invalid=true]/field:text-input-text-error kora:group-data-[invalid=true]/field:ring-surface-error-alpha-subtle kora:hover:border-input-border-hover kora:focus-visible:border-input-border-active kora:focus-visible:ring-[1.5px] kora:focus-visible:ring-input-border-focused kora:focus-visible:ring-offset-1 kora:disabled:cursor-not-allowed kora:disabled:border-input-border kora:disabled:bg-input-background-secondary kora:disabled:text-input-text-disabled kora:disabled:opacity-100 kora:aria-invalid:border-input-border-error kora:aria-invalid:text-input-text-error kora:aria-invalid:ring-surface-error-alpha-subtle kora:data-placeholder:text-input-text-placeholder kora:*:data-[slot=select-value]:line-clamp-1 kora:*:data-[slot=select-value]:flex kora:*:data-[slot=select-value]:items-center kora:*:data-[slot=select-value]:gap-1.5 kora:[&_svg]:pointer-events-none kora:[&_svg]:shrink-0 kora:[&_svg]:text-input-icon kora:group-data-[invalid=true]/field:[&_svg]:text-input-icon-error kora:disabled:[&_svg]:text-input-icon-disabled kora:aria-invalid:[&_svg]:text-input-icon-error kora:[&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  );
}

export type CommandDropdownInputProps = ComponentProps<typeof ComboboxInput>;

export function CommandDropdownInput({
  autoFocus = true,
  ...props
}: CommandDropdownInputProps) {
  return <ComboboxInput autoFocus={autoFocus} {...props} />;
}
