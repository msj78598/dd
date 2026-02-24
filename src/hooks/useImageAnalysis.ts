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

        // 🧠 البرومبت الفني الموحد (V6.5)
        const prompt = `أصدر تقريراً فنياً دقيقاً بناءً على الصور المرفقة وفق الهيكل التالي:
        
        النتيجة النهائية: [سليم ✅ / غير سليم ⚠️ (عبث) / غير سليم 🛠️ (عطل فني) / غير سليم 🚧 (عائق تقني)]
        السبب الرئيسي: [ذكر السبب باختصار شديد]

        📋 بيانات المنظومة:
        • نوع العداد: [مباشر / محولات تيار (CT)]
        • رقم العداد: [استخرج الـ 16 رمز بدقة]
        • سعة القاطع: [القيمة بالأمبير]

        🔍 التحليل الفني:
        • [حالة التوصيلات والأسلاك بدقة]
        • [مقارنة القياسات إن وجدت كقراءة الكلامب ميتر مع شاشة العداد]
        • [رصد أي آثار احتراق أو تلاعب أو عوائق تقنية]

        💡 التوصيات:
        • [توصية ميدانية أولى]
        • [توصية ميدانية ثانية]

        (تنبيه: إذا كانت الصورة غير متعلقة بالكهرباء، فعل بوابة التحقق واعتذر).`;

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

            // 🚀 الاتصال بموديل Pro لضمان أعلى دقة OCR وتحليل
            // يمكنك تغيير gemini-1.5-pro إلى gemini-2.5-pro إذا أردت تجربة أحدث نسخة في قائمتك
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }, ...imageParts as any[]] }],
                    // 🛡️ إعدادات الأمان لتعطيل الحجب التلقائي للصور التقنية
                    safetySettings: [
                        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
                    ],
                    generationConfig: {
                        temperature: 0.1, // درجة حرارة منخفضة جداً لضمان دقة الأرقام ومنع الهلوسة
                        topP: 0.95,
                        maxOutputTokens: 2048
                    }
                })
            });

            const data = await response.json();

            if (data.candidates?.[0]) {
                const text = data.candidates[0].content.parts[0].text;

                if (text.includes("عذراً، الصورة المرفقة لا تحتوي")) {
                    setResult(text);
                } else {
                    const inspectionTime = new Date().toLocaleString('ar-SA');
                    setResult(`🕒 وقت الفحص الفعلي: ${inspectionTime}\nــــــــــــــــــــــــــــــــــــــــ\n\n${text}`);
                }

                // نطق النتيجة صوتياً للسهولة الميدانية
                if (window.speechSynthesis) {
                    window.speechSynthesis.cancel();
                    const utterance = new SpeechSynthesisUtterance(text.split('\n')[0]); // نطق النتيجة النهائية فقط
                    utterance.lang = 'ar-SA';
                    window.speechSynthesis.speak(utterance);
                }
            } else {
                setResult("⚠️ تعذر تحليل الحالة. تأكد من جودة الصورة أو حاول رفع صورة واحدة فقط.");
            }
        } catch (error) {
            setResult("❌ فشل الاتصال بمحرك التدقيق الفني.");
        } finally {
            setLoading(false);
        }
    };

    const askFollowUp = async (question: string) => {
        if (!savedImageParts || !result || !question.trim()) return;
        setChatLoading(true);
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        setChatHistory((prev) => [...prev, { role: "user", text: question }]);

        const chatPrompt = `أنت المدقق الفني. بناءً على التقرير: "${result}"، أجب على استفسار الفني: "${question}". 
        أجب بدقة تقنية حادة ومختصرة. ارفض أي أسئلة خارج نطاق الحالة الكهربائية المرفقة.`;

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: chatPrompt }, ...savedImageParts] }]
                })
            });
            const data = await response.json();
            const aiReply = data.candidates?.[0]?.content.parts[0]?.text || "⚠️ لم أتمكن من الرد حالياً.";
            setChatHistory((prev) => [...prev, { role: "ai", text: aiReply }]);
        } catch (error) {
            setChatHistory((prev) => [...prev, { role: "ai", text: "❌ فشل الاستفسار." }]);
        } finally {
            setChatLoading(false);
        }
    };

    return { analyzeImage, loading, result, resetAnalysis, askFollowUp, chatHistory, chatLoading };
};