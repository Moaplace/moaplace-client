import { Routes, Route } from "react-router-dom";

import { Toaster } from "@/components/ui/sonner";
import WidgetShowcase from "@/pages/WidgetShowcase";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<div>Home</div>} />
        <Route path="/widget-showcase" element={<WidgetShowcase />} />
      </Routes>
      <Toaster position="bottom-center" />
    </>
  );
}

export default App;
