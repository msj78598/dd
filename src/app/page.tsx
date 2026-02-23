"use client";
import { useState, useRef, useEffect } from "react";
import { useImageAnalysis } from "@/hooks/useImageAnalysis";
import { Scan, Video, Upload, Play, RefreshCw, Zap, ShieldCheck } from "lucide-react";
import { Camera } from "lucide-react"; // تم فصلها لترتيب الاستيراد

export default function SmartMeterPage() {
    const [activeTab, setActiveTab] = useState<"photo" | "live">("photo");
    const { analyzeImage, loading, result, resetAnalysis } = useImageAnalysis();
    const [preview, setPreview] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [cameraActive, setCameraActive] = useState(false);

    // مرجع لحالة التحميل لمنع تداخل الطلبات أثناء البث المباشر
    const loadingRef = useRef(loading);
    useEffect(() => { loadingRef.current = loading; }, [loading]);

    // إيقاف الكاميرا تماماً عند التبديل لقسم الصور
    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
        setCameraActive(false);
    };

    const handleTabSwitch = (tab: "photo" | "live") => {
        setActiveTab(tab);
        if (tab === "photo") {
            stopCamera();
        } else {
            resetAnalysis();
        }
    };

    const startLive = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" },
                audio: false // ✅ إغلاق المايكروفون هنا يقتل الصدى (Echo) تماماً
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setCameraActive(true);
            }
        } catch (err) {
            alert("⚠️ يرجى تفعيل صلاحيات الكاميرا في المتصفح.");
        }
    };

    // ✅ دالة التقاط الصور الصامتة من الفيديو وإرسالها لنفس المحرك الناجح
    const captureAndAnalyze = () => {
        if (videoRef.current && !loadingRef.current) {
            const canvas = document.createElement("canvas");
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                canvas.toBlob((blob) => {
                    if (blob) {
                        // تحويل اللقطة لملف وهمي وتمريرها لنفس المحرك الذي تستخدمه في الصور!
                        const file = new File([blob], "live-frame.jpg", { type: "image/jpeg" });
                        analyzeImage(file);
                    }
                }, "image/jpeg", 0.8);
            }
        }
    };

    // مؤقت البث المباشر (يقرأ الكاميرا ويحللها كل 8 ثواني)
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (activeTab === "live" && cameraActive) {
            interval = setInterval(() => {
                captureAndAnalyze();
            }, 8000);
        }
        return () => clearInterval(interval);
    }, [activeTab, cameraActive]);

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
                    <button onClick={() => handleTabSwitch("photo")} className={`flex-1 py-4 rounded-[1.5rem] font-bold text-sm flex items-center justify-center gap-2 transition-all ${activeTab === "photo" ? "bg-blue-600 shadow-lg" : "text-zinc-500"}`}><Scan size={18} /> صور</button>
                    <button onClick={() => handleTabSwitch("live")} className={`flex-1 py-4 rounded-[1.5rem] font-bold text-sm flex items-center justify-center gap-2 transition-all ${activeTab === "live" ? "bg-red-600 shadow-lg" : "text-zinc-500"}`}><Video size={18} /> بث مباشر</button>
                </div>

                <div className="relative aspect-[3/4] w-full bg-zinc-900 border-2 border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl mb-8">
                    {activeTab === "photo" ? (
                        preview ? <img src={preview} className="w-full h-full object-cover" alt="Meter" /> :
                            <label className="flex flex-col items-center justify-center h-full cursor-pointer"><Upload size={48} className="text-blue-500 mb-4 animate-bounce" /><span className="text-zinc-500 font-bold">ارفع صورة العداد للتدقيق</span><input type="file" onChange={onSelectFile} className="hidden" /></label>
                    ) : (
                        <div className="w-full h-full bg-black flex items-center justify-center relative">
                            {/* ✅ تمت إضافة muted هنا للضمان الإضافي ضد الصدى */}
                            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

                            {!cameraActive && <button onClick={startLive} className="absolute bg-red-600 px-8 py-4 rounded-2xl font-bold flex items-center gap-2 shadow-2xl"><Camera size={20} /> تفعيل المفتش المباشر</button>}

                            {cameraActive && loading && (
                                <div className="absolute top-6 right-6 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 border border-white/10">
                                    <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                                    <span className="text-[10px] font-bold tracking-widest uppercase">جاري التحليل...</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {activeTab === "photo" && preview && !result && (
                    <button onClick={() => selectedFile && analyzeImage(selectedFile)} disabled={loading} className="w-full py-6 bg-blue-600 rounded-3xl font-black text-sm flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl disabled:opacity-50">
                        {loading ? <RefreshCw className="animate-spin" /> : <Play fill="white" />} {loading ? "جارِ الفحص الهندسي..." : "بـدء الـتـحـلـيـل الـفـنـي"}
                    </button>
                )}

                {result && (
                    <div className="bg-zinc-900 p-8 rounded-[2.5rem] border-t-4 border-blue-600 animate-in slide-in-from-bottom-5 shadow-2xl">
                        <h3 className="text-blue-500 font-black text-[10px] uppercase mb-4 tracking-widest">التقرير الفني المعتمد</h3>
                        <p className="text-sm leading-relaxed text-zinc-300 whitespace-pre-wrap font-medium">{result}</p>
                    </div>
                )}
            </div>
        </main>
    );
}