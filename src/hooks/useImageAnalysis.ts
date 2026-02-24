import { useState } from "react";

export const useImageAnalysis = () => {
    // ---------------- States الأساسية ----------------
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    // ---------------- States الجديدة للمحادثة (معزولة) ----------------
    const [chatLoading, setChatLoading] = useState(false);
    const [chatHistory, setChatHistory] = useState<{ role: string; text: string }[]>([]);
    const [savedImageParts, setSavedImageParts] = useState<any[] | null>(null);

    const resetAnalysis = () => {
        setResult(null);
        setChatHistory([]);
        setSavedImageParts(null);
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
    };

    // 1️⃣ الدالة الرئيسية
    const analyzeImage = async (imageInput: File | File[]) => {
        setLoading(true);
        setResult(null);
        setChatHistory([]);
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

        if (!apiKey) {
            setResult("❌ خطأ: لم يتم العثور على مفتاح API.");
            setLoading(false);
            return;
        }

        const files = Array.isArray(imageInput) ? imageInput : [imageInput];

        // 🧠 البرومبت الفني المطور (V6.0) - شمولية المنظومة الكهربائية
        const prompt = `أنت الآن "خبير الفحص الفني" للمنظومة الكهربائية والعدادات الذكية. 

        🛑 بوابة التحقق الأساسية (إلزامي جداً):
        هل الصورة تحتوي فعلاً على مكونات المنظومة الكهربائية؟ (مثل: عداد، قاطع، أسلاك، لوحات توزيع Distribution Boards، كابلات محولات، أو أجهزة قياس فنية مثل الكلامب ميتر Clamp Meter).
        - إذا كانت الصورة لشيء آخر تماماً (طعام، سيارة، حيوان، إلخ)، توقف فوراً ورد بهذا النص فقط:
        "⚠️ عذراً، الصورة المرفقة لا تحتوي على مكونات كهربائية أو أجهزة قياس قابلة للفحص. يرجى التحقق من الصورة."
        
        ✅ أما إذا كانت الصورة لمنظومة كهربائية أو جهاز قياس، فاستمر في مهمتك:
        مهمتك: تقديم تحليل فني دقيق وموضوعي وإصدار قرار حول سلامة التوصيلات والعداد. 

        🚨 خطوة الفحص الأولى (الأسلاك والقياسات):
        - إذا كانت الصورة لعداد: افحص الروزيتا ومسار الكابلات.
        - إذا كانت الصورة لجهاز قياس (مثل الكلامب ميتر) على كابلات محول أو لوحة: اقرأ التيار بعناية. هذا الإجراء مهم جداً لاكتشاف (سرقة التيار من المصدر / Upstream Bypass) عند مقارنته بحمل العداد.

        🎯 مصفوفة فحص حالات (غير سليم):
        1. التدخل الكهربائي: Bypass مباشر من العداد، Bypass من المحول/اللوحة، روزيتا فارغة، كباري خلفية، عكس فازات.
        2. التدخل الفيزيائي: أختام مقصوصة، غطاء مفقود، ثقوب، آثار حرارة.
        3. الأعطال الفنية: كربنة/تفحم، انصهار، شاشة مطفأة، أخطاء Err.
        4. المطابقة: اختلاف كبير بين قراءة الكلامب ميتر (الحمل الفعلي) وقراءة شاشة العداد.

        ⚠️ قاعدة تعدد الملاحظات:
        اذكر جميع الملاحظات الفنية ورتبها من الأخطر للأقل خطورة.

        هيكلية الرد الإلزامية:
        النتيجة النهائية: [سليم ✅ / غير سليم ⚠️ (اشتباه تدخل خارجي) / غير سليم 🛠️ (عطل فني) / غير سليم ❌ (خطر على السلامة)]
        السبب الرئيسي: (اذكر الأخطر أولاً بنبرة محايدة)
        التحليل الفني: (اشرح حالة التوصيلات، القراءات الظاهرة على أجهزة القياس، والملاحظات الظاهرية بدقة).
        التوصية: (للملاحظات الفنية ميدانياً وإجراءات السلامة فقط).

        الأسلوب: هندسي، قاطع، خبير فحص لا يفوته شيء.`;

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

                if (text.includes("عذراً، الصورة المرفقة لا تحتوي على مكونات كهربائية")) {
                    setResult(text);
                } else {
                    const inspectionTime = new Date().toLocaleString('ar-SA', {
                        year: 'numeric', month: '2-digit', day: '2-digit',
                        hour: '2-digit', minute: '2-digit'
                    });
                    const modeTitle = files.length > 1 ? "🔍 نتيجة الفحص الشامل والمقارن" : "⚡ نتيجة الفحص السريع";
                    const finalReport = `🕒 وقت الفحص الفعلي: ${inspectionTime}\n${modeTitle}\nــــــــــــــــــــــــــــــــــــــــ\n\n${text}`;
                    setResult(finalReport);
                }

                if (window.speechSynthesis) window.speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = 'ar-SA';
                window.speechSynthesis.speak(utterance);
            } else {
                setResult("⚠️ تعذر استخلاص القرار الهندسي. تأكد من وضوح الصور.");
            }
        } catch (error) {
            setResult("❌ فشل الاتصال بمحرك الفحص الجنائي.");
        } finally {
            setLoading(false);
        }
    };

    // 2️⃣ دالة الاستفسارات المخصصة والمحمية بنطاق العمل
    const askFollowUp = async (question: string) => {
        if (!savedImageParts || !result || !question.trim()) return;

        setChatLoading(true);
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

        setChatHistory((prev) => [...prev, { role: "user", text: question }]);

        // 🛑 البرومبت الخاص بالمحادثة مع توسيع النطاق ليشمل المنظومة بالكامل
        const chatPrompt = `أنت "المستشار الفني" للمنظومة الكهربائية. قمت للتو بإصدار هذا التقرير بناءً على الصورة المرفقة:
        """${result}"""
        
        الفني في الميدان يطرح عليك هذا الاستفسار: "${question}"
        
        🚨 قواعد الرد الصارمة (إلزامي):
        1. يجب أن يكون ردك محصوراً فـقـط في تفاصيل الصورة المرفقة، مكونات العداد، التمديدات الكهربائية، لوحات التوزيع، وأجهزة القياس المرفقة.
        2. إذا كان سؤال الفني يخص موضوعاً خارجاً عن نطاق الشبكات الكهربائية والصورة (مثلاً: سيارات، رياضة، طقس، معلومات عامة)، ارفض الإجابة ورد حرفياً بـ:
        "عذراً، أنا مخصص للرد على الاستفسارات الفنية المتعلقة بالمنظومة الكهربائية والحالة المرفقة فقط."
        3. إذا كان السؤال فنياً، أجب بشكل هندسي مباشر ومختصر جداً بناءً على ما تراه.`;

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

                setChatHistory((prev) => [...prev, { role: "ai", text: aiReply }]);

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

    return { analyzeImage, loading, result, resetAnalysis, askFollowUp, chatHistory, chatLoading };
};