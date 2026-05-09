import { createFileRoute } from "@tanstack/react-router";

import logo from "@/assets/logo.svg";
import placeholder from "@/assets/placeholder.svg";
import { LoginForm } from "@/features/login-form";

export const Route = createFileRoute("/views/login")({
  component: RouteComponent,
});

// eslint-disable-next-line react-refresh/only-export-components
function RouteComponent() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium">
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <img src={logo} alt="Logo" />
            </div>
            Kora
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-lg">
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <img
          src={placeholder}
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  );
}
