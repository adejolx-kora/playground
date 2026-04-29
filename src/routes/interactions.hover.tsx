import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/interactions/hover")({
  component: RouteComponent,
});

// eslint-disable-next-line react-refresh/only-export-components
function RouteComponent() {
  return <div className="px-6 py-4 space-y-4">Hello from the hover page</div>;
}
