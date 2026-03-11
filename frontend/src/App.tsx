"use client";

import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Agentation } from "agentation";

import { router } from "@/router";
import { AuthProvider } from "@/lib/auth";
import "@/i18n";

const client = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 10 * 60_000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1
    }
  }
});

export default function App() {
  useEffect(() => {
    const savedTheme = localStorage.getItem("briefops:theme");
    document.documentElement.classList.toggle("dark", savedTheme === "dark");
  }, []);

  return (
    <QueryClientProvider client={client}>
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4200,
            className:
              "!rounded-[26px] !border !border-[#dbe4f3] !bg-[linear-gradient(180deg,#ffffff_0%,#f7f9fd_100%)] !px-4 !py-3 !text-[#162033] !shadow-[0_26px_70px_rgba(15,23,42,0.18)] dark:!border-white/10 dark:!bg-[#121826] dark:!text-white",
            success: {
              iconTheme: {
                primary: "#1f9d68",
                secondary: "#ffffff"
              }
            },
            error: {
              iconTheme: {
                primary: "#dc3f5f",
                secondary: "#ffffff"
              }
            },
            loading: {
              iconTheme: {
                primary: "#2563eb",
                secondary: "#ffffff"
              }
            }
          }}
        />
        {process.env.NODE_ENV === "development" ? <Agentation /> : null}
      </AuthProvider>
    </QueryClientProvider>
  );
}
