// src/app/dashboard/layout.tsx
import "../globals.css";
import "../../styles/dark-theme.css";
import { Providers } from "../providers";
import PwaSidebarLayout from "@/components/layout/PwaSidebarLayout";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <SignedIn>
        <PwaSidebarLayout>{children}</PwaSidebarLayout>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </Providers>
  );
}
