# Manual Testing Plan

This document outlines the manual testing procedures for MemoryWeaver.Studio. It should be updated as new features are added or existing ones are modified.

## 1. Authentication

### 1.1. User Registration

1.  Navigate to the `/register` page.
2.  Fill out the registration form with a unique email and a strong password.
3.  Verify that a new user is created in the database.
4.  Attempt to register with an existing email and verify that an appropriate error message is displayed.

### 1.2. User Login

1.  Navigate to the `/login` page.
2.  Enter the credentials of a registered user.
3.  Verify that the user is redirected to the dashboard upon successful login.
4.  Attempt to log in with incorrect credentials and verify that an appropriate error message is displayed.

### 1.3. Password Reset

1.  Navigate to the `/forgot-password` page.
2.  Enter the email address of a registered user.
3.  Verify that a password reset email is sent to the user's email address.
4.  Follow the instructions in the email to reset the password.
5.  Log in with the new password to confirm that it has been updated.

### 1.4. Session Management

1.  Log in to the application.
2.  Close the browser tab and reopen it.
3.  Verify that the user is still logged in.
4.  Log out of the application.
5.  Verify that the user is redirected to the login page and can no longer access authenticated routes.

## 2. Core Features

### 2.1. Memory Creation

1.  Navigate to the `/add-memory` page.
2.  Record a short video or audio clip.
3.  Add a title and description to the memory.
4.  Save the memory.
5.  Verify that the new memory appears on the timeline.

### 2.2. Timeline View

1.  Navigate to the `/timeline` page.
2.  Verify that all memories are displayed in chronological order.
3.  Use the filter options to filter memories by date or other criteria.

### 2.3. Memory Playback/Review

1.  Click on a memory card on the timeline.
2.  Verify that the memory playback page (`/review/[id]`) is displayed.
3.  Play the recorded media.
4.  Verify that the title and description are displayed correctly.

### 2.4. Memory Sharing

1.  On the memory playback page, click the "Share" button.
2.  Verify that a shareable link is generated.
3.  Open the link in a different browser or incognito window to simulate a guest user.

## 3. Studio & Remote Features

### 3.1. Studio Mode

1.  Navigate to the `/studio/[id]` page.
2.  Verify that the studio interface is displayed with all its components (Director Monitor, Metadata Inspector, etc.).
3.  Test the functionality of each component.

### 3.2. Remote Control

1.  From the studio page, generate a remote control link.
2.  Open the link on a separate device (e.g., a smartphone).
3.  Verify that the remote control interface is displayed.
4.  Test the remote control functionalities (e.g., starting/stopping recording, adjusting teleprompter speed).

### 3.3. Teleprompter

1.  In the studio, add text to the teleprompter.
2.  Verify that the text is displayed correctly on the teleprompter screen.
3.  Control the teleprompter (scroll speed, play/pause) from the studio and the remote control.

## 4. Guest Access

### 4.1. Guest Pass Generation

1.  As a host user, navigate to the settings page.
2.  Generate a new guest pass.
3.  Verify that the guest pass is created and displayed.

### 4.2. Guest Access to Memories

1.  Provide the guest pass to a guest user.
2.  As the guest user, access a shared memory link.
3.  Verify that the guest user can view the memory after entering the guest pass.

## 5. Settings

### 5.1. User Profile Settings

1.  Navigate to the `/settings` page.
2.  Update the user's profile information (e.g., name, avatar).
3.  Verify that the changes are reflected in the application.

### 5.2. Theme Toggle

1.  Locate the theme toggle button.
2.  Click the button to switch between light and dark themes.
3.  Verify that the application's theme changes accordingly.

## 6. Storyteller Remote Recording (Zero-Friction)

### 6.1. Invite Link Generation & Access
1.  As a **Host**, generate a Remote Invite Link.
2.  Verify the link format includes a valid `inviteId` (e.g., `/remote/inv-123`).
3.  Open the link in an **Incognito Window** (to ensure no Host session exists).
4.  Verify the **StorytellerBooth** UI loads without asking for a login.

### 6.2. Recording & Real-time Feedback
1.  Grant camera/microphone permissions when prompted.
2.  Start a recording and verify the **Visual Waveform** or **Timer** is active.
3.  Stop the recording and verify the "Review" state appears.

### 6.3. Direct-to-Storage Upload (STU-52)
1.  Click the "Send Memory" button.
2.  Verify a progress indicator appears.
3.  Confirm the **StorytellerSuccess** (STU-53) "Thank You" screen appears upon completion.
4.  **Backend Check**: Log in as Host and verify the file appears in the dashboard/Storage bucket under `storyteller-uploads/`.

## 7. Edge & Performance Testing

### 7.1. Guest Access Pass Expiration (STU-51)
1.  Generate a Guest Pass with a very short expiration (for testing).
2.  Verify that the "Pass Active" countdown timer in Settings reflects the remaining time.
3.  Attempt to access a memory after the pass expires and verify redirection to the "Access Denied" or "Renew Pass" page.

### 7.2. Network Interruption during Upload
1.  Start a Storyteller upload.
2.  Simulate a network disconnect (Toggle Airplane mode).
3.  Verify the UI provides a clear error message and an option to "Retry" without re-recording (if blob is still in memory).
