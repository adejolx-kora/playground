import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/interactions/view-transitions")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="space-y-4 px-6 py-4">
      Hello "/interactions/view-transitions"!
    </div>
  );
}
