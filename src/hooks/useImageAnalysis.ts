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

            // 🚀 الهيكلية الصحيحة والمجربة لـ Gemini 2.5 Pro
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    system_instruction: systemInstruction,
                    contents: [
                        {
                            parts: [
                                { text: "حلل الصور وأصدر تقريراً فنياً دقيقاً بناءً على التعليمات." },
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
                        temperature: 0, // للوصول لأعلى دقة في قراءة الأرقام (OCR)
                        maxOutputTokens: 2048
                    }
                })
            });

            const data = await response.json();

            if (data.error) {
                console.error("API Error Detail:", data.error);
                setResult(`❌ خطأ تقني: ${data.error.message}`);
                return;
            }

            if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
                const text = data.candidates[0].content.parts[0].text;
                const inspectionTime = new Date().toLocaleString('ar-SA');
                setResult(`🕒 وقت الفحص: ${inspectionTime}\nــــــــــــــــــــــــــــــــــــــــ\n\n${text}`);
            } else {
                setResult("⚠️ لم يتم إصدار تقرير. تأكد من وضوح الصورة ومحتواها الكهربائي.");
            }
        } catch (error) {
            setResult("❌ فشل الاتصال بالسيرفر. تأكد من مفتاح الـ API والإنترنت.");
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
                    system_instruction: { parts: [{ text: "أنت المستشار الفني. أجب باختصار على السؤال بناءً على التقرير والصور." }] },
                    contents: [
                        { parts: [{ text: `التقرير: ${result}\nالسؤال: ${question}` }, ...savedImageParts] }
                    ]
                })
            });
            const data = await response.json();
            const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "⚠️ لا توجد إجابة.";
            setChatHistory((prev) => [...prev, { role: "ai", text: aiReply }]);
        } catch (error) {
            setChatHistory((prev) => [...prev, { role: "ai", text: "❌ فشل الاستفسار." }]);
        } finally {
            setChatLoading(false);
        }
    };

    return { analyzeImage, loading, result, chatHistory, chatLoading, askFollowUp };
};