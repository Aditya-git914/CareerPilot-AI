"use server";

import { db } from "@/lib/prisma";
import { checkUser } from "@/lib/checkUser";
// import { generateAIInsights } from "./dashboard";
import { generateAIInsights } from "./dashboard";

export async function updateUser(data) {
  const user = await checkUser();
  if (!user) throw new Error("Unauthorized");

  try {
    // Start a transaction to handle both operations
    const result = await db.$transaction(
      async (tx) => {
        // First check if industry exists
        let industryInsight = await tx.industryInsight.findUnique({
          where: {
            industry: data.industry,
          },
        });

        // If industry doesn't exist, create it with default values
        if (!industryInsight) {
          const insights = await generateAIInsights(data.industry);

          industryInsight = await tx.industryInsight.create({
            data: {
              industry: data.industry,
              ...insights,
              nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
          });
        }

        // Now update the user
        const updatedUser = await tx.user.update({
          where: {
            id: user.id,
          },
          data: {
            industry: data.industry,
            experience: data.experience,
            bio: data.bio,
            skills: data.skills,
          },
        });

        return { updatedUser, industryInsight };
      },
      {
        timeout: 10000, // default: 5000
      }
    );

    // revalidatePath("/");
    return { success: true, ...result };
    
   
  } catch (error) {
    console.error("Error updating user and industry:", error.message);
    throw new Error("Failed to update profile");
  }
}

export async function getUserOnboardingStatus() {
  const user = await checkUser();
  if (!user) {
    return { isOnboarded: false };
  }

  try {
    const dbUser = await db.user.findUnique({
      where: {
        clerkUserId: user.clerkUserId,
      },
      select: {
        industry: true,
      },
    });

    return {
      isOnboarded: !!dbUser?.industry,
    };
  } catch (error) {
    console.error("Error checking onboarding status:", error.message);
   
    throw new Error("Failed to check onboarding status");
  }
}
