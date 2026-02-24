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

        // 🧠 البرومبت التراكمي النهائي - الدقة الهندسية V6.4
        const prompt = `حلل هذه المنظومة الكهربائية وأصدر تقريراً فنياً بالصيغة التالية:
        
        النتيجة النهائية: [سليم ✅ / غير سليم ⚠️ (عبث) / غير سليم 🛠️ (عطل فني) / غير سليم 🚧 (عائق تقني) / غير سليم ❌ (خطر)]
        السبب الرئيسي: [ذكر السبب باختصار]

        📋 بيانات المنظومة:
        • نوع العداد: [مباشر / محولات تيار (CT)]
        • رقم العداد: [استخرج 3 حروف + 13 رقماً]
        • سعة القاطع: [القيمة بالأمبير]

        🔍 التحليل الفني:
        • [ملاحظة 1: حالة الروزيتا والتوصيلات]
        • [ملاحظة 2: حالة الأسلاك والقواطع]
        • [ملاحظة 3: قراءة الكلامب ميتر ومطابقتها إن وجدت]

        💡 التوصيات:
        • [إجراء ميداني 1]
        • [إجراء ميداني 2]

        (ملاحظة: لا تكتب أي مقدمات. لا تشرح البديهيات. إذا كانت الصورة غير متعلقة بالكهرباء، ارفضها فوراً).`;

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

            // 🚀 نستخدم Gemini 1.5 Pro لأعلى دقة تحليلية
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }, ...imageParts as any[]] }]
                })
            });

            const data = await response.json();

            if (data.candidates?.[0]) {
                const text = data.candidates[0].content.parts[0].text;

                if (text.includes("عذراً، الصورة المرفقة لا تحتوي")) {
                    setResult(text);
                } else {
                    const inspectionTime = new Date().toLocaleString('ar-SA');
                    setResult(`🕒 وقت الفحص: ${inspectionTime}\nــــــــــــــــــــــــــــــــــــــــ\n\n${text}`);
                }
            } else {
                setResult("⚠️ تعذر تحليل الحالة. تأكد من جودة الصورة.");
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

        const chatPrompt = `أنت المدقق الفني. بناءً على الصور المرفقة والتقرير السابق: "${result}"، أجب على استفسار الفني: "${question}". 
        التزم بالصمت التام تجاه أي سؤال خارج تخصص الكهرباء والحالة المرفقة. لا مقدمات.`;

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: chatPrompt }, ...savedImageParts] }]
                })
            });
            const data = await response.json();
            const aiReply = data.candidates?.[0]?.content.parts[0]?.text || "⚠️ لم أتمكن من التحليل.";
            setChatHistory((prev) => [...prev, { role: "ai", text: aiReply }]);
        } catch (error) {
            setChatHistory((prev) => [...prev, { role: "ai", text: "❌ فشل الاستفسار." }]);
        } finally {
            setChatLoading(false);
        }
    };

    return { analyzeImage, loading, result, resetAnalysis, askFollowUp, chatHistory, chatLoading };
};