import { useState } from "react";

export const useImageAnalysis = () => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    const resetAnalysis = () => setResult(null);

    const analyzeImage = async (imageFile: File) => {
        setLoading(true);
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

        if (!apiKey) {
            setResult("خطأ: لم يتم العثور على مفتاح API.");
            setLoading(false);
            return;
        }

        try {
            const reader = new FileReader();
            reader.readAsDataURL(imageFile);
            reader.onloadend = async () => {
                const base64Data = (reader.result as string).split(',')[1];
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ contents: [{ parts: [{ text: "حلل صورة العداد: شاشة، فازات، قاطع، وتلف." }, { inline_data: { mime_type: "image/jpeg", data: base64Data } }] }] })
                });
                const data = await response.json();
                setResult(data.candidates?.[0]?.content?.parts?.[0]?.text || "فشل التحليل.");
            };
        } catch (error) {
            setResult("حدث خطأ تقني في الاتصال.");
        } finally {
            setLoading(false);
        }
    };

    return { analyzeImage, loading, result, resetAnalysis };
};