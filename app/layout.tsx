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
