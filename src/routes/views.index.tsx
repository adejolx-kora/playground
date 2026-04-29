import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/views/")({
  beforeLoad: () => {
    throw redirect({ to: "/views/login" });
  },
});
