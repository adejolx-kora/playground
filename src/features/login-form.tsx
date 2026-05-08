import { Button, Card, CardContent, Input } from "@korapay/react";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  Password,
  PasswordInput,
  PasswordToggle,
} from "@korapay/react/molecules";

export function LoginForm() {
  return (
    <Card className="ring-0 mx-auto w-full max-w-md">
      <CardContent>
        <form className="flex flex-col gap-6">
          <FieldGroup>
            <div className="flex flex-col items-center gap-1 text-center">
              <h1 className="text-2xl font-bold">Login to your account</h1>
              <p className="text-sm text-balance text-content-default-tertiary">
                Enter your email below to login to your account.
              </p>
            </div>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
              />
            </Field>
            <Field>
              <div className="flex items-center">
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <a
                  href="#"
                  className="ml-auto text-sm underline-offset-4 hover:underline"
                >
                  Forgot your password?
                </a>
              </div>
              <Password>
                <PasswordInput id="password" required />
                <PasswordToggle />
              </Password>
            </Field>
            <Field>
              <Button type="submit">Login</Button>
            </Field>
            <FieldDescription className="text-center">
              Don&apos;t have an account?{" "}
              <a href="#" className="underline underline-offset-4">
                Sign up
              </a>
            </FieldDescription>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
