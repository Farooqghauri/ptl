// src/app/dashboard/layout.tsx
import "../globals.css";
import "../../styles/dark-theme.css";
import { Providers } from "../providers";
import PwaSidebarLayout from "@/components/layout/PwaSidebarLayout";
import ThemeController from "@/components/ThemeController";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        <Providers>
          <ThemeController />
          <PwaSidebarLayout>{children}</PwaSidebarLayout>
        </Providers>
      </body>
    </html>
  );
}
