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
    <Card className="kora:mx-auto kora:w-full kora:max-w-md kora:ring-0">
      <CardContent>
        <form className="kora:flex kora:flex-col kora:gap-6">
          <FieldGroup>
            <div className="kora:flex kora:flex-col kora:items-center kora:gap-1 kora:text-center">
              <h1 className="kora:text-2xl kora:font-bold">
                Login to your account
              </h1>
              <p className="kora:text-sm kora:text-balance kora:text-content-default-tertiary">
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
              <div className="kora:flex kora:items-center">
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <a
                  href="#"
                  className="kora:ml-auto kora:text-sm kora:underline-offset-4 kora:hover:underline"
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
            <FieldDescription className="kora:text-center">
              Don&apos;t have an account?{" "}
              <a href="#" className="kora:underline kora:underline-offset-4">
                Sign up
              </a>
            </FieldDescription>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
