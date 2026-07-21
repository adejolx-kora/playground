import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/interactions/view-transitions")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="kora:space-y-4 kora:px-6 kora:py-4">
      Hello "/interactions/view-transitions"!
    </div>
  );
}
