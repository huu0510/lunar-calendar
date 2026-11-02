import { withAuth } from "next-auth/middleware";
import { ensureAuthSecret } from "@/lib/auth-secret";

ensureAuthSecret();

export default withAuth({
  pages: { signIn: "/login" },
});

export const config = {
  matcher: ["/events", "/events/:path*", "/recipients", "/recipients/:path*"],
};
