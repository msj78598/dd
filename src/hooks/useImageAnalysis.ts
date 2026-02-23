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

        // قائمة النماذج بالترتيب (يبدأ بنموذجك المفضل ثم ينتقل للبدائل المضمونة إذا لزم الأمر)
        const modelsToTry = [
            "gemini-2.5-flash-native-audio-latest",
            "gemini-2.0-flash",
            "gemini-1.5-pro",
            "gemini-1.5-flash"
        ];

        try {
            const reader = new FileReader();
            reader.readAsDataURL(imageFile);
            reader.onloadend = async () => {
                const base64Data = (reader.result as string).split(',')[1];

                let success = false;
                let lastErrorMessage = "";

                // حلقة البحث الديناميكية: تجرب النماذج واحداً تلو الآخر
                for (const modelName of modelsToTry) {
                    try {
                        console.log(`🔄 جاري محاولة الاتصال بالنموذج: ${modelName}...`);

                        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: "image/jpeg", data: base64Data } }] }]
                            })
                        });

                        const data = await response.json();

                        if (!data.error && data.candidates && data.candidates[0]) {
                            const text = data.candidates[0].content.parts[0].text;

                            // عرض النتيجة مع اسم النموذج الذي نجح في المهمة
                            setResult(`✅ (تم الفحص بنجاح عبر: ${modelName})\n\n${text}`);

                            // تفعيل النطق الصوتي
                            const speech = new SpeechSynthesisUtterance(text);
                            speech.lang = 'ar-SA';
                            window.speechSynthesis.speak(speech);

                            success = true;
                            break; // الخروج من الحلقة فور نجاح أحد النماذج
                        } else {
                            console.warn(`⚠️ فشل النموذج ${modelName}:`, data.error?.message);
                            lastErrorMessage = data.error?.message || "استجابة فارغة";
                        }
                    } catch (err) {
                        console.warn(`⚠️ تعذر الوصول للنموذج ${modelName}`);
                    }
                }

                if (!success) {
                    setResult(`❌ فشلت جميع النماذج في تحليل الصورة.\nآخر خطأ مسجل: ${lastErrorMessage}`);
                }
                setLoading(false);
            };
        } catch (error) {
            setResult("❌ فشل جذري في معالجة الصورة قبل إرسالها.");
            setLoading(false);
        }
    };

    return { analyzeImage, loading, result, resetAnalysis };
};