"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { BrandingProvider } from "@/context/branding-context";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <BrandingProvider>
        {children}
      </BrandingProvider>
    </QueryClientProvider>
  );
}
