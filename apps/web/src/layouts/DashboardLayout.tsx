import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";
import Footer from "../components/layout/Footer";

type Props = {
  children: React.ReactNode;
};

export default function DashboardLayout({ children }: Props) {
  return (
    <div className="min-h-screen bg-slate-50/50 font-sans text-slate-800 antialiased flex">
      {/* Fixed Left Sidebar */}
      <Sidebar />

      {/* Main Container Offset by Sidebar */}
      <div className="flex-1 flex flex-col min-w-0 pl-64 transition-all duration-300 min-h-screen">
        {/* Fixed Topbar */}
        <Topbar />

        {/* Content Body */}
        <main className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {children}
        </main>

        {/* Permanent Application Footer */}
        <Footer />
      </div>
    </div>
  );
}