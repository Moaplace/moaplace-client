import { Routes, Route } from "react-router-dom";
import { APIProvider } from "@vis.gl/react-google-maps";

import { Toaster } from "@/components/ui/sonner";
import HomePage from "@/pages/HomePage";
import RoomPage from "@/pages/RoomPage";
import WidgetShowcase from "@/pages/WidgetShowcase";

function App() {
  return (
    <APIProvider apiKey={__GOOGLE_MAPS_API_KEY__}>
      <div className="min-h-dvh bg-background">
        <Routes>
          <Route path="/room/:roomId" element={<RoomPage />} />
          <Route path="*" element={
            <main className="max-w-2xl mx-auto px-5">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/widget-showcase" element={<WidgetShowcase />} />
              </Routes>
            </main>
          } />
        </Routes>
        <Toaster position="bottom-center" />
      </div>
    </APIProvider>
  );
}

export default App;
