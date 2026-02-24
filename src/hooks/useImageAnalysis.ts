import { useState } from "react";

export const useImageAnalysis = () => {
    // ---------------- States الأساسية ----------------
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    // ---------------- States الجديدة للمحادثة (معزولة) ----------------
    const [chatLoading, setChatLoading] = useState(false); // تحميل خاص بالاستفسار
    const [chatHistory, setChatHistory] = useState<{ role: string; text: string }[]>([]); // سجل المحادثة
    const [savedImageParts, setSavedImageParts] = useState<any[] | null>(null); // الاحتفاظ بالصور للاستفسارات

    const resetAnalysis = () => {
        setResult(null);
        setChatHistory([]);
        setSavedImageParts(null);
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
    };

    // 1️⃣ الدالة الرئيسية (لم يتم تغيير منطقها، أضفنا فقط حفظ الصور)
    const analyzeImage = async (imageInput: File | File[]) => {
        setLoading(true);
        setResult(null);
        setChatHistory([]); // تصفير المحادثة عند فحص جديد
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

        if (!apiKey) {
            setResult("❌ خطأ: لم يتم العثور على مفتاح API.");
            setLoading(false);
            return;
        }

        const files = Array.isArray(imageInput) ? imageInput : [imageInput];

        // البرومبت الخاص بك كما هو تماماً (V5.8)
        const prompt = `أنت الآن "خبير الفحص الفني" لفحص العدادات الذكية. 
        مهمتك: تقديم تحليل فني دقيق وموضوعي وإصدار قرار حول سلامة العداد. 
        دورك يقتصر على التشخيص الفني وتوجيه الفني ميدانياً لخطوات الفحص المكملة وإجراءات السلامة، دون أي تدخل في القرارات الإدارية أو القانونية.

        🚨 خطوة الفحص الأولى والأهم (الأسلاك والروزيتا):
        - انظر بدقة مجهرية إلى روزيتا العداد السفلية (Terminal Block). هل هي فارغة؟ هل تدخلها وتخرج منها الكابلات فعلياً؟
        - تتبع مسار الكابلات الخارجة من القاطع (Breaker). هل تذهب للحمل مباشرة لتتجاوز العداد؟
        - إذا كانت الروزيتا فارغة، فهذا العطل هو الأولوية القصوى ويسمى (توصيل مباشر / فراغ الروزيتا).

        🎯 مصفوفة فحص حالات (غير سليم):
        1. العبث الكهربائي (الأعلى خطورة): Bypass مباشر، روزيتا فارغة، كباري خلفية، عكس فازات، Neutral-to-Earth.
        2. العبث الفيزيائي: أختام مقصوصة، غطاء مفقود، ثقوب مجهرية، آثار حرارة.
        3. الأعطال الفنية: كربنة/تفحم، انصهار، شاشة مطفأة، أخطاء Err.
        4. التدقيق المقارن: مطابقة تيار الشاشة مع الكلامب ميتر.

        ⚠️ قاعدة تعدد الأعطال (هام جداً):
        لا تكتفِ باكتشاف خطأ واحد! إذا وجدت عدة أخطاء (مثلاً: روزيتا فارغة + أختام مفقودة)، اذكرها جميعاً ورتبها بحيث يكون الأخطر هو السبب الرئيسي.

        هيكلية الرد الإلزامية:
        النتيجة النهائية: [سليم ✅ / غير سليم ⚠️ (عبث) / غير سليم 🛠️ (عطل) / غير سليم ❌ (خطر)]
        السبب الرئيسي: (اذكر الأخطر أولاً، مثل: توصيل مباشر وفراغ الروزيتا + غياب الأختام)
        التحليل الفني: (اشرح حالة الروزيتا ومسار الأسلاك أولاً، ثم اذكر الملاحظات الظاهرية الأخرى).
        التوصية: ( للملاحات الفنية ميدانيا ).

        الأسلوب: هندسي، قاطع، خبير فحص عدادات كهرباء ذكية لا يفوته شيء.`;

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

            setSavedImageParts(imageParts); // ✅ حفظ الصور بالذاكرة لاستخدامها في الاستفسارات

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

                if (window.speechSynthesis) window.speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = 'ar-SA';
                window.speechSynthesis.speak(utterance);
            } else {
                setResult("⚠️ تعذر استخلاص القرار الهندسي. تأكد من وضوح صور الروزيتا والشاشات.");
            }
        } catch (error) {
            setResult("❌ فشل الاتصال بمحرك الفحص الجنائي.");
        } finally {
            setLoading(false);
        }
    };

    // 2️⃣ الدالة الجديدة المعزولة تماماً (للاستفسارات الإضافية)
    const askFollowUp = async (question: string) => {
        if (!savedImageParts || !result || !question.trim()) return;

        setChatLoading(true);
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

        // إضافة سؤال الفني للواجهة فوراً
        setChatHistory((prev) => [...prev, { role: "user", text: question }]);

        // تجهيز سياق المحادثة للنظام
        const chatPrompt = `أنت الخبير الفني الذي قام للتو بفحص هذه الصور وأصدر هذا التقرير:
        """${result}"""
        
        الفني في الميدان يطرح عليك هذا الاستفسار الإضافي بخصوص الحالة والصور المرفقة:
        "${question}"
        
        أجب على استفساره بشكل هندسي مباشر ومختصر جداً، واعتمد فقط على ما تراه في الصور. لا تقم بإعادة كتابة التقرير.`;

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: chatPrompt }, ...savedImageParts] }]
                })
            });

            const data = await response.json();

            if (data.candidates && data.candidates[0]) {
                const aiReply = data.candidates[0].content.parts[0].text;
                // إضافة رد النظام للواجهة
                setChatHistory((prev) => [...prev, { role: "ai", text: aiReply }]);

                // نطق الرد التفاعلي
                if (window.speechSynthesis) window.speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(aiReply);
                utterance.lang = 'ar-SA';
                window.speechSynthesis.speak(utterance);
            } else {
                setChatHistory((prev) => [...prev, { role: "ai", text: "⚠️ لم أتمكن من تحليل استفسارك، أعد صياغة السؤال." }]);
            }
        } catch (error) {
            setChatHistory((prev) => [...prev, { role: "ai", text: "❌ فشل الاتصال بالسيرفر أثناء الاستفسار." }]);
        } finally {
            setChatLoading(false);
        }
    };

    // إرجاع المتغيرات الجديدة للواجهة لتستطيع استخدامها
    return { analyzeImage, loading, result, resetAnalysis, askFollowUp, chatHistory, chatLoading };
};