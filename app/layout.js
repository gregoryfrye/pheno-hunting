export const metadata = {
  title: "Grow Tracker",
  description: "Personal grow tracking app",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: "#0A0C0A" }}>
        {children}
      </body>
    </html>
  );
}
