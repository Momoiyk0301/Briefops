import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import { router } from "@/router";
import { AuthProvider } from "@/lib/auth";

const client = new QueryClient();

const savedTheme = localStorage.getItem("briefops:theme");
document.documentElement.classList.toggle("dark", savedTheme === "dark");

export default function App() {
  return (
    <QueryClientProvider client={client}>
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
}
