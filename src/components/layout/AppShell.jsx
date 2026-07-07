import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";

export default function AppShell({ children }) {
  return (
    <div className="md:flex min-h-screen">
      <Sidebar />
      <main className="flex-1 min-w-0 pb-20 md:pb-0">{children}</main>
      <BottomNav />
    </div>
  );
}
