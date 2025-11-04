import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "CareerAI Pro - Advanced Resume Analysis Platform" },
    { name: "description", content: "Upload your resume and get AI-powered insights to enhance your career prospects" },
  ];
}

export default function Home() {
  return <Welcome />;
}
