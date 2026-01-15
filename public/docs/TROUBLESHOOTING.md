### `ENOSPC: no space left on device` during `npm install`

**Symptom:** The `npm install` command fails with an error message indicating "no space left on device."

**Cause:** This typically occurs in resource-constrained development environments where the `node_modules` directory and npm's cache have grown too large.

**Solution:**
1.  **Remove `node_modules`:** Delete the local `node_modules` directory to clear out all installed packages.
    ```bash
    rm -rf node_modules
    ```
2.  **Clean the npm cache:** Force-clean the npm cache to remove any stored package data that may be consuming space.
    ```bash
    npm cache clean --force
    ```
3.  **Reinstall:** Run `npm install` again. The project dependencies will be re-downloaded and installed cleanly.