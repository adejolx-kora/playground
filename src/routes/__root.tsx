import {
  SidebarProvider,
  SidebarMenuButton,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  Sidebar,
  SidebarRail,
  SidebarInset,
} from "@korapay/react/sidebar";
import {
  createRootRoute,
  Link,
  Outlet,
  useRouterState,
} from "@tanstack/react-router";

/* eslint-disable react-refresh/only-export-components */

export const Route = createRootRoute({
  component: RootComponent,
});

type MenuItem = {
  label: string;
  url?: string;
  items?: MenuItem[];
};

type MenuSection = {
  label: string;
  items: MenuItem[];
};

const sections: Array<MenuSection> = [
  // {
  //   label: "Interactions",
  //   items: [
  //     { label: "Hover", url: "/interactions/hover" },
  //     { label: "View transitions", url: "/interactions/view-transitions" },
  //     { label: "Input", url: "/interactions/input" },
  //   ],
  // },
  // {
  //   label: "Surface",
  //   items: [{ label: "Modal", url: "/surface/modal" }],
  // },
  {
    label: "Flows",
    items: [
      { label: "Checkout", url: "/flows/checkout" },
      { label: "Onboarding", url: "/flows/onboarding" },
      { label: "Escalate chargeback", url: "/flow/escalate-chargeback" },
    ],
  },
];

function RootComponent() {
  return <RootLayout />;
}

function RootLayout() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  return (
    <div className="kora:h-svh kora:w-full kora:bg-surface-primary">
      <SidebarProvider defaultOpen>
        <Sidebar variant="inset">
          <SidebarContent className="kora:mt-5">
            {/* <LocaleSelectControl /> */}
            {sections.map((section) => (
              <SidebarGroup key={section.label}>
                <SidebarGroupLabel className="kora:text-subheading-2xs kora:uppercase">
                  {section.label}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {section.items.map((item) => (
                      <SidebarMenuItem key={item.label}>
                        <SidebarMenuButton
                          isActive={
                            item.url ? pathname.startsWith(item.url) : false
                          }
                          render={<Link to={item.url || "#"} />}
                          tooltip={item.label}
                        >
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                        {item.items?.length ? (
                          <SidebarMenuSub>
                            {item.items.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.label}>
                                <SidebarMenuSubButton
                                  isActive={pathname === subItem.url}
                                  render={<Link to={subItem.url || "#"} />}
                                >
                                  <span>{subItem.label}</span>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        ) : null}
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
