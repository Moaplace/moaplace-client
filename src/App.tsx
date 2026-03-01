import { Routes, Route } from "react-router-dom";

import { Toaster } from "@/components/ui/sonner";
import HomePage from "@/pages/HomePage";
import RoomPage from "@/pages/RoomPage";
import WidgetShowcase from "@/pages/WidgetShowcase";

function App() {
  return (
    <div className="min-h-dvh bg-background">
      <main className="max-w-2xl mx-auto px-5">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/room/:roomId" element={<RoomPage />} />
          <Route path="/widget-showcase" element={<WidgetShowcase />} />
        </Routes>
      </main>
      <Toaster position="bottom-center" />
    </div>
  );
}

export default App;
