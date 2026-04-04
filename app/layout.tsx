// Note: this App Router layout exists solely to inject Fathom analytics via usePathname().
// All routing is handled by the Pages Router (/pages). Do not add routes here.
import { FathomAnalytics } from "./fathom";
import { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <FathomAnalytics />
        {children}
      </body>
    </html>
  );
}
