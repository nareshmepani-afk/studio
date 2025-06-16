
"use server";

import { z } from "zod";

const ResetPasswordInputSchema = z.object({
  token: z.string().min(1, { message: "Reset token is required." }),
  newPassword: z.string().min(8, { message: "Password must be at least 8 characters long." }),
  confirmPassword: z.string().min(8, { message: "Confirm password must be at least 8 characters long." }),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"], // Path to field to highlight error on if using react-hook-form
});

interface ResetPasswordOutput {
  success: boolean;
  message: string;
}

// This is a mock action. In a real app, you would:
// 1. Validate the token:
//    - Check if the token exists in your database.
//    - Check if the token has expired.
//    - Check if the token has already been used.
//    - Retrieve the user ID associated with the token.
// 2. If the token is valid:
//    - Hash the newPassword.
//    - Update the user's password hash in the database.
//    - Invalidate the reset token (mark as used or delete).
// 3. If any step fails, return an appropriate error message.

export async function resetPasswordAction(
  input: z.infer<typeof ResetPasswordInputSchema>
): Promise<ResetPasswordOutput> {
  try {
    const validation = ResetPasswordInputSchema.safeParse(input);
    if (!validation.success) {
      // Concatenate all error messages if multiple, or take the first one.
      const errorMessage = validation.error.errors.map(e => e.message).join(" ");
      return { success: false, message: errorMessage || "Invalid input." };
    }

    const { token, newPassword } = validation.data;

    // Simulate token validation
    console.log(`SIMULATION: Validating password reset token: ${token}`);
    // In a real app, query DB for token:
    // const storedToken = await db.passwordResetTokens.findUnique({ where: { token } });
    // if (!storedToken || storedToken.expiresAt < new Date() || storedToken.usedAt) {
    //   return { success: false, message: "This password reset link is invalid or has expired." };
    // }
    // const userId = storedToken.userId;

    console.log(`SIMULATION: Token ${token} is considered valid (for this mock).`);

    // Simulate password update
    // const hashedPassword = await hashPassword(newPassword); // Implement hashing
    // await db.user.update({ where: { id: userId }, data: { passwordHash: hashedPassword } });
    // await db.passwordResetTokens.update({ where: { token }, data: { usedAt: new Date() } });
    console.log(`SIMULATION: Password for user associated with token ${token} would be updated.`);
    console.log(`SIMULATION: New password (plain text, for demo): ${newPassword}`);


    return {
      success: true,
      message: "Your password has been successfully reset. You can now log in with your new password.",
    };

  } catch (error) {
    console.error("Error in resetPasswordAction:", error);
    return {
      success: false,
      message: "An unexpected error occurred while resetting your password. Please try again.",
    };
  }
}
