
"use server";

import { z } from "zod";

const RequestPasswordResetInputSchema = z.string().email({ message: "Invalid email address." });

interface RequestPasswordResetOutput {
  success: boolean;
  message: string;
}

// This is a mock action. In a real app, you would:
// 1. Validate the email format (done with Zod).
// 2. Check if a user exists with this email in your database.
// 3. Generate a secure, unique, and time-limited password reset token.
// 4. Store the token hashed in the database, associated with the user's ID and an expiry date.
// 5. Construct a password reset URL (e.g., yourdomain.com/reset-password?token=THE_TOKEN).
// 6. Use an email service (like SendGrid) to send the reset link to the user's email.

export async function requestPasswordResetAction(email: string): Promise<RequestPasswordResetOutput> {
  try {
    const validation = RequestPasswordResetInputSchema.safeParse(email);
    if (!validation.success) {
      return { success: false, message: validation.error.errors[0]?.message || "Invalid email format." };
    }

    const sanitizedEmail = validation.data;

    // Simulate checking if user exists (in a real app, query your database)
    // For this demo, we'll assume the user might exist.
    console.log(`Password reset requested for email: ${sanitizedEmail}`);

    // Simulate token generation
    const mockToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const mockResetLink = `/reset-password?token=${mockToken}`; // This page doesn't exist yet

    console.log(`SIMULATION:
      - User existence check for ${sanitizedEmail} (assumed positive for demo).
      - Generated mock reset token: ${mockToken}
      - Constructed mock reset link: ${mockResetLink}
      - IF SENDGRID WAS CONFIGURED, an email would be sent to ${sanitizedEmail} with this link.
    `);

    // In a real app, you'd now call your SendGrid (or other email service) function here
    // await sendPasswordResetEmail(sanitizedEmail, mockResetLink);

    return {
      success: true,
      message: "If an account with this email exists, instructions to reset your password have been (notionally) sent. Please check your inbox (this is a simulation).",
    };

  } catch (error) {
    console.error("Error in requestPasswordResetAction:", error);
    return {
      success: false,
      message: "An unexpected error occurred while processing your request. Please try again.",
    };
  }
}
