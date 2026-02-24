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

        const prompt = `حلل الصور وأصدر تقريراً فنياً مرتباً:
        
        النتيجة النهائية: [سليم ✅ / غير سليم ⚠️ (عبث) / غير سليم 🛠️ (عطل فني) / غير سليم 🚧 (عائق)]
        السبب الرئيسي: [ذكر السبب]

        📋 بيانات المنظومة:
        • نوع العداد: [مباشر / CT]
        • رقم العداد: [الرقم المستخرج]
        • سعة القاطع: [القيمة بالأمبير]

        🔍 التحليل الفني والتوصيات...`;

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

            // 🚀 استخدام النسخة المعتمدة Gemini 2.5 Pro (150 Quota)
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`, {
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
                    generationConfig: { temperature: 0.1, topP: 0.95, maxOutputTokens: 2048 }
                })
            });

            const data = await response.json();

            if (data.error) {
                // إذا كان الخطأ من السيرفر (مثل تجاوز الكوتا)
                setResult(`❌ خطأ من النظام: ${data.error.message}`);
            } else if (data.candidates?.[0]) {
                const text = data.candidates[0].content.parts[0].text;
                const inspectionTime = new Date().toLocaleString('ar-SA');
                setResult(`🕒 وقت الفحص: ${inspectionTime}\nــــــــــــــــــــــــــــــــــــــــ\n\n${text}`);
            } else {
                setResult("⚠️ تعذر التحليل. قد يكون السبب جودة الصورة أو حجمها الكبير. جرب رفع صورة واحدة فقط.");
            }
        } catch (error) {
            setResult("❌ فشل الاتصال. تأكد من الإنترنت ومفتاح الـ API.");
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
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: `التقرير: "${result}"، أجب باختصار على: "${question}"` }, ...savedImageParts] }]
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