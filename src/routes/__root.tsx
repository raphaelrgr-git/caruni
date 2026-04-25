import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { ThemeProvider } from "@/lib/theme";
import { AuthProvider } from "@/lib/auth";
import { CaruniStoreProvider } from "@/data/store";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="num text-7xl font-bold tracking-tight text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Rota não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          O caminho que você procura saiu da rota. Vamos te trazer de volta.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Voltar pro início
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "CarUni — Carona recorrente pra quem faz a mesma rota todo dia" },
      {
        name: "description",
        content:
          "A carona universitária e de trabalho organizada de verdade: rotas fixas, débito automático, motoristas verificados e substituição garantida.",
      },
      { name: "author", content: "CarUni" },
      {
        property: "og:title",
        content: "CarUni — Carona recorrente pra quem faz a mesma rota todo dia",
      },
      {
        property: "og:description",
        content:
          "A carona universitária e de trabalho organizada de verdade: rotas fixas, débito automático, motoristas verificados e substituição garantida.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "theme-color", content: "#0e1116" },
      {
        name: "twitter:title",
        content: "CarUni — Carona recorrente pra quem faz a mesma rota todo dia",
      },
      {
        name: "twitter:description",
        content:
          "A carona universitária e de trabalho organizada de verdade: rotas fixas, débito automático, motoristas verificados e substituição garantida.",
      },
      {
        property: "og:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/05f2443a-b6e5-4bc8-a55f-9dffa3e78e79/id-preview-c98f9217--91ca25d4-3ba6-45f9-bc35-9db1e5cb439f.lovable.app-1777127350600.png",
      },
      {
        name: "twitter:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/05f2443a-b6e5-4bc8-a55f-9dffa3e78e79/id-preview-c98f9217--91ca25d4-3ba6-45f9-bc35-9db1e5cb439f.lovable.app-1777127350600.png",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CaruniStoreProvider>
          <Outlet />
        </CaruniStoreProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
