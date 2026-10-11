import "./i18n";
import { MotionConfig } from "motion/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { createQueryClient } from "./query/queryClient";

import App from "./App.tsx";
import "./index.css";
import "./styles/base.css";

const queryClient = createQueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user"><App /></MotionConfig>
    </QueryClientProvider>
  </StrictMode>,
);
