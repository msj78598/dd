"use client";
import { useState, useRef, useEffect } from "react";
import { useImageAnalysis } from "@/hooks/useImageAnalysis";
import { Scan, Video, Upload, Play, RefreshCw, Zap, Mic, Camera, ShieldCheck, AlertTriangle } from "lucide-react";

export default function SmartMeterPage() {
    const [activeTab, setActiveTab] = useState<"photo" | "live">("photo");
    const { analyzeImage, loading, result, resetAnalysis } = useImageAnalysis();
    const [preview, setPreview] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [cameraActive, setCameraActive] = useState(false);

    const startLive = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" },
                audio: true
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setCameraActive(true);
            }
        } catch (err) {
            alert("⚠️ يرجى تفعيل صلاحيات الكاميرا في المتصفح لبدء البث المباشر.");
        }
    };

    const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setPreview(URL.createObjectURL(file));
            resetAnalysis();
        }
    };

    return (
        <main className="min-h-screen bg-[#050505] text-white p-6 font-sans rtl" dir="rtl">
            <div className="max-w-xl mx-auto">
                <div className="flex items-center justify-between mb-8 border-b border-zinc-800 pb-5">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600 p-2 rounded-xl shadow-lg"><Zap size={22} fill="white" /></div>
                        <h1 className="text-xl font-black uppercase tracking-tighter">Supervisor AI v4.6</h1>
                    </div>
                    <ShieldCheck className="text-zinc-700" size={24} />
                </div>

                <div className="flex p-1 bg-zinc-900 rounded-[1.8rem] border border-zinc-800 mb-8">
                    <button onClick={() => { setActiveTab("photo"); setCameraActive(false); }} className={`flex-1 py-4 rounded-[1.5rem] font-bold text-sm flex items-center justify-center gap-2 transition-all ${activeTab === "photo" ? "bg-blue-600 shadow-lg" : "text-zinc-500"}`}><Scan size={18} /> صور</button>
                    <button onClick={() => { setActiveTab("live"); resetAnalysis(); }} className={`flex-1 py-4 rounded-[1.5rem] font-bold text-sm flex items-center justify-center gap-2 transition-all ${activeTab === "live" ? "bg-red-600 shadow-lg" : "text-zinc-500"}`}><Video size={18} /> بث مباشر</button>
                </div>

                <div className="relative aspect-[3/4] w-full bg-zinc-900 border-2 border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl mb-8">
                    {activeTab === "photo" ? (
                        preview ? <img src={preview} className="w-full h-full object-cover" alt="Meter" /> :
                            <label className="flex flex-col items-center justify-center h-full cursor-pointer"><Upload size={48} className="text-blue-500 mb-4 animate-bounce" /><span className="text-zinc-500 font-bold">ارفع صورة العداد للتدقيق</span><input type="file" onChange={onSelectFile} className="hidden" /></label>
                    ) : (
                        <div className="w-full h-full bg-black flex items-center justify-center">
                            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                            {!cameraActive && <button onClick={startLive} className="absolute bg-red-600 px-8 py-4 rounded-2xl font-bold flex items-center gap-2 shadow-2xl"><Camera size={20} /> تفعيل المفتش المباشر</button>}
                        </div>
                    )}
                </div>

                {activeTab === "photo" && preview && !result && (
                    <button onClick={() => selectedFile && analyzeImage(selectedFile)} disabled={loading} className="w-full py-6 bg-blue-600 rounded-3xl font-black text-sm flex items-center justify-center gap-3 active:scale-95 transition-all shadow-[0_10px_30px_rgba(37,99,235,0.3)] disabled:opacity-50">
                        {loading ? <RefreshCw className="animate-spin" /> : <Play fill="white" />} {loading ? "جارِ الفحص الهندسي..." : "بـدء الـتـحـلـيـل الـفـنـي"}
                    </button>
                )}

                {result && (
                    <div className="bg-zinc-900 p-8 rounded-[2.5rem] border-t-4 border-blue-600 animate-in slide-in-from-bottom-5">
                        <div className="flex items-center gap-2 mb-4 text-blue-500 font-black text-[10px] uppercase tracking-widest">
                            <ShieldCheck size={14} /> التقرير الفني المعتمد
                        </div>
                        {result.startsWith("❌") || result.startsWith("⚠️") ? (
                            <div className="flex items-start gap-2 text-amber-500 bg-amber-500/10 p-4 rounded-xl border border-amber-500/20">
                                <AlertTriangle size={20} className="shrink-0" />
                                <p className="text-sm font-medium">{result}</p>
                            </div>
                        ) : (
                            <p className="text-sm leading-relaxed text-zinc-300 whitespace-pre-wrap font-medium">{result}</p>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}