import { useState } from "react";

export const useImageAnalysis = () => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    const resetAnalysis = () => setResult(null);

    const analyzeImage = async (imageFile: File) => {
        setLoading(true);
        setResult(null);
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

        if (!apiKey) {
            setResult("❌ خطأ: لم يتم العثور على مفتاح API في إعدادات النظام.");
            setLoading(false);
            return;
        }

        const prompt = `
      بصفتك "كبير المهندسين والمفتشين الفنيين" لمشروع Smart Meter AI Supervisor، حلل هذه الصورة بدقة:
      1. سلامة التوصيلات: دقق في تسلسل الفازات (أحمر R، أصفر Y، أزرق B). نبه لأي عكس أو ارتخاء.
      2. شاشة العداد: استخرج القراءات ورموز الخطأ (Error Codes) وحالة الاتصال بالشبكة.
      3. الفحص الإنشائي: ابحث عن آثار كربنة، تفحم، أو تلاعب بالأختام.
      4. القاطع الرئيسي: تحقق من وضعية المفتاح وسلامته الفيزيائية.
      تحدث بلهجة هندسية محترفة ومباشرة باللغة العربية.
    `;

        try {
            const reader = new FileReader();
            reader.readAsDataURL(imageFile);
            reader.onloadend = async () => {
                const base64Data = (reader.result as string).split(',')[1];

                // تم دمج النموذج الذي طلبته تحديداً هنا
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-native-audio-latest:generateContent?key=${apiKey}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: "image/jpeg", data: base64Data } }] }]
                    })
                });

                const data = await response.json();

                if (data.error) {
                    setResult(`❌ خطأ من السيرفر: ${data.error.message}`);
                } else if (data.candidates && data.candidates[0]) {
                    const text = data.candidates[0].content.parts[0].text;
                    setResult(text);

                    // تفعيل النطق الصوتي التلقائي
                    const speech = new SpeechSynthesisUtterance(text);
                    speech.lang = 'ar-SA';
                    window.speechSynthesis.speak(speech);
                } else {
                    setResult("⚠️ الرد فارغ. يرجى إعادة المحاولة بصورة أوضح.");
                }
            };
        } catch (error) {
            setResult("❌ فشل الاتصال بمحرك الذكاء الاصطناعي.");
        } finally {
            setLoading(false);
        }
    };

    return { analyzeImage, loading, result, resetAnalysis };
};