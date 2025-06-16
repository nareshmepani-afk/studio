
"use server";

import { z } from "zod";
import { auth } from "@/lib/firebase"; // Import Firebase auth
import { confirmPasswordReset } from "firebase/auth";

const ResetPasswordInputSchema = z.object({
  token: z.string().min(1, { message: "Reset token is required." }),
  newPassword: z.string().min(6, { message: "Password must be at least 6 characters long." }), // Firebase default min is 6
  confirmPassword: z.string().min(6, { message: "Confirm password must be at least 6 characters long." }),
  // recaptchaToken: z.string().min(1, { message: "reCAPTCHA verification failed." }), // reCAPTCHA removed for this step
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"], 
});

interface ResetPasswordOutput {
  success: boolean;
  message: string;
}

export async function resetPasswordAction(
  input: z.infer<typeof ResetPasswordInputSchema>
): Promise<ResetPasswordOutput> {
  try {
    const validation = ResetPasswordInputSchema.safeParse(input);
    if (!validation.success) {
      const errorMessage = validation.error.errors.map(e => e.message).join(" ");
      return { success: false, message: errorMessage || "Invalid input." };
    }

    const { token, newPassword } = validation.data;

    // In a real app with reCAPTCHA:
    // const recaptchaVerified = await verifyRecaptcha(recaptchaToken, process.env.RECAPTCHA_SECRET_KEY);
    // if (!recaptchaVerified) {
    //   return { success: false, message: "reCAPTCHA verification failed. Please try again." };
    // }

    await confirmPasswordReset(auth, token, newPassword);

    return {
      success: true,
      message: "Your password has been successfully reset. You can now log in with your new password.",
    };

  } catch (error: any) {
    console.error("Error in resetPasswordAction:", error);
    // Firebase errors for confirmPasswordReset include:
    // 'auth/expired-action-code': Link has expired.
    // 'auth/invalid-action-code': Link is invalid (e.g., already used or malformed).
    // 'auth/user-disabled': The user account has been disabled.
    // 'auth/user-not-found': No user corresponding to this code.
    // 'auth/weak-password': Password is too weak.
    let friendlyMessage = "An unexpected error occurred. Please try again.";
    if (error.code) {
        switch (error.code) {
            case 'auth/expired-action-code':
                friendlyMessage = "This password reset link has expired. Please request a new one.";
                break;
            case 'auth/invalid-action-code':
                friendlyMessage = "This password reset link is invalid or has already been used. Please request a new one.";
                break;
            case 'auth/user-disabled':
                friendlyMessage = "This account has been disabled.";
                break;
            case 'auth/user-not-found': // Should not typically happen if link was valid
                friendlyMessage = "No user found for this reset request.";
                break;
            case 'auth/weak-password':
                friendlyMessage = "The new password is too weak. Please choose a stronger password.";
                break;
            default:
                friendlyMessage = error.message || friendlyMessage;
        }
    }
    return {
      success: false,
      message: friendlyMessage,
    };
  }
}
