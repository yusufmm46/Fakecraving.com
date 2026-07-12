import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import Footer from "./Footer";

export default function AppShell({ children }) {
  return (
    <div className="md:flex min-h-screen">
      <Sidebar />
      <main className="flex-1 min-w-0 flex flex-col pb-20 md:pb-0">
        <div className="flex-1">{children}</div>
        <Footer />
      </main>
      <BottomNav />
    </div>
  );
}
