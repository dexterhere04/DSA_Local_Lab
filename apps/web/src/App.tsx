import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { DashboardPage } from "./pages/DashboardPage";
import { GenerateProblemPage } from "./pages/GenerateProblemPage";
import { SolveProblemPage } from "./pages/SolveProblemPage";
import { SubmissionHistoryPage } from "./pages/SubmissionHistoryPage";
import { TopicExplorerPage } from "./pages/TopicExplorerPage";
import { SettingsPage } from "./pages/SettingsPage";

export function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/generate" element={<GenerateProblemPage />} />
        <Route path="/solve" element={<SolveProblemPage />} />
        <Route path="/history" element={<SubmissionHistoryPage />} />
        <Route path="/topics" element={<TopicExplorerPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
