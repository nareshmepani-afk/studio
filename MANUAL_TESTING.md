# 🧪 Manual End-to-End Testing Protocol (Updated Jan 2026)

## The Protocol
*Refer to the top of this document for the philosophy of "The Clean Room" vs "The Mosh Pit".*

---

## Active Sprint Test Session

**Sprint ID:** `role-definition-update-2026-01-26`

**Objective:** To verify that the new role definitions are correctly implemented and displayed throughout the application.

**Base URL:** `https://studio--memory-weaver-8rk9t.us-central1.hosted.app/`

### Test Case 1: Role Display Verification
* **Objective:** To verify that the user's role is displayed on every page.

1. **`stu-role-tc1-ts1`**: Log in with a user account for each of the four roles: Host, Storyteller, Guest, and Interviewer.
2. **`stu-role-tc1-ts2`**: For each logged-in user, navigate through all the main pages of the application (e.g., `/dashboard`, `/add-memory`, `/settings`, `/remote/*`, `/archive/*`).
3. **`stu-role-tc1-ts3`**: **Witnessing Step:** Observe the UI on each page.
4. **`stu-role-tc1-ts4`**: **Expected Result:** The user's current role (e.g., "Role: Host") is clearly displayed in a consistent location on every page, such as the header or a user profile dropdown.

### Test Case 2: Host Role Verification
* **Objective:** To verify that a user with the 'Host' role has the correct permissions and UI.

1. **`stu-role-tc2-ts1`**: Using a test account with the 'Host' role, log in to the application.
2. **`stu-role-tc2-ts2`**: Navigate to the `/dashboard` and `/settings` pages.
3. **`stu-role-tc2-ts3`**: **Witnessing Step:** Observe the UI on each page.
4. **`stu-role-tc2-ts4`**: **Expected Result:** The user can see and interact with Host-specific elements, such as billing information, storage quota, and the ability to generate invite links for Storytellers.

### Test Case 3: Storyteller Role Verification
* **Objective:** To verify that a user with the 'Storyteller' role has the correct permissions and UI.

1. **`stu-role-tc3-ts1`**: As a Host, generate a Storyteller invite link.
2. **`stu-role-tc3-ts2`**: Open the generated link in a new browser or incognito window.
3. **`stu-role-tc3-ts3`**: **Witnessing Step:** Observe the UI.
4. **`stu-role-tc3-ts4`**: **Expected Result:** The user is taken to the `/remote/*` page and can record and upload a memory. They should not have access to any other parts of the application.

### Test Case 4: Guest Role Verification
* **Objective:** To verify that a user with the 'Guest' role has the correct permissions and UI.

1. **`stu-role-tc4-ts1`**: As a Host, create a Guest Access Pass and share the link.
2. **`stu-role-tc4-ts2`**: Open the shared link in a new browser or incognito window.
3. **`stu-role-tc4-ts3`**: **Witnessing Step:** Observe the UI.
4. **`stu-role-tc4-ts4`**: **Expected Result:** The user can view the shared archive but cannot access any other parts of the application, especially recording or account management features.

### Test Case 5: Interviewer Role Verification
* **Objective:** To verify that a user with the 'Interviewer' role has the correct permissions and UI.

1. **`stu-role-tc5-ts1`**: Using a test account with the 'Interviewer' role, log in to the application.
2. **`stu-role-tc5-ts2`**: Navigate to the interview dashboard.
3. **`stu-role-tc5-ts3`**: **Witnessing Step:** Observe the UI.
4. **`stu-role-tc5-ts4`**: **Expected Result:** The user can see and manage interview prompts but does not have access to Host-level settings like billing or storage.

---

## Test Session Archive
* [Archived: studio-remote-persistence-2026-01-25]
* [Archived: prompt-memory-creation-2024-05-25]
* [Archived: timeline-debug-2024-05-24]