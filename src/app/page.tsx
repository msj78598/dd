"use client";
import { useState, useRef } from "react";
import { useImageAnalysis } from "@/hooks/useImageAnalysis";
import { Camera, Video, LayoutDashboard, ChevronLeft, Upload, FileSearch, Mic } from "lucide-react";

export default function SmartMeterPage() {
    const [mode, setMode] = useState<"none" | "photo" | "live">("none");
    const { analyzeImage, loading, result } = useImageAnalysis();
    const [preview, setPreview] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPreview(URL.createObjectURL(file));
            analyzeImage(file);
        }
    };

    const startLive = async () => {
        setMode("live");
        setTimeout(async () => {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: true });
            if (videoRef.current) videoRef.current.srcObject = stream;
        }, 100);
    };

    return (
        <main className="min-h-screen bg-black text-white p-4 pb-10">
            <div className="flex items-center gap-2 mb-8 mt-4">
                <LayoutDashboard className="text-blue-500" />
                <h1 className="text-xl font-bold">SMART METER AI 2.6</h1>
            </div>

            {mode === "none" && (
                <div className="grid grid-cols-1 gap-6">
                    <button onClick={() => setMode("photo")} className="flex flex-col items-center p-10 bg-zinc-900 border border-zinc-800 rounded-3xl">
                        <Camera size={48} className="text-blue-500 mb-4" />
                        <span className="font-bold">فحص فوتوغرافي (صور)</span>
                    </button>
                    <button onClick={startLive} className="flex flex-col items-center p-10 bg-zinc-900 border border-zinc-800 rounded-3xl">
                        <Video size={48} className="text-red-500 mb-4" />
                        <span className="font-bold text-red-500">المفتش المباشر (فيديو)</span>
                    </button>
                </div>
            )}

            {mode !== "none" && (
                <button onClick={() => setMode("none")} className="mb-6 text-zinc-400 flex items-center gap-1">
                    <ChevronLeft size={16} /> العودة للرئيسية
                </button>
            )}

            {mode === "photo" && (
                <div className="flex flex-col gap-4">
                    <label className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-zinc-800 rounded-3xl bg-zinc-900 cursor-pointer overflow-hidden">
                        {preview ? <img src={preview} className="w-full h-full object-cover" /> : <Upload className="text-zinc-600" />}
                        <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                    </label>
                    {loading && <div className="p-4 bg-blue-600/20 text-blue-400 rounded-xl text-center animate-pulse">جارِ التدقيق الهندسي...</div>}
                    {result && <div className="p-4 bg-zinc-900 border border-blue-500/30 rounded-xl text-sm leading-relaxed">{result}</div>}
                </div>
            )}

            {mode === "live" && (
                <div className="flex flex-col gap-4">
                    <video ref={videoRef} autoPlay playsInline className="w-full rounded-3xl border border-zinc-800" />
                    <div className="flex justify-center"><button className="p-6 bg-blue-600 rounded-full"><Mic size={28} /></button></div>
                </div>
            )}
        </main>
    );
}