import { Routes, Route } from "react-router-dom";

import { Toaster } from "@/components/ui/sonner";
import WidgetShowcase from "@/pages/WidgetShowcase";

function App() {
  return (
    <div className="min-h-dvh bg-background">
      <main className="max-w-xl mx-auto px-4">
        <Routes>
          <Route path="/" element={<div>Home</div>} />
          <Route path="/widget-showcase" element={<WidgetShowcase />} />
        </Routes>
      </main>
      <Toaster position="bottom-center" />
    </div>
  );
}

export default App;
