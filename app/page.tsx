import LoginPage from "./(auth)/login/page";

export default function RootHomePage() {
  // Requirement 6A: Visiting the root URL shows ONLY the Login Screen.
  // No public role selection buttons or unrestricted access.
  return <LoginPage />;
}
