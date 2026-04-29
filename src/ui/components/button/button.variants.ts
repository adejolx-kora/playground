import { cva } from "class-variance-authority";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-4xs border-sm border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:ring-[1.5px] focus-visible:ring-offset-1 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:border-transparent disabled:bg-btn-background-disabled disabled:text-content-default-disabled disabled:opacity-100 in-data-[slot=button-group]:border-stroke-brand-primary disabled:in-data-[slot=button-group]:border-btn-divider-disabled disabled:in-data-[slot=button-group]:bg-transparent [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        unset:
          "rounded-none p-0 text-inherit hover:bg-transparent focus-visible:ring-0",
        primary:
          "bg-btn-primary-filled-background-default text-btn-primary-filled-text hover:bg-btn-primary-filled-background-hover focus-visible:border-btn-primary-focus-ring focus-visible:ring-btn-primary-focus-ring",
        "primary-lighter":
          "bg-btn-primary-lighter-background-default text-btn-primary-lighter-text hover:bg-btn-primary-lighter-background-hover focus-visible:border-btn-primary-focus-ring focus-visible:ring-btn-primary-focus-ring",
        "primary-outline":
          "border-btn-primary-outline-border-default bg-btn-primary-outline-background text-btn-primary-outline-text hover:bg-btn-primary-outline-background-hover focus-visible:border-btn-primary-focus-ring focus-visible:ring-btn-primary-focus-ring",
        "primary-ghost":
          "bg-btn-primary-ghost-background-default text-btn-primary-ghost-text hover:bg-btn-primary-ghost-background-hover focus-visible:border-btn-primary-focus-ring focus-visible:ring-btn-primary-focus-ring",

        neutral:
          "bg-btn-neutral-filled-background-default text-btn-neutral-filled-text hover:bg-btn-neutral-filled-background-hover focus-visible:border-btn-neutral-focus-ring focus-visible:ring-btn-neutral-focus-ring",
        "neutral-lighter":
          "bg-btn-neutral-lighter-background-default text-btn-neutral-lighter-text hover:bg-btn-neutral-lighter-background-hover focus-visible:border-btn-neutral-focus-ring focus-visible:ring-btn-neutral-focus-ring",
        "neutral-outline":
          "border-btn-neutral-outline-border-default bg-btn-neutral-outline-background text-btn-neutral-outline-text hover:bg-btn-neutral-outline-background-hover focus-visible:border-btn-neutral-focus-ring focus-visible:ring-btn-neutral-focus-ring",
        "neutral-ghost":
          "bg-btn-neutral-ghost-background-default text-btn-neutral-ghost-text hover:bg-btn-neutral-ghost-background-hover focus-visible:border-btn-neutral-focus-ring focus-visible:ring-btn-neutral-focus-ring",

        destructive:
          "bg-btn-destructive-filled-background-default text-btn-destructive-filled-text hover:bg-btn-destructive-filled-background-hover focus-visible:border-btn-destructive-focus-ring focus-visible:ring-btn-destructive-focus-ring",
        "destructive-lighter":
          "bg-btn-destructive-lighter-background-default text-btn-destructive-lighter-text hover:bg-btn-destructive-lighter-background-hover focus-visible:border-btn-destructive-focus-ring focus-visible:ring-btn-destructive-focus-ring",
        "destructive-outline":
          "border-btn-destructive-outline-border-default bg-btn-destructive-outline-background text-btn-destructive-outline-text hover:bg-btn-destructive-outline-background-hover focus-visible:border-btn-destructive-focus-ring focus-visible:ring-btn-destructive-focus-ring",
        "destructive-ghost":
          "bg-btn-destructive-ghost-background-default text-btn-destructive-ghost-text hover:bg-btn-destructive-ghost-background-hover focus-visible:border-btn-destructive-focus-ring focus-visible:ring-btn-destructive-focus-ring",

        success:
          "bg-btn-success-filled-background-default text-btn-success-filled-text hover:bg-btn-success-filled-background-hover focus-visible:border-btn-success-focus-ring focus-visible:ring-btn-success-focus-ring",
        "success-lighter":
          "bg-btn-success-lighter-background-default text-btn-success-lighter-text hover:bg-btn-success-lighter-background-hover focus-visible:border-btn-success-focus-ring focus-visible:ring-btn-success-focus-ring",
        "success-outline":
          "border-btn-success-outline-border-default bg-btn-success-outline-background text-btn-success-outline-text hover:bg-btn-success-outline-background-hover focus-visible:border-btn-success-focus-ring focus-visible:ring-btn-success-focus-ring",
        "success-ghost":
          "bg-btn-success-ghost-background-default text-btn-success-ghost-text hover:bg-btn-success-ghost-background-hover focus-visible:border-btn-success-focus-ring focus-visible:ring-btn-success-focus-ring",

        link: "text-content-brand-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 gap-4xs px-2xs py-4xs text-sm in-data-[slot=button-group]:rounded-4xs has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3 [&_svg:not([class*='size-'])]:size-4",
        md: "h-10 gap-4xs px-2xs py-3xs text-sm has-data-[icon=inline-end]:pr-2xs has-data-[icon=inline-start]:pl-2xs",
        lg: "h-11 gap-3xs rounded-3xs px-xxs py-3xs text-base has-data-[icon=inline-end]:pr-xxs has-data-[icon=inline-start]:pl-xxs",
        xl: "h-12 gap-3xs rounded-3xs px-xs py-2xs text-base has-data-[icon=inline-end]:pr-xs has-data-[icon=inline-start]:pl-xs",
        "icon-sm":
          "size-9 px-2xs py-4xs in-data-[slot=button-group]:rounded-4xs",
        icon: "size-10 px-2xs py-3xs",
        "icon-lg": "size-11 px-xxs py-3xs",
        "icon-xl": "size-12 px-xs py-2xs",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export { buttonVariants };
