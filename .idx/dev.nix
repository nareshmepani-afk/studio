# To learn more about how to use Nix to configure your environment
# see: https://firebase.google.com/docs/studio/customize-workspace
{pkgs}: {
  # Which nixpkgs channel to use.
  channel = "stable-23.11"; # or "unstable"

  # Use https://search.nixos.org/packages to find packages
  packages = [ pkgs.nodejs_20 pkgs.zulu ];

  # Sets environment variables in the workspace
  env = {};

  # This adds a file watcher to startup the firebase emulators. The emulators will only start if
  # a firebase.json file is written into the user's directory
  services.firebase.emulators = {
    detect = true;
    projectId = "demo-app";
    services = [ "auth" "firestore" ];
  };

  idx = {
    # Search for the extensions you want on https://open-vsx.org/ and use "publisher.id"
    extensions = [];

    workspace = {
      # Runs when a workspace is created
      onCreate = {
        default.openFiles = [ "src/app/page.tsx" ];
        # Periodic cleanup can be simulated on start
        cleanup = "chmod +x scripts/cleanup-logs.sh && ./scripts/cleanup-logs.sh";
      };
      # This is the correct way to handle secrets in this environment.
      # It runs in the interactive workspace after the build, so it has access to the secret.txt file.
      # It creates a standard .env file that will be automatically loaded by the Next.js dev server.
      onStart = {
        create-env = "cp /home/user/studio/secret.txt .env.local";
        cleanup = "./scripts/cleanup-logs.sh";
      };
    };

    # Enable previews and customize configuration
    previews = {
      enable = true;
      previews = {
        web = {
          command = [ "npm" "run" "dev" "--" "--port" "$PORT" "--hostname" "0.0.0.0" ];
          manager = "web";
        };
      };
    };
  };
}
