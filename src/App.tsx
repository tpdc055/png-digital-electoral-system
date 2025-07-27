import React from "react";
import { Toaster } from "@/components/ui/sonner";
import { AuthenticatedApp } from "./components/AuthenticatedApp";

function App() {
  return (
    <>
      <AuthenticatedApp />
      <Toaster />
    </>
  );
}

export default App;
