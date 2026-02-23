import { useState } from "react";

export const useImageAnalysis = () => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    const resetAnalysis = () => setResult(null);

    // ✅ دعم رفع صورة واحدة أو عدة صور للفحص الدقيق
    const analyzeImage = async (imageInput: File | File[]) => {
        setLoading(true);
        setResult(null);
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

        if (!apiKey) {
            setResult("❌ خطأ: لم يتم العثور على مفتاح API.");
            setLoading(false);
            return;
        }

        // تحويل المدخل إلى مصفوفة دائماً لتسهيل المعالجة
        const files = Array.isArray(imageInput) ? imageInput : [imageInput];

        // ✅ التوجيه الذكي (يدعم الفحص السريع والفحص المقارن الشامل)
        const prompt = `أنت "كبير المهندسين الميدانيين" لتدقيق العدادات الذكية.
    بناءً على الصور المرفقة (سواء كانت صورة واحدة أو مجموعة صور فحص شامل)، قم بالآتي:
    1. الأمان والتهريب (الأهم): ابحث عن أي آثار تفحم، أو كابلات غريبة حول القاطع. تأكد أن روزيتا العداد السفلية ليست فارغة (لمنع التوصيل المباشر).
    2. الفحص السريع (إذا كانت صورة واحدة): دقق في تسلسل الفازات، القاطع، وأي رموز خطأ ظاهرة.
    3. التدقيق المقارن الشامل (إذا كانت عدة صور): 
       - طابق رقم الاشتراك الظاهر على الصندوق مع العداد.
       - قارن قراءات "الكلامب ميتر" للفازات مع صور شاشة التيار اللحظي (31.7.0, 51.7.0, 71.7.0) لاكتشاف أي تلاعب في الـ CTs.
       - تحقق من عدم وجود طاقة مصدرة في شاشة (2.8.0) للتأكد من عدم وجود تيار عكسي.
       - افحص قيم الجهد ومعامل القدرة للتأكد من استقرار الشبكة.
    الأسلوب: هندسي حازم، دقيق، ومرتب بنقاط واضحة.`;

        try {
            // ✅ قراءة جميع الصور المرفوعة وتحويلها لمعالجة الموديل دفعة واحدة
            const imageParts = await Promise.all(
                files.map((file) => new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onloadend = () => {
                        const base64Data = (reader.result as string).split(',')[1];
                        resolve({ inline_data: { mime_type: file.type, data: base64Data } });
                    };
                }))
            );

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }, ...imageParts as any[]] }]
                })
            });

            const data = await response.json();

            if (data.error) {
                setResult(`❌ رسالة من السيرفر: ${data.error.message}`);
            } else if (data.candidates && data.candidates[0]) {
                const text = data.candidates[0].content.parts[0].text;

                const inspectionTime = new Date().toLocaleString('ar-SA', {
                    year: 'numeric', month: '2-digit', day: '2-digit',
                    hour: '2-digit', minute: '2-digit'
                });

                const modeTitle = files.length > 1 ? "🔍 نتيجة الفحص الشامل والمقارن" : "⚡ نتيجة الفحص السريع";
                const finalReport = `🕒 وقت الفحص الفعلي: ${inspectionTime}\n${modeTitle}\nــــــــــــــــــــــــــــــــــــــــ\n\n${text}`;

                setResult(finalReport);

                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = 'ar-SA';
                window.speechSynthesis.speak(utterance);
            } else {
                setResult("⚠️ تعذر استخلاص البيانات. حاول التقاط صور أوضح.");
            }
            setLoading(false);
        } catch (error) {
            setResult("❌ فشل الاتصال بالسيرفر.");
            setLoading(false);
        }
    };

    return { analyzeImage, loading, result, resetAnalysis };
};