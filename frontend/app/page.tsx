"use client";
import { useState, useEffect } from "react";
import Particles from "./components/Particles";
import GradientText from "./components/GradientText";

const AlertIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10">
    <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10">
    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
  </svg>
);

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const loadingSteps = [
  "Establishing secure connection...",
  "Uploading APK payload...",
  "Extracting AndroidManifest.xml...",
  "Decompiling Dalvik bytecode...",
  "Mapping API calls & permissions...",
  "Analyzing native opcodes...",
  "Executing Random Forest model...",
  "Finalizing threat assessment..."
];

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string>("");
  
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isClosing, setIsClosing] = useState<boolean>(false);
  const [analysisStatus, setAnalysisStatus] = useState<string>("");
  const [prediction, setPrediction] = useState<string>("");
  const [confidenceScore, setConfidenceScore] = useState<number | null>(null);
  const [animatedScore, setAnimatedScore] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [checksum, setChecksum] = useState<string>("");

  const apiUrl: string = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setMessage("");
    }
  };

  const closeExpandedView = () => {
    if (!isProcessing) {
      setIsClosing(true);
      setIsExpanded(false); 
      
      setTimeout(() => {
        setFile(null); 
        setPrediction("");
        setConfidenceScore(null);
        setAnimatedScore(0);
        setCurrentStep(0);
        setAnalysisStatus("");
        setChecksum("");
        setMessage("");
        setIsClosing(false);
      }, 400); 
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select a file first.");
      return;
    }

    setIsExpanded(true);
    setAnalysisStatus("uploading"); 
    setPrediction("");
    setConfidenceScore(null);
    setAnimatedScore(0);
    setCurrentStep(0);
    setMessage("");

    const formData = new FormData();
    formData.append("apk", file);

    try {
      const response = await fetch(`${apiUrl}/upload`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data?.checksum) {
          setChecksum(data.checksum);
          setAnalysisStatus("pending"); 
        } else {
          setMessage("Upload succeeded, but no tracking ID (checksum) was returned by the API.");
          closeExpandedView();
        }
      } else {
        setMessage(`Upload failed with status: ${response.status}`);
        closeExpandedView();
      }
    } catch (error) {
      console.error(error);
      setMessage("A network error occurred while uploading. Is the backend running?");
      closeExpandedView();
    }
  };

  useEffect(() => {
    if (!checksum || analysisStatus !== "pending") return;

    let isActive = true;

    const checkStatus = async () => {
      try {
        const response = await fetch(`${apiUrl}/status/${checksum}`);
        if (!response.ok) throw new Error("Failed to fetch file status");

        const data = await response.json();
        if (!isActive) return;

        const status = data.status ?? "pending";

        if (status === "completed" || status === "complete") {
          setAnalysisStatus("complete");
          setConfidenceScore(typeof data.confidence_score === "number" ? data.confidence_score : null);
          
          setPrediction(data.prediction === 1 ? "Ransomware" : "Benign");
          setChecksum("");
          
        } else if (status === "failed") {
          setMessage("The Python classification service failed to analyze the file.");
          closeExpandedView();
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    };

    checkStatus();
    const intervalId = setInterval(checkStatus, 3000);

    return () => {
      isActive = false;
      clearInterval(intervalId);
    };
  }, [checksum, analysisStatus, apiUrl]);

  const isProcessing = analysisStatus === "pending" || analysisStatus === "uploading";

  useEffect(() => {
    if (analysisStatus === "pending") {
      const interval = setInterval(() => {
        setCurrentStep((prev) => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
      }, 700);
      return () => clearInterval(interval);
    }
  }, [analysisStatus]);

  useEffect(() => {
    if (analysisStatus === "complete" && confidenceScore !== null) {
      const timer = setTimeout(() => {
        setAnimatedScore(confidenceScore * 100);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [analysisStatus, confidenceScore]);

  const percent = animatedScore;
  let themeColorClass = "text-zinc-500";
  let barColorClass = "bg-zinc-500";
  let glowStyle = "none";

  if (analysisStatus === "complete" && confidenceScore !== null) {
    const finalPercent = confidenceScore * 100;
    if (finalPercent <= 50) {
      themeColorClass = "text-green-500";
      barColorClass = "bg-green-500";
      glowStyle = "0 0 10px rgba(34, 197, 94, 0.4)";
    } else if (finalPercent <= 80) {
      themeColorClass = "text-yellow-500";
      barColorClass = "bg-yellow-400";
      glowStyle = "0 0 10px rgba(250, 204, 21, 0.4)";
    } else {
      themeColorClass = "text-red-500";
      barColorClass = "bg-red-500";
      glowStyle = "0 0 10px rgba(239, 68, 68, 0.4)";
    }
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-zinc-50 dark:bg-black font-sans">
      
      <Particles 
        className="absolute inset-0 z-0 transition-all duration-1000" 
        particleCount={80} 
        particleColors={["#333333", "#ffffff", "#555555"]} 
        speed={isProcessing ? 1.5 : 0.1} 
      />

      <main className="relative z-10 flex w-full flex-col items-center px-4 text-center">
        
        <div 
          className={`fixed inset-0 z-40 bg-transparent backdrop-blur-[2px] transform-gpu transition-all duration-500 ease-out will-change-opacity ${
            isExpanded ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
          onClick={closeExpandedView}
        />

        <div 
          className={`flex flex-col items-center transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] transform-gpu z-10 relative ${
            isExpanded ? "opacity-0 -translate-y-8 scale-95 pointer-events-none" : "opacity-100 translate-y-0 scale-100"
          }`}
        >
          <div className="mb-6">
            <GradientText colors={["#5c5c5c", "#ffffff", "#9b9b9b", "#ffffff"]} animationSpeed={5} className="text-5xl md:text-6xl tracking-tight">
              RansomSentry
            </GradientText>
          </div>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-10 max-w-lg">
            Upload your APKs below to detect potential ransomware threats.
          </p>
        </div>

        <div 
          className={`relative z-50 w-full max-w-lg p-8 sm:p-10 transform-gpu will-change-transform transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden border border-zinc-200/50 dark:border-zinc-700/50 backdrop-blur-xl rounded-4xl
            ${isExpanded 
              ? "scale-[1.03] -translate-y-24 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] bg-white/70 dark:bg-zinc-900/60" 
              : "scale-100 translate-y-0 shadow-xl bg-white/80 dark:bg-zinc-900/50"
            }
          `}
          onClick={(e) => e.stopPropagation()}
        >
          
          {!isExpanded && analysisStatus === "" ? (
            <div className="flex flex-col gap-5 animate-in fade-in duration-300">
              <label className="block">
                <span className="sr-only">Choose file</span>
                <input type="file" accept=".apk" onChange={handleFileChange} className="block w-full text-sm text-zinc-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white/50 file:text-zinc-700 hover:file:bg-white/80 dark:file:bg-black/30 dark:file:text-zinc-300 dark:hover:file:bg-black/50 cursor-pointer transition-colors" />
              </label>

              <div className="relative group w-full">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-zinc-500 to-zinc-200 rounded-full blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                <button onClick={handleUpload} disabled={!file} className="relative w-full rounded-full bg-black dark:bg-zinc-50 text-white dark:text-black py-3 font-semibold transition-all duration-200 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden">
                  <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-12deg)_translateX(-100%)] group-hover:duration-1000 group-hover:[transform:skew(-12deg)_translateX(100%)]">
                    <div className="relative h-full w-10 bg-white/20 dark:bg-black/10" />
                  </div>
                  <span className="relative">Analyze File</span>
                </button>
              </div>

              {message && <p className="text-red-500 text-sm mt-2">{message}</p>}
            </div>
          ) : (
            
            <div className={`flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-500 ${isClosing ? "animate-out fade-out zoom-out-95 duration-400" : ""}`}>
              
              {!isProcessing && (
                <button onClick={closeExpandedView} className="absolute top-5 right-5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors z-50 bg-white/30 dark:bg-black/30 p-2 rounded-full backdrop-blur-md">
                  <CloseIcon />
                </button>
              )}

              {isProcessing ? (
                <div className="w-full py-6 flex flex-col items-center">
                  
                  <div className="relative flex justify-center items-center mb-8 w-24 h-24">
                    <div className="absolute inset-0 rounded-full border border-zinc-400/30 dark:border-zinc-600/30"></div>
                    <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-zinc-800 dark:border-t-zinc-200 border-r-zinc-800 dark:border-r-zinc-200 animate-[spin_1s_linear_infinite] opacity-80"></div>
                    <div className="w-8 h-8 bg-zinc-800 dark:bg-zinc-200 rounded-full animate-pulse shadow-[0_0_15px_rgba(0,0,0,0.3)] dark:shadow-[0_0_15px_rgba(255,255,255,0.3)]"></div>
                  </div>

                  <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-1 font-mono tracking-tight uppercase">
                    {analysisStatus === "uploading" ? "Transferring Payload" : "Analyzing Threats"}
                  </h3>
                  <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300 h-6 mb-8 transition-opacity duration-200">
                    {analysisStatus === "uploading" ? "Uploading APK securely..." : loadingSteps[currentStep]}
                  </p>
                  
                  <div className="flex gap-1.5 w-full h-3 justify-center px-4">
                    {loadingSteps.map((_, index) => {
                      const isActive = analysisStatus === "pending" && index <= currentStep;
                      return (
                        <div
                          key={index}
                          className={`flex-1 rounded-[2px] transition-all duration-300 ${
                            isActive 
                              ? "bg-zinc-800 dark:bg-zinc-200 shadow-[0_0_8px_rgba(0,0,0,0.3)] dark:shadow-[0_0_8px_rgba(255,255,255,0.3)]" 
                              : "bg-black/10 dark:bg-white/10"
                          }`}
                        />
                      );
                    })}
                  </div>
                  <div className="w-full flex justify-between px-4 mt-2">
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">0%</span>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">100%</span>
                  </div>

                </div>
              ) : (

                <div className="w-full pt-2">
                  <div className={`flex justify-center mb-4 ${themeColorClass} animate-in zoom-in-75 duration-300`}>
                    {prediction === "Ransomware" ? <AlertIcon /> : <CheckIcon />}
                  </div>
                  
                  <h3 className={`text-2xl font-bold tracking-tight mb-2 ${themeColorClass}`}>
                    {prediction === "Ransomware" ? "Threat Detected" : "File Appears Safe"}
                  </h3>
                  
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-8 px-2">
                    {prediction === "Ransomware" 
                      ? "High probability of malicious behavior. Ransomware signatures identified." 
                      : "No known ransomware signatures detected. Behavior appears benign."}
                  </p>

                  {confidenceScore !== null && (
                    <div className="bg-white/40 dark:bg-black/30 backdrop-blur-md p-5 rounded-2xl border border-white/50 dark:border-zinc-700/50 text-left shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                      <div className="flex justify-between items-end mb-3">
                        <span className="text-xs font-semibold uppercase tracking-widest text-zinc-600 dark:text-zinc-400">
                          Confidence Index
                        </span>
                        <span className={`text-xl font-black tabular-nums transition-colors duration-500 ${themeColorClass}`}>
                          {percent.toFixed(1)}%
                        </span>
                      </div>
                      
                      <div className="flex gap-1 w-full h-6">
                        {[...Array(24)].map((_, i) => {
                          const threshold = (i / 24) * 100;
                          const isActive = percent > threshold;
                          return (
                            <div
                              key={i}
                              className={`flex-1 transform-gpu -skew-x-12 transition-all duration-300 ease-out`}
                              style={{
                                transitionDelay: `${i * 15}ms`,
                                backgroundColor: isActive ? "" : "transparent",
                                opacity: isActive ? 1 : 0.2,
                                boxShadow: isActive ? glowStyle : "none",
                              }}
                            >
                               <div className={`w-full h-full ${isActive ? barColorClass : "bg-black/15 dark:bg-white/20"}`} />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <button onClick={closeExpandedView} className="mt-8 w-full py-3 rounded-xl bg-white/50 hover:bg-white/80 dark:bg-black/30 dark:hover:bg-black/50 backdrop-blur-md text-zinc-900 dark:text-zinc-100 text-sm font-semibold transition-colors border border-white/50 dark:border-zinc-700/50 shadow-sm">
                    Analyze Another File
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}