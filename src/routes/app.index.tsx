import * as React from "react";
import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/app/")({
  component: AppHome,
});

function AppHome() {
  return <Navigate to="/selecao" replace />;
}
