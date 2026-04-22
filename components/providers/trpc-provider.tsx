"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";

import { createTRPCReactClient } from "@/lib/trpc/client";
import { api } from "@/lib/trpc/hooks";

type TRPCReactProviderProps = {
  children: ReactNode;
};

export function TRPCReactProvider({ children }: TRPCReactProviderProps) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() => createTRPCReactClient());

  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </api.Provider>
  );
}
