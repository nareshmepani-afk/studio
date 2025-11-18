
"use server";

import { z } from "zod";
import { app } from "@/lib/firebase"; // Import Firebase app
import { getAuth, sendPasswordResetEmail } from "firebase/auth";

const RequestPasswordResetInputSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  // recaptchaToken: z.string().min(1, { message: "reCAPTCHA verification failed." }), // reCAPTCHA removed for this step
});

interface RequestPasswordResetOutput {
  success: boolean;
  message: string;
}

export async function requestPasswordResetAction(
  input: z.infer<typeof RequestPasswordResetInputSchema>
): Promise<RequestPasswordResetOutput> {
  try {
    const validation = RequestPasswordResetInputSchema.safeParse(input);
    if (!validation.success) {
      return { success: false, message: validation.error.errors.map(e => e.message).join(" ") || "Invalid input." };
    }

    const { email } = validation.data;
    const auth = getAuth(app);

    // In a real app with reCAPTCHA:
    // const recaptchaVerified = await verifyRecaptcha(recaptchaToken, process.env.RECAPTCHA_SECRET_KEY);
    // if (!recaptchaVerified) {
    //   return { success: false, message: "reCAPTCHA verification failed. Please try again." };
    // }
    
    await sendPasswordResetEmail(auth, email);

    return {
      success: true,
      message: "If an account with this email exists, a password reset link has been sent. Please check your inbox.",
    };

  } catch (error: any) {
    console.error("Error in requestPasswordResetAction:", error);
    // Firebase often throws errors with codes, e.g., 'auth/user-not-found'
    // For a better UX, you might not want to reveal if an email exists or not.
    // So, often a generic success message is returned regardless, unless it's a clear input validation error.
    // However, for this specific error, Firebase handles not finding the user gracefully by default (doesn't error out).
    // If other errors occur, they will be caught here.
    return {
      success: false,
      message: error.message || "An unexpected error occurred while processing your request. Please try again.",
    };
  }
}
