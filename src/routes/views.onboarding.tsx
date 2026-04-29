import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/views/onboarding")({
  component: RouteComponent,
});

// eslint-disable-next-line react-refresh/only-export-components
function RouteComponent() {
  return <div>Hello "/views/onboarding"!</div>;
}
