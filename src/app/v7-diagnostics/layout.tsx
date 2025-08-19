// This layout ensures the diagnostics page renders as a raw HTML file without the app's standard UI.
export default function DiagnosticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
