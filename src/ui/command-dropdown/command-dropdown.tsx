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
        "flex w-fit items-center justify-between gap-1.5 rounded-3xs border-sm border-input-border bg-input-background-default py-2 pr-2 pl-2.5 text-sm whitespace-nowrap text-input-text-filled transition-colors outline-none select-none group-data-[invalid=true]/field:border-input-border-error group-data-[invalid=true]/field:text-input-text-error group-data-[invalid=true]/field:ring-surface-error-alpha-subtle hover:border-input-border-hover focus-visible:border-input-border-active focus-visible:ring-[1.5px] focus-visible:ring-input-border-focused focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:border-input-border disabled:bg-input-background-secondary disabled:text-input-text-disabled disabled:opacity-100 aria-invalid:border-input-border-error aria-invalid:text-input-text-error aria-invalid:ring-surface-error-alpha-subtle data-placeholder:text-input-text-placeholder *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-1.5 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:text-input-icon group-data-[invalid=true]/field:[&_svg]:text-input-icon-error disabled:[&_svg]:text-input-icon-disabled aria-invalid:[&_svg]:text-input-icon-error [&_svg:not([class*='size-'])]:size-4",
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
