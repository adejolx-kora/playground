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
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@korapay/react";
import {
  createRootRoute,
  Link,
  Outlet,
  useRouter,
  useRouterState,
} from "@tanstack/react-router";
import { useCallback, useMemo } from "react";

import {
  APP_LOCALE_LABELS,
  AppLocaleProvider,
  isAppLocale,
  useLocale,
} from "@/lib/locale-context";
import { QueryStateProvider, toQueryLocationHref } from "@/lib/query-state";

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
  {
    label: "Interactions",
    items: [
      { label: "Hover", url: "/interactions/hover" },
      { label: "View transitions", url: "/interactions/view-transitions" },
      { label: "Input", url: "/interactions/input" },
    ],
  },
  {
    label: "Views",
    items: [
      { label: "Login", url: "/views/login" },
      {
        label: "Onboarding",
        url: "/views/onboarding",
        items: [
          { label: "Vanilla Utility", url: "/views/onboarding/vanilla" },
          {
            label: "React Hook Form",
            url: "/views/onboarding/react-hook-form",
          },
          { label: "Formik", url: "/views/onboarding/formik" },
        ],
      },
      { label: "Wizard modal", url: "/views/wizard-modal" },
    ],
  },
];

function RootComponent() {
  return (
    <AppLocaleProvider>
      <RootQueryStateProvider>
        <RootLayout />
      </RootQueryStateProvider>
    </AppLocaleProvider>
  );
}

function RootQueryStateProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const location = useRouterState({
    select: (state) => state.location,
  });

  const queryStateLocation = useMemo(
    () => ({
      pathname: location.pathname,
      searchStr: location.searchStr,
      hash: location.hash,
    }),
    [location.hash, location.pathname, location.searchStr],
  );

  const navigate = useCallback(
    (
      nextLocation: {
        pathname: string;
        searchStr: string;
        hash: string;
      },
      options: {
        history: "replace" | "push";
        clearOnDefault: boolean;
      },
    ) => {
      return router.navigate({
        href: toQueryLocationHref(nextLocation),
        replace: options.history === "replace",
      });
    },
    [router],
  );

  return (
    <QueryStateProvider location={queryStateLocation} navigate={navigate}>
      {children}
    </QueryStateProvider>
  );
}

function LocaleSelectControl() {
  const { locale, setLocale, supportedLocales } = useLocale();

  return (
    <div className="space-y-2 px-2 pb-2">
      <Label className="text-label-xs text-content-default-secondary">
        Locale
      </Label>
      <Select
        value={locale}
        onValueChange={(nextLocale: string | null) => {
          if (isAppLocale(nextLocale)) {
            setLocale(nextLocale);
          }
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select locale" />
        </SelectTrigger>
        <SelectContent>
          {supportedLocales.map((supportedLocale) => (
            <SelectItem key={supportedLocale} value={supportedLocale}>
              {APP_LOCALE_LABELS[supportedLocale]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function RootLayout() {
  const { locale } = useLocale();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const isRtl = locale === "ar";
  const sidebarSide = isRtl ? "right" : "left";
  const dir = isRtl ? "rtl" : "ltr";

  return (
    <div className="h-svh w-full bg-surface-primary">
      <SidebarProvider defaultOpen>
        <Sidebar side={sidebarSide} variant="inset" dir={dir}>
          <SidebarContent className="mt-5">
            <LocaleSelectControl />
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
                            isActive={
                              item.url ? pathname.startsWith(item.url) : false
                            }
                            render={
                              <Link
                                to={item.url || "#"}
                              />
                            }
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
