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
        {/* Apply the saved theme before paint to avoid a flash of the wrong mode. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('crownfi.theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}}catch(e){}})();`,
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
