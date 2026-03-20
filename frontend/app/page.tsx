"use client";
import { useState } from "react";
import Particles from "./components/Particles"; 
import GradientText from "./components/GradientText";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setMessage("");
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select a file first.");
      return;
    }

    setIsLoading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("apk", file);

    try {
      const response = await fetch("http://localhost:3000/api/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setMessage("File uploaded successfully!");
        setFile(null);
      } else {
        setMessage("Upload failed. Please try again.");
      }
    } catch (error) {
      console.error(error);
      setMessage("An error occurred while uploading.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-zinc-50 dark:bg-black font-sans">
      
      <Particles
        className="absolute inset-0"
        particleCount={100}
        particleColors={["#333333", "#ffffff", "#555555"]} 
        speed={0.2}
      />

      <main className="relative z-10 flex w-full max-w-2xl flex-col items-center px-4 text-center">
        
        <div className="mb-6">
          <GradientText
            colors={["#5c5c5c", "#ffffff", "#9b9b9b", "#ffffff"]}
            animationSpeed={5}
            className="text-5xl md:text-6xl tracking-tight"
          >
            RansomSentry
          </GradientText>
        </div>

        <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-10 max-w-lg">
          Upload your APKs below to detect potential ransomware threats.
        </p>

        <div className="w-full max-w-md p-8 bg-white/80 dark:bg-zinc-900/50 backdrop-blur-sm rounded-4xl shadow-xl border border-zinc-200 dark:border-zinc-800">
          <div className="flex flex-col gap-4">
            <label className="block">
              <span className="sr-only">Choose file</span>
              <input
                type="file"
                accept=".apk"
                onChange={handleFileChange}
                className="block w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-zinc-100 file:text-zinc-700 hover:file:bg-zinc-200 dark:file:bg-zinc-800 dark:file:text-zinc-300 dark:hover:file:bg-zinc-700 cursor-pointer"
              />
            </label>

            <div className="relative group w-full">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-zinc-500 to-zinc-200 rounded-full blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
              
              <button
                onClick={handleUpload}
                disabled={isLoading || !file}
                className="relative w-full rounded-full bg-black dark:bg-zinc-50 text-white dark:text-black py-3 font-semibold transition-all duration-200 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
              >
                <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-12deg)_translateX(-100%)] group-hover:duration-1000 group-hover:[transform:skew(-12deg)_translateX(100%)]">
                  <div className="relative h-full w-10 bg-white/20 dark:bg-black/10" />
                </div>

                <span className="relative">
                  {isLoading ? "Uploading..." : "Analyze File"}
                </span>
              </button>
            </div>

            {message && (
              <p
                className={`text-sm font-medium ${
                  message.includes("success") ? "text-green-600" : "text-red-500"
                }`}
              >
                {message}
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}