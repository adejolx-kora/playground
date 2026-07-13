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
    <div className="mx-auto flex min-h-full w-full max-w-3xl items-center px-6 py-8">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Surface Modal</CardTitle>
          <CardDescription>
            Demo text for the new modal surface route.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-body-md text-content-default-secondary">
            This space is ready for the next modal example.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
