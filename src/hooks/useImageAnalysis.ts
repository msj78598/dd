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

        // ✅ تم تحديث "العقل" الهندسي ليتتبع التوصيل المباشر والروزيتا
        const prompt = `أنت "كبير المهندسين الميدانيين". مهمتك التدقيق الفني الصارم لصور العدادات الذكية.
    حلل الصورة بدقة متناهية والتزم بالآتي حسب الأولوية:
    1. كشف التلاعب والتوصيل المباشر (الأهم): تتبع مسار كابلات الفازات الرئيسية (الأحمر، الأصفر، الأزرق). تأكد أنها تدخل فعلياً في أطراف توصيل العداد (الروزيتا/Terminal Block). إذا كانت الكابلات تخرج من القاطع وتتجه للأعلى أو تغذي الحمل مباشرة بينما "روزيتا العداد السفلية فارغة"، فهذا "توصيل مباشر" (حالة تلاعب وتهريب تيار مؤكدة). أطلق تحذير "أحمر" وحازم فوراً.
    2. الأمان والسلامة: ابحث عن أي آثار كربنة، تفحم، أو أسلاك مكشوفة حول القاطع أو العداد.
    3. شاشة العداد: استخرج القراءات، رموز الخطأ (Error Codes)، ولاحظ إذا كانت الشاشة مطفأة تماماً (مما يؤكد عدم وصول الكهرباء للعداد بسبب التوصيل المباشر).
    4. بيانات العداد: استخرج رقم العداد المصنعي (يبدأ بـ 3 حروف ثم 13 رقم) إن وجد.
    5. القاطع الرئيسي: تأكد من وضعية المفتاح (ON/OFF).
    الأسلوب: تحدث بلهجة هندسية حازمة ومباشرة، ورتب التقرير بنقاط واضحة.`;

        try {
            const reader = new FileReader();
            reader.readAsDataURL(imageFile);
            reader.onloadend = async () => {
                const base64Data = (reader.result as string).split(',')[1];

                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: "image/jpeg", data: base64Data } }] }]
                    })
                });

                const data = await response.json();

                if (data.error) {
                    setResult(`❌ رسالة من السيرفر: ${data.error.message}`);
                } else if (data.candidates && data.candidates[0]) {
                    const text = data.candidates[0].content.parts[0].text;

                    // ✅ تجميد وقت الفحص لحظة صدور النتيجة من السيرفر
                    const inspectionTime = new Date().toLocaleString('ar-SA', {
                        year: 'numeric', month: '2-digit', day: '2-digit',
                        hour: '2-digit', minute: '2-digit'
                    });

                    // دمج الوقت الثابت مع نص التقرير
                    const finalReport = `🕒 وقت الفحص الفعلي: ${inspectionTime}\nــــــــــــــــــــــــــــــــــــــــ\n\n${text}`;

                    setResult(finalReport);

                    const utterance = new SpeechSynthesisUtterance(text);
                    utterance.lang = 'ar-SA';
                    window.speechSynthesis.speak(utterance);
                } else {
                    setResult("⚠️ تعذر استخلاص البيانات. حاول التقاط صورة أوضح.");
                }
                setLoading(false);
            };
        } catch (error) {
            setResult("❌ فشل الاتصال بالسيرفر.");
            setLoading(false);
        }
    };

    return { analyzeImage, loading, result, resetAnalysis };
};