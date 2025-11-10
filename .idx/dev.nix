# To learn more about how to use Nix to configure your environment
# see: https://firebase.google.com/docs/studio/customize-workspace
{pkgs}: {
  # Which nixpkgs channel to use.
  channel = "stable-23.11"; # or "unstable"
  # Use https://search.nixos.org/packages to find packages
  packages = [
    pkgs.nodejs_20,
    pkgs.zulu,
    # Add a comprehensive set of libraries required by Playwright/Chromium
    pkgs.glib,
    pkgs.nss,
    pkgs.nspr,
    pkgs.dbus,
    pkgs.atk,
    pkgs.at-spi2-atk,
    pkgs.libxkbcommon,
    pkgs.libXshmfence,
    pkgs.pango,
    pkgs.cairo,
    pkgs.libepoxy,
    pkgs.gdk-pixbuf,
    pkgs.libdrm,
    pkgs.mesa,
    pkgs.udev,
    pkgs.alsaLib,
    pkgs.at-spi2-core,
    pkgs.libX11,
    pkgs.libxcb,
    pkgs.libXcomposite,
    pkgs.libXdamage,
    pkgs.libXext,
    pkgs.libXfixes,
    pkgs.libXrandr,
    pkgs.libXinerama,
    pkgs.expat,
    pkgs.cups
  ];
  # Sets environment variables in the workspace
  env = {};
  # This adds a file watcher to startup the firebase emulators. The emulators will only start if
  # a firebase.json file is written into the user's directory
  services.firebase.emulators = {
    detect = true;
    projectId = "demo-app";
    services = ["auth", "firestore"];
  };
  idx = {
    # Search for the extensions you want on https://open-vsx.org/ and use "publisher.id"
    extensions = [
      # "vscodevim.vim"
    ];
    workspace = {
      onCreate = {
        default.openFiles = [
          "src/app/page.tsx"
        ];
      };
    };
    # Enable previews and customize configuration
    previews = {
      enable = true;
      previews = {
        web = {
          command = ["npm", "run", "dev", "--", "--port", "$PORT", "--hostname", "0.0.0.0"];
          manager = "web";
        };
      };
    };
  };
}
