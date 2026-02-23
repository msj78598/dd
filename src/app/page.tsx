"use client";
import { useState, useRef, useEffect } from "react";
import { useImageAnalysis } from "@/hooks/useImageAnalysis";
import { Scan, Video, Upload, Play, RefreshCw, Zap, ShieldCheck, Share2, PlusCircle, Layers, CheckSquare, Camera, Images, CheckCircle2 } from "lucide-react";

// ✅ القائمة الشاملة المعتمدة (21 صورة حسب طلبك)
const SOP_LIST = [
    { id: 'box', label: 'صورة الصندوق ( مع توضيح رقم الاشتراك )' },
    { id: 'full_wiring', label: 'صورة توصيلات العداد بالكامل' },
    { id: 'terminals', label: 'صوره توصيلات الساعه مع فك الكفر' },
    { id: 'breaker', label: 'صوره القاطع' },
    { id: 'screen_180', label: 'صورة شاشة (180)' },
    { id: 'screen_280', label: 'صورة شاشة (280)' },
    { id: 'screen_i1', label: 'صورة التيار الاول ( صفحة 31.70)' },
    { id: 'screen_i2', label: 'صورة التيار الثاني ( صفحة 51.70)' },
    { id: 'screen_i3', label: 'صورة التيار الثالث ( صفحة 71.70)' },
    { id: 'screen_v1', label: 'صورة الجهد الاول ( صفحة 32.70)' },
    { id: 'screen_v2', label: 'صورة الجهد الثاني ( صفحة 52.70)' },
    { id: 'screen_v3', label: 'صورة الجهد الثالث ( صفحة 71.70)' },
    { id: 'screen_pf1', label: 'صورة الباور فاكتر الاول  ( 33.70)' },
    { id: 'screen_pf2', label: 'صورة الباور فاكتر الثاني ( 53.70)' },
    { id: 'screen_pf3', label: 'صورة الباور فاكتر الثالث ( 73.70)' },
    { id: 'clamp_i1', label: 'التيار الاول ( بالكلامب للكيبل الاحمر )' },
    { id: 'clamp_i2', label: 'التيار الثاني ( بالكلامب للكيبل الاصفر)' },
    { id: 'clamp_i3', label: 'التيار الثالث ( بالكلامب للكيبل الازرق)' },
    { id: 'clamp_v1', label: 'الجهد الاول ( بالكلامب للكيبل الاحمر )' },
    { id: 'clamp_v2', label: 'الجهد الثاني ( بالكلامب للكيبل الاصفر)' },
    { id: 'clamp_v3', label: 'الجهد الثالث ( بالكلامب للكيبل الازرق)' }
];

export default function SmartMeterPage() {
    const [activeTab, setActiveTab] = useState<"photo" | "live" | "deep">("photo");
    const { analyzeImage, loading, result, resetAnalysis } = useImageAnalysis();

    // حالات الفحص السريع
    const [preview, setPreview] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [currentFile, setCurrentFile] = useState<File | null>(null);

    // حالات الفحص الدقيق المحدثة
    const [slotFiles, setSlotFiles] = useState<Record<string, { file: File, preview: string }>>({});
    const [bulkFiles, setBulkFiles] = useState<File[]>([]);

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
        if (tab !== "live") stopCamera();
        resetAnalysis();
    };

    const startLive = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setCameraActive(true);
            }
        } catch (err) { alert("⚠️ يرجى تفعيل الكاميرا."); }
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
        setSlotFiles({});
        setBulkFiles([]);
        resetAnalysis();
    };

    const handleShare = async () => {
        if (!result) return;
        const currentDate = new Date().toLocaleString('ar-SA', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
        const shareText = `📋 *تـقـريـر فـحـص مـيـدانـي*\nــــــــــــــــــــــــــــــــــــــــ\n📅 *التاريخ والوقت:* ${currentDate}\n\n🔍 *النتائج الفنية:*\n${result}\n\nــــــــــــــــــــــــــــــــــــــــ\n✅ *Smart Meter AI Supervisor*`;

        let fileToShare = currentFile;
        if (activeTab === 'deep') {
            const allFiles = getAllDeepFiles();
            if (allFiles.length > 0) fileToShare = allFiles[0];
        }

        try {
            if (navigator.canShare && fileToShare && navigator.canShare({ files: [fileToShare] })) {
                await navigator.share({ files: [fileToShare], title: 'تقرير الفحص', text: shareText });
            } else if (navigator.share) {
                await navigator.share({ title: 'تقرير الفحص', text: shareText });
            } else {
                window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
            }
        } catch (err) { console.log("خطأ في المشاركة", err); }
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

    const handleSlotFile = (slotId: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSlotFiles(prev => ({
                ...prev,
                [slotId]: { file, preview: URL.createObjectURL(file) }
            }));
            resetAnalysis();
        }
    };

    const handleBulkFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            setBulkFiles(prev => [...prev, ...files]);
            resetAnalysis();
        }
    };

    const getAllDeepFiles = () => {
        const sFiles = Object.values(slotFiles).map(s => s.file);
        return [...sFiles, ...bulkFiles];
    };

    return (
        <main className="min-h-screen bg-[#050505] text-white p-6 font-sans rtl" dir="rtl">
            <div className="max-w-xl mx-auto pb-10">
                <div className="flex items-center justify-between mb-8 border-b border-zinc-800 pb-5">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600 p-2 rounded-xl shadow-lg"><Zap size={22} fill="white" /></div>
                        <h1 className="text-xl font-black uppercase tracking-tighter">Supervisor AI v5.2</h1>
                    </div>
                    <ShieldCheck className="text-zinc-700" size={24} />
                </div>

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
                                    <button onClick={captureAndAnalyze} className="w-full bg-blue-600 hover:bg-blue-500 text-white px-6 py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all">
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

                    {/* ✅ قائمة الفحص الدقيق المكتملة (21 عنصر) */}
                    {activeTab === "deep" && (
                        <div className="w-full h-full overflow-y-auto custom-scrollbar p-1 flex flex-col gap-2">
                            {/* زر الرفع الكلي */}
                            <label className="flex flex-col items-center justify-center bg-zinc-800/50 hover:bg-zinc-800 border-2 border-dashed border-emerald-600/50 p-3 rounded-2xl cursor-pointer transition-all">
                                <Images size={20} className="text-emerald-500 mb-1" />
                                <span className="text-xs font-bold text-emerald-500">إدراج كلي من الاستديو</span>
                                <input type="file" multiple accept="image/*" onChange={handleBulkFiles} className="hidden" />
                            </label>

                            {bulkFiles.length > 0 && (
                                <div className="text-[10px] font-bold text-zinc-400 text-center">
                                    تم إدراج ({bulkFiles.length}) صور إضافية
                                </div>
                            )}

                            {/* القائمة المطولة */}
                            {SOP_LIST.map(slot => (
                                <div key={slot.id} className="flex items-center justify-between bg-[#0a0a0a] border border-zinc-800 p-2 rounded-xl shadow-sm">
                                    <div className="flex items-center gap-2">
                                        {slotFiles[slot.id] ? <CheckCircle2 size={16} className="text-emerald-500 shrink-0" /> : <div className="w-4 h-4 rounded-full border border-zinc-600 shrink-0" />}
                                        <p className={`text-[11px] font-bold leading-tight ${slotFiles[slot.id] ? "text-white" : "text-zinc-400"}`}>{slot.label}</p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        {slotFiles[slot.id] && (
                                            <img src={slotFiles[slot.id].preview} className="w-8 h-8 rounded-md object-cover border border-emerald-500/50" alt="Preview" />
                                        )}
                                        <label className={`p-2 rounded-lg cursor-pointer transition-all ${slotFiles[slot.id] ? "bg-emerald-600/20 text-emerald-400" : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"}`}>
                                            <Camera size={14} />
                                            <input type="file" accept="image/*" onChange={(e) => handleSlotFile(slot.id, e)} className="hidden" />
                                        </label>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* أزرار التحليل */}
                {activeTab === "photo" && preview && !result && (
                    <button onClick={() => selectedFile && analyzeImage(selectedFile as any)} disabled={loading} className="w-full py-6 bg-blue-600 rounded-3xl font-black text-sm flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl disabled:opacity-50">
                        {loading ? <RefreshCw className="animate-spin" /> : <Play fill="white" />} {loading ? "جارِ الفحص السريع..." : "بـدء الـتـحـلـيـل الـسـريـع"}
                    </button>
                )}

                {activeTab === "deep" && getAllDeepFiles().length > 0 && !result && (
                    <button onClick={() => analyzeImage(getAllDeepFiles() as any)} disabled={loading} className="w-full py-6 bg-emerald-600 rounded-3xl font-black text-sm flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl disabled:opacity-50">
                        {loading ? <RefreshCw className="animate-spin" /> : <Layers fill="white" />} {loading ? "جارِ المطابقة الهندسية..." : `تدقيق شامل لـ (${getAllDeepFiles().length}) صور`}
                    </button>
                )}

                {result && (
                    <div className="space-y-4 animate-in slide-in-from-bottom-5">
                        <div className={`bg-zinc-900 p-8 rounded-[2rem] border-t-4 shadow-2xl ${activeTab === "deep" ? "border-emerald-600" : "border-blue-600"}`}>
                            <h3 className={`font-black text-[10px] uppercase mb-4 tracking-widest ${activeTab === "deep" ? "text-emerald-500" : "text-blue-500"}`}>التقرير الفني المعتمد</h3>
                            <p className="text-sm leading-relaxed text-zinc-300 whitespace-pre-wrap font-medium">{result}</p>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={handleShare} className="flex-1 bg-green-600 hover:bg-green-500 py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg"><Share2 size={18} /> مشاركة التقرير</button>
                            <button onClick={handleNewInspection} className="flex-1 bg-zinc-800 hover:bg-zinc-700 py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg"><PlusCircle size={18} /> فحص جديد</button>
                        </div>
                    </div>
                )}

                {/* ✅ بصمة المطور وحفظ الحقوق */}
                <div className="mt-16 mb-4 text-center opacity-50 hover:opacity-100 transition-opacity duration-300">
                    <p className="text-[10px] text-zinc-500 tracking-[0.2em] uppercase font-medium" dir="ltr">
                        Developed by <span className="text-blue-500 font-bold">Mashhoor Alabbas</span>
                    </p>
                </div>

            </div>
        </main>
    );
}