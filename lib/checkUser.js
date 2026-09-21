import { currentUser } from "@clerk/nextjs/server";
import { db } from "./prisma";

export const checkUser = async () => {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    return null;
  }

  try {
    const primaryEmail = clerkUser.emailAddresses?.[0]?.emailAddress;
    if (!primaryEmail) {
      throw new Error("Missing primary email from Clerk user");
    }

    const firstName = clerkUser.firstName?.trim() || "";
    const lastName = clerkUser.lastName?.trim() || "";
    const fallbackName = clerkUser.username || primaryEmail.split("@")[0] || "User";
    const fullName = `${firstName} ${lastName}`.trim() || fallbackName;

    const dbUser = await db.user.upsert({
      where: {
        clerkUserId: clerkUser.id,
      },
      update: {
        name: fullName,
        imageUrl: clerkUser.imageUrl,
        email: primaryEmail,
      },
      create: {
        clerkUserId: clerkUser.id,
        name: fullName,
        imageUrl: clerkUser.imageUrl,
        email: primaryEmail,
      },
    });

    return dbUser;
  } catch (error) {
    console.error("checkUser failed:", error);
    return null;
  }
};
