import "../globals.css";
import { Providers } from "../providers";
import PwaSidebarLayout from "@/components/layout/PwaSidebarLayout";

export default function AiToolsLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <PwaSidebarLayout>{children}</PwaSidebarLayout>
        </Providers>
      </body>
    </html>
  );
}
