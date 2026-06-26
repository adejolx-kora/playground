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
import {
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@korapay/react";
import { createRootRoute, Link, Outlet } from "@tanstack/react-router";

import {
  APP_LOCALE_LABELS,
  AppLocaleProvider,
  isAppLocale,
  useLocale,
} from "@/lib/locale-context";

/* eslint-disable react-refresh/only-export-components */

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
      { label: "Input", url: "/interactions/input" },
    ],
  },
  {
    label: "Views",
    items: [
      { label: "Login", url: "/views/login" },
      { label: "Onboarding", url: "/views/onboarding" },
      { label: "Wizard modal", url: "/views/wizard-modal" },
    ],
  },
];

function RootComponent() {
  return (
    <AppLocaleProvider>
      <RootLayout />
    </AppLocaleProvider>
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
