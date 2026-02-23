"use client";
import { useState, useRef, useEffect } from "react";
import { useImageAnalysis } from "@/hooks/useImageAnalysis";
import { Scan, Video, Upload, Play, RefreshCw, Zap, ShieldCheck, Share2, PlusCircle, Layers, CheckSquare } from "lucide-react";
import { Camera } from "lucide-react";

export default function SmartMeterPage() {
    // ✅ إضافة التبويب الثالث "deep" للفحص الدقيق
    const [activeTab, setActiveTab] = useState<"photo" | "live" | "deep">("photo");
    const { analyzeImage, loading, result, resetAnalysis } = useImageAnalysis();

    const [preview, setPreview] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [currentFile, setCurrentFile] = useState<File | null>(null);

    // ✅ حالات جديدة لإدارة الصور المتعددة في الفحص الدقيق
    const [multipleFiles, setMultipleFiles] = useState<File[]>([]);
    const [multiplePreviews, setMultiplePreviews] = useState<string[]>([]);

    const videoRef = useRef<HTMLVideoElement>(null);
    const [cameraActive, setCameraActive] = useState(false);

    const loadingRef = useRef(loading);
    useEffect(() => { loadingRef.current = loading; }, [loading]);

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
        setCameraActive(false);
    };

    const handleTabSwitch = (tab: "photo" | "live" | "deep") => {
        setActiveTab(tab);
        if (tab !== "live") {
            stopCamera();
        }
        resetAnalysis();
    };

    const startLive = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" },
                audio: false
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setCameraActive(true);
            }
        } catch (err) {
            alert("⚠️ يرجى تفعيل صلاحيات الكاميرا في المتصفح.");
        }
    };

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
                        const file = new File([blob], "live-frame.jpg", { type: "image/jpeg" });
                        setCurrentFile(file);
                        analyzeImage(file);
                    }
                }, "image/jpeg", 0.8);
            }
        }
    };

    const handleNewInspection = () => {
        setPreview(null);
        setSelectedFile(null);
        setCurrentFile(null);
        setMultipleFiles([]);
        setMultiplePreviews([]);
        resetAnalysis();
    };

    const handleShare = async () => {
        if (!result) return;

        const currentDate = new Date().toLocaleString('ar-SA', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        });

        const shareText = `📋 *تـقـريـر فـحـص مـيـدانـي*\n`
            + `ــــــــــــــــــــــــــــــــــــــــ\n`
            + `📅 *التاريخ والوقت:* ${currentDate}\n\n`
            + `🔍 *النتائج الفنية:*\n${result}\n\n`
            + `ــــــــــــــــــــــــــــــــــــــــ\n`
            + `✅ *Smart Meter AI Supervisor*`;

        try {
            if (navigator.canShare && currentFile && navigator.canShare({ files: [currentFile] })) {
                await navigator.share({
                    files: [currentFile],
                    title: 'تقرير فحص العداد',
                    text: shareText
                });
            }
            else if (navigator.share) {
                await navigator.share({
                    title: 'تقرير فحص العداد',
                    text: shareText
                });
            }
            else {
                const encodedText = encodeURIComponent(shareText);
                window.open(`https://wa.me/?text=${encodedText}`, '_blank');
            }
        } catch (err) {
            console.log("تم إلغاء المشاركة أو حدث خطأ:", err);
        }
    };

    const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setCurrentFile(file);
            setPreview(URL.createObjectURL(file));
            resetAnalysis();
        }
    };

    // ✅ دالة جديدة لاختيار عدة صور لتبويب الفحص الدقيق
    const onSelectMultipleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            setMultipleFiles(files);
            setMultiplePreviews(files.map(f => URL.createObjectURL(f)));
            setCurrentFile(files[0]); // تعيين الصورة الأولى للمشاركة
            resetAnalysis();
        }
    };

    return (
        <main className="min-h-screen bg-[#050505] text-white p-6 font-sans rtl" dir="rtl">
            <div className="max-w-xl mx-auto pb-10">
                <div className="flex items-center justify-between mb-8 border-b border-zinc-800 pb-5">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600 p-2 rounded-xl shadow-lg"><Zap size={22} fill="white" /></div>
                        <h1 className="text-xl font-black uppercase tracking-tighter">Supervisor AI v5.0</h1>
                    </div>
                    <ShieldCheck className="text-zinc-700" size={24} />
                </div>

                {/* ✅ تم تحديث الأزرار لتشمل 3 خيارات */}
                <div className="flex p-1 bg-zinc-900 rounded-[1.8rem] border border-zinc-800 mb-8">
                    <button onClick={() => handleTabSwitch("photo")} className={`flex-1 py-4 rounded-[1.5rem] font-bold text-sm flex items-center justify-center gap-2 transition-all ${activeTab === "photo" ? "bg-blue-600 shadow-lg" : "text-zinc-500"}`}><Scan size={18} /> سريع</button>
                    <button onClick={() => handleTabSwitch("live")} className={`flex-1 py-4 rounded-[1.5rem] font-bold text-sm flex items-center justify-center gap-2 transition-all ${activeTab === "live" ? "bg-red-600 shadow-lg" : "text-zinc-500"}`}><Video size={18} /> مباشر</button>
                    <button onClick={() => handleTabSwitch("deep")} className={`flex-1 py-4 rounded-[1.5rem] font-bold text-sm flex items-center justify-center gap-2 transition-all ${activeTab === "deep" ? "bg-emerald-600 shadow-lg text-white" : "text-zinc-500"}`}><Layers size={18} /> دقيق</button>
                </div>

                <div className="relative aspect-[3/4] w-full bg-zinc-900 border-2 border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl mb-8 p-2">
                    {activeTab === "photo" && (
                        preview ? <img src={preview} className="w-full h-full object-cover rounded-[2rem]" alt="Meter" /> :
                            <label className="flex flex-col items-center justify-center h-full cursor-pointer hover:bg-zinc-800/50 transition-colors rounded-[2rem]"><Upload size={48} className="text-blue-500 mb-4 animate-bounce" /><span className="text-zinc-500 font-bold">ارفع صورة العداد للتدقيق</span><input type="file" onChange={onSelectFile} className="hidden" /></label>
                    )}

                    {activeTab === "live" && (
                        <div className="w-full h-full bg-black flex items-center justify-center relative rounded-[2rem] overflow-hidden">
                            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

                            {!cameraActive && <button onClick={startLive} className="absolute bg-red-600 px-8 py-4 rounded-2xl font-bold flex items-center gap-2 shadow-2xl active:scale-95 transition-all"><Camera size={20} /> تفعيل المفتش المباشر</button>}

                            {cameraActive && !loading && !result && (
                                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full px-8">
                                    <button onClick={captureAndAnalyze} className="w-full bg-blue-600 hover:bg-blue-500 text-white px-6 py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-[0_10px_30px_rgba(37,99,235,0.4)] active:scale-95 transition-all">
                                        <Scan size={20} /> التقاط وتحليل العداد
                                    </button>
                                </div>
                            )}

                            {cameraActive && loading && (
                                <div className="absolute top-6 right-6 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 border border-white/10">
                                    <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                                    <span className="text-[10px] font-bold tracking-widest uppercase">جاري التحليل...</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ✅ التبويب الجديد: منطقة الرفع المتعدد */}
                    {activeTab === "deep" && (
                        multiplePreviews.length > 0 ? (
                            <div className="w-full h-full overflow-y-auto p-2 grid grid-cols-2 gap-2 content-start">
                                {multiplePreviews.map((src, idx) => (
                                    <img key={idx} src={src} className="w-full h-32 object-cover rounded-xl border border-zinc-700" alt={`Scan ${idx + 1}`} />
                                ))}
                            </div>
                        ) : (
                            <label className="flex flex-col items-center justify-center h-full cursor-pointer hover:bg-zinc-800/50 rounded-[2rem] transition-colors text-center px-6">
                                <CheckSquare size={48} className="text-emerald-500 mb-4 animate-pulse" />
                                <span className="text-emerald-500 font-bold mb-2">الفحص الشامل والمطابقة</span>
                                <span className="text-zinc-500 text-xs">حدد عدة صور معاً (للصندوق، القاطع، शاشات التيار، والكلامب ميتر)</span>
                                <input type="file" multiple onChange={onSelectMultipleFiles} className="hidden" />
                            </label>
                        )
                    )}
                </div>

                {/* ✅ أزرار التحليل حسب التبويب */}
                {activeTab === "photo" && preview && !result && (
                    <button onClick={() => selectedFile && analyzeImage(selectedFile as any)} disabled={loading} className="w-full py-6 bg-blue-600 rounded-3xl font-black text-sm flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl disabled:opacity-50">
                        {loading ? <RefreshCw className="animate-spin" /> : <Play fill="white" />} {loading ? "جارِ الفحص السريع..." : "بـدء الـتـحـلـيـل الـسـريـع"}
                    </button>
                )}

                {activeTab === "deep" && multipleFiles.length > 0 && !result && (
                    <button onClick={() => analyzeImage(multipleFiles as any)} disabled={loading} className="w-full py-6 bg-emerald-600 rounded-3xl font-black text-sm flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl disabled:opacity-50">
                        {loading ? <RefreshCw className="animate-spin" /> : <Layers fill="white" />} {loading ? "جارِ المطابقة الهندسية..." : `تدقيق شامل لـ (${multipleFiles.length}) صور`}
                    </button>
                )}

                {result && (
                    <div className="space-y-4 animate-in slide-in-from-bottom-5">
                        <div className={`bg-zinc-900 p-8 rounded-[2rem] border-t-4 shadow-2xl ${activeTab === "deep" ? "border-emerald-600" : "border-blue-600"}`}>
                            <h3 className={`font-black text-[10px] uppercase mb-4 tracking-widest ${activeTab === "deep" ? "text-emerald-500" : "text-blue-500"}`}>التقرير الفني المعتمد</h3>
                            <p className="text-sm leading-relaxed text-zinc-300 whitespace-pre-wrap font-medium">{result}</p>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={handleShare} className="flex-1 bg-green-600 hover:bg-green-500 py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg">
                                <Share2 size={18} /> مشاركة التقرير
                            </button>

                            <button onClick={handleNewInspection} className="flex-1 bg-zinc-800 hover:bg-zinc-700 py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg">
                                <PlusCircle size={18} /> فحص جديد
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}