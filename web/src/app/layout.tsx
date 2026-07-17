import "./globals.css";
import type { Metadata } from "next";
import { SessionProvider } from "@/session/SessionProvider";
import { PrivyWrapper } from "@/session/PrivyWrapper";
import { AppShell } from "@/components/AppShell";

// Typography is Times New Roman (a system font) — no web-font fetch needed.
// Both `font-display` and `font-sans` resolve to Times New Roman via tailwind.config.ts.

export const metadata: Metadata = {
  title: "CrownFi — Crown your queen, on-chain",
  description: "Blockchain-powered voting, ticketing, and fan experience for pageants, built on Stellar.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/*
          Night mode is hidden for now — the app is light-only. This clears the `dark` class and
          any saved choice before paint, so anyone already in night mode (or on an OS that prefers
          dark) lands on the light theme instead of being stuck with no toggle to escape it.

          To bring night mode back: restore the line below and re-add <ThemeToggle /> in AppShell.
          The html.dark rules in globals.css and ThemeToggle.tsx are left intact for that.
            var t=localStorage.getItem('crownfi.theme');
            if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{document.documentElement.classList.remove('dark');localStorage.removeItem('crownfi.theme');}catch(e){}})();`,
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <PrivyWrapper>
          <SessionProvider>
            <AppShell>{children}</AppShell>
          </SessionProvider>
        </PrivyWrapper>
      </body>
    </html>
  );
}
