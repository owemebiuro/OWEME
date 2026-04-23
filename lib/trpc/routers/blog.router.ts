import { PERMISSIONS, permissionProcedure } from "@/lib/trpc/permissions";
import { router } from "@/lib/trpc/trpc";

export const blogRouter = router({
  checkAccess: permissionProcedure(PERMISSIONS.BLOG_MANAGE).query(() => ({
    canManage: true,
  })),
});
