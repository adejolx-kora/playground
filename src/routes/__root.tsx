import {
  SidebarProvider,
  SidebarMenuButton,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  Sidebar,
  SidebarRail,
  SidebarInset,
} from "@korapay/react/sidebar";
import { createRootRoute, Link, Outlet } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: RootComponent,
});

type MenuItem = {
  label: string;
  url?: string;
};

type MenuSection = {
  label: string;
  items: MenuItem[];
};

const sections: Array<MenuSection> = [
  {
    label: "Interactions",
    items: [
      { label: "Hover", url: "/interactions/hover" },
      { label: "View transitions", url: "/interactions/view-transitions" },
      { label: "Input Masks", url: "/interactions/input" },
    ],
  },
  {
    label: "Views",
    items: [
      { label: "Login", url: "/views/login" },
      { label: "Onboarding", url: "/views/onboarding" },
    ],
  },
];

// eslint-disable-next-line react-refresh/only-export-components
function RootComponent() {
  return (
    <div className="h-svh w-full bg-surface-primary">
      <SidebarProvider defaultOpen>
        <Sidebar side="left" variant="inset">
          <SidebarContent className="mt-5">
            {sections.map((section) => (
              <SidebarGroup key={section.label}>
                <SidebarGroupLabel className="text-subheading-2xs uppercase">
                  {section.label}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {section.items.map((item) => (
                      <SidebarMenuItem key={item.label}>
                        <SidebarMenuButton
                          render={
                            <Link
                              to={item.url || "#"}
                              activeOptions={{ exact: true }}
                              activeProps={{
                                "data-active": true,
                              }}
                            />
                          }
                          tooltip={item.label}
                        >
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarContent>
          <SidebarRail />
        </Sidebar>

        <SidebarInset>
          <Outlet />
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
