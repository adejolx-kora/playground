import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@korapay/react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/surface/modal")({
  component: RouteComponent,
});

// eslint-disable-next-line react-refresh/only-export-components
function RouteComponent() {
  return (
    <div className="kora:mx-auto kora:flex kora:min-h-full kora:w-full kora:max-w-3xl kora:items-center kora:px-6 kora:py-8">
      <Card className="kora:w-full">
        <CardHeader>
          <CardTitle>Surface Modal</CardTitle>
          <CardDescription>
            Demo text for the new modal surface route.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="kora:text-body-md kora:text-content-default-secondary">
            This space is ready for the next modal example.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
