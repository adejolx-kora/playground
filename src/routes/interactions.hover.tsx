import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/interactions/hover")({
  component: RouteComponent,
});

// eslint-disable-next-line react-refresh/only-export-components
function RouteComponent() {
  return (
    <div className="kora:space-y-4 kora:px-6 kora:py-4">
      Hello from the hover page
    </div>
  );
}
