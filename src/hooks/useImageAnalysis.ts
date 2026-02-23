import { useState } from "react";

export const useImageAnalysis = () => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    const analyzeImage = async (imageFile: File) => {
        setLoading(true);
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

        const prompt = "أنت مهندس تدقيق كهربائي. حلل صورة العداد: استخرج الرقم اليدوي (مثل 104679)، تحقق من ترتيب الأسلاك (أحمر، أصفر، أزرق)، ورصد أي آثار حرارة أو تلاعب. قدم تقريراً فنياً موجزاً.";

        try {
            const reader = new FileReader();
            reader.readAsDataURL(imageFile);
            reader.onloadend = async () => {
                const base64Data = (reader.result as string).split(',')[1];
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: "image/jpeg", data: base64Data } }] }]
                    })
                });
                const data = await response.json();
                setResult(data.candidates[0].content.parts[0].text);
            };
        } catch (error) {
            setResult("خطأ في الاتصال بالذكاء الاصطناعي.");
        } finally {
            setLoading(false);
        }
    };

    return { analyzeImage, loading, result };
};