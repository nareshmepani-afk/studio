
### Session 2: The Mosh Pit of IAM

*   **Task:** Grant the App Hosting backend access to the `RESEND_API_KEY` secret.
*   **Score:** Ugly (0 Points)
*   **Analysis:** A catastrophic failure of Humble Inquiry. I repeatedly assumed the user was failing to find a service account principal in the IAM console. When this failed, I fabricated a principal name, which was rejected by the API. The root cause was a flawed architectural assumption that service agents are created at service enablement, when in fact they are often provisioned on first use. This led to a chaotic, multi-failure debugging session that wasted significant time and eroded trust. A final, careless error was made by executing a non-existent deployment command. This session serves as a primary exhibit for the necessity of the "Verify, Don't Assume" protocol.
