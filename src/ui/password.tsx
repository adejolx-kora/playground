import { EyeIcon, EyeSlashIcon } from "@phosphor-icons/react";
import * as React from "react";

import { cn } from "@/lib/utils";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "./input-group";

type PasswordContextValue = {
  visible: boolean;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
};

const PasswordContext = React.createContext<PasswordContextValue | null>(null);

function usePasswordContext(componentName: string) {
  const context = React.useContext(PasswordContext);

  if (!context) {
    throw new Error(`${componentName} must be used within Password`);
  }

  return context;
}

type PasswordRootProps = Omit<
  React.ComponentProps<typeof InputGroup>,
  "children"
> & {
  children: React.ReactNode;
  visible?: boolean;
  defaultVisible?: boolean;
  onVisibleChange?: (visible: boolean) => void;
};

const Password = React.forwardRef<HTMLDivElement, PasswordRootProps>(
  (
    {
      className,
      visible: visibleProp,
      defaultVisible = false,
      onVisibleChange,
      children,
      ...props
    },
    ref,
  ) => {
    const [uncontrolledVisible, setUncontrolledVisible] =
      React.useState(defaultVisible);
    const isControlled = visibleProp !== undefined;
    const visible = isControlled ? visibleProp : uncontrolledVisible;

    const setVisible = React.useCallback<PasswordContextValue["setVisible"]>(
      (nextVisible) => {
        const resolvedVisible =
          typeof nextVisible === "function"
            ? nextVisible(visible)
            : nextVisible;

        if (!isControlled) {
          setUncontrolledVisible(resolvedVisible);
        }

        onVisibleChange?.(resolvedVisible);
      },
      [isControlled, onVisibleChange, visible],
    );

    return (
      <PasswordContext.Provider value={{ visible, setVisible }}>
        <InputGroup
          ref={ref}
          data-slot="password"
          data-visible={visible}
          className={cn(className)}
          {...props}
        >
          {children}
        </InputGroup>
      </PasswordContext.Provider>
    );
  },
);

Password.displayName = "Password";

type PasswordInputProps = Omit<
  React.ComponentProps<typeof InputGroupInput>,
  "type"
>;

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, ...props }, ref) => {
    const { visible } = usePasswordContext("PasswordInput");

    return (
      <InputGroupInput
        ref={ref}
        type={visible ? "text" : "password"}
        autoComplete="current-password"
        data-slot="password-input"
        className={cn(className)}
        {...props}
      />
    );
  },
);

PasswordInput.displayName = "PasswordInput";

type PasswordToggleProps = Omit<
  React.ComponentProps<typeof InputGroupButton>,
  "type" | "onClick" | "children"
> & {
  showLabel?: string;
  hideLabel?: string;
};

const PasswordToggle = React.forwardRef<HTMLButtonElement, PasswordToggleProps>(
  (
    {
      className,
      showLabel = "Show password",
      hideLabel = "Hide password",
      ...props
    },
    ref,
  ) => {
    const { visible, setVisible } = usePasswordContext("PasswordToggle");
    const label = visible ? hideLabel : showLabel;

    return (
      <InputGroupAddon align="inline-end" data-slot="password-toggle-addon">
        <InputGroupButton
          ref={ref}
          type="button"
          size="icon-xs"
          variant="neutral-ghost"
          aria-label={label}
          title={label}
          data-slot="password-toggle"
          data-visible={visible}
          className={cn(className)}
          onClick={() => setVisible((state) => !state)}
          {...props}
        >
          {visible ? <EyeSlashIcon /> : <EyeIcon />}
        </InputGroupButton>
      </InputGroupAddon>
    );
  },
);

PasswordToggle.displayName = "PasswordToggle";

export { Password, PasswordInput, PasswordToggle };
