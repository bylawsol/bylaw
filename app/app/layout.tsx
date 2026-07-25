import { AppProviders } from "./providers";
import { AppChrome } from "@/components/app/app-chrome";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppProviders>
      <AppChrome>{children}</AppChrome>
    </AppProviders>
  );
}
