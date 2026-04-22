import { cache } from "react";

import { createTRPCContext } from "@/lib/trpc/context";
import { appRouter } from "@/lib/trpc/root";
import { createCallerFactory } from "@/lib/trpc/trpc";

export const createTRPCCaller = cache(async () => {
  const context = await createTRPCContext();
  const createCaller = createCallerFactory(appRouter);

  return createCaller(context);
});
