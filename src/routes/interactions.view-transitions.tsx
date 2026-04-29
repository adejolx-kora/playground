import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/interactions/view-transitions')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/interactions/view-transitions"!</div>
}
