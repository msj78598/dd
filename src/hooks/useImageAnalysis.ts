import { useState } from "react";
import { systemInstruction } from "./systemInstruction";

export const useImageAnalysis = () => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [chatLoading, setChatLoading] = useState(false);
    const [chatHistory, setChatHistory] = useState<{ role: string; text: string }[]>([]);
    const [savedImageParts, setSavedImageParts] = useState<any[] | null>(null);

    const analyzeImage = async (imageInput: File | File[]) => {
        setLoading(true);
        setResult(null);
        setChatHistory([]);
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        const files = Array.isArray(imageInput) ? imageInput : [imageInput];

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

            // 🚀 استخدام النسخة المعتمدة Gemini 2.5 Pro (150 Quota) لتحليل دقيق وشامل
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    system_instruction: systemInstruction,
                    contents: [
                        {
                            parts: [
                                { text: "أصدر تقريراً فنياً دقيقاً بناءً على الصور المرفقة يوضح الحالة والبيانات الإدارية." },
                                ...imageParts as any[]
                            ]
                        }
                    ],
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

            if (data.error) {
                setResult(`❌ خطأ من النظام: ${data.error.message}`);
                return;
            }

            if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
                const text = data.candidates[0].content.parts[0].text;
                const inspectionTime = new Date().toLocaleString('ar-SA');

                // تنسيق التقرير النهائي
                const finalReport = `🕒 وقت الفحص: ${inspectionTime}\nــــــــــــــــــــــــــــــــــــــــ\n\n${text}`;
                setResult(finalReport);
            } else {
                setResult("⚠️ تعذر تحليل الحالة. تأكد من وضوح الصورة وتجربة رفع صورة واحدة في المرة الواحدة إذا استمر الخطأ.");
            }
        } catch (error) {
            setResult("❌ فشل الاتصال بالسيرفر. تأكد من إعدادات الـ API والإنترنت.");
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
                    system_instruction: { role: "system", parts: [{ text: "أنت المستشار الفني. أجب باختصار هندسي حاد على استفسار الفني بناءً على الصور والتقرير السابق." }] },
                    contents: [
                        { parts: [{ text: `التقرير السابق: ${result}\nالسؤال: ${question}` }, ...savedImageParts] }
                    ]
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

    return { analyzeImage, loading, result, chatHistory, chatLoading, askFollowUp };
};