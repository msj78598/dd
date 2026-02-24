import { useState } from "react";

export const useImageAnalysis = () => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [chatLoading, setChatLoading] = useState(false);
    const [chatHistory, setChatHistory] = useState<{ role: string; text: string }[]>([]);
    const [savedImageParts, setSavedImageParts] = useState<any[] | null>(null);

    const resetAnalysis = () => {
        setResult(null);
        setChatHistory([]);
        setSavedImageParts(null);
        if (window.speechSynthesis) window.speechSynthesis.cancel();
    };

    const analyzeImage = async (imageInput: File | File[]) => {
        setLoading(true);
        setResult(null);
        setChatHistory([]);
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        const files = Array.isArray(imageInput) ? imageInput : [imageInput];

        const prompt = `حلل الصور وأصدر تقريراً فنياً بالهيكل التالي:
        
        النتيجة النهائية: [سليم ✅ / غير سليم ⚠️ (عبث) / غير سليم 🛠️ (عطل فني) / غير سليم 🚧 (عائق)]
        السبب الرئيسي: [ذكر السبب باختصار]

        📋 بيانات المنظومة:
        • نوع العداد: [مباشر / محولات تيار (CT)]
        • رقم العداد: [الرقم التسلسلي المستخرج]
        • سعة القاطع: [القيمة بالأمبير]

        🔍 التحليل الفني:
        • [حالة التوصيلات والأسلاك]
        • [مقارنة القياسات إن وجدت]
        • [رصد أي تلاعب أو عوائق]

        💡 التوصيات:
        • [إجراء ميداني 1]
        • [إجراء ميداني 2]`;

        try {
            const imageParts = await Promise.all(
                files.map((file) => new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onloadend = () => {
                        const base64Data = (reader.result as string).split(',')[1];
                        resolve({ inline_data: { mime_type: file.type, data: base64Data } });
                    };
                    reader.onerror = () => reject(new Error("فشل قراءة الملف"));
                }))
            );

            setSavedImageParts(imageParts);

            // 🚀 استخدام أقوى نسخة متاحة في قائمتك للدقة المطلقة
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro:generateContent?key=${apiKey}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }, ...imageParts as any[]] }],
                    safetySettings: [
                        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
                    ],
                    generationConfig: {
                        temperature: 0.1, // لضمان دقة الأرقام وعدم التخمين
                        topP: 0.95,
                        maxOutputTokens: 2048
                    }
                })
            });

            const data = await response.json();

            if (data.candidates?.[0]) {
                const text = data.candidates[0].content.parts[0].text;
                if (text.includes("عذراً")) {
                    setResult(text);
                } else {
                    const inspectionTime = new Date().toLocaleString('ar-SA');
                    setResult(`🕒 وقت الفحص: ${inspectionTime}\nــــــــــــــــــــــــــــــــــــــــ\n\n${text}`);
                }
            } else {
                setResult("⚠️ تعذر التحليل. تأكد من وضوح الصورة أو جرب نسخة Gemini 2.5 Pro إذا استمر الضغط على الكوتا.");
            }
        } catch (error) {
            setResult("❌ فشل الاتصال بالمحرك الفني.");
        } finally {
            setLoading(false);
        }
    };

    const askFollowUp = async (question: string) => {
        if (!savedImageParts || !result || !question.trim()) return;
        setChatLoading(true);
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        setChatHistory((prev) => [...prev, { role: "user", text: question }]);

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro:generateContent?key=${apiKey}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: `بناءً على التقرير: "${result}"، أجب باختصار على: "${question}"` }, ...savedImageParts] }]
                })
            });
            const data = await response.json();
            const aiReply = data.candidates?.[0]?.content.parts[0]?.text || "⚠️ لا توجد إجابة.";
            setChatHistory((prev) => [...prev, { role: "ai", text: aiReply }]);
        } catch (error) {
            setChatHistory((prev) => [...prev, { role: "ai", text: "❌ فشل الاستفسار." }]);
        } finally {
            setChatLoading(false);
        }
    };

    return { analyzeImage, loading, result, resetAnalysis, askFollowUp, chatHistory, chatLoading };
};