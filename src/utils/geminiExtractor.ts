function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? '');
      const commaIdx = result.indexOf(',');
      resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result);
    };
    reader.onerror = () => reject(new Error('ফাইলটি পড়া যায়নি।'));
    reader.readAsDataURL(file);
  });
}

const VISION_EXTRACTION_PROMPT = `Extract the complete Bengali (and any English) exam question paper text from this document/image accurately.
Rules:
1. If the page has two columns, read the ENTIRE Left Column from top to bottom first, then the ENTIRE Right Column from top to bottom.
2. Preserve header metadata (school name, exam title, subject, class, time, full marks).
3. Preserve all Short Questions (১ to ১৫) and Creative Questions (১ to ৮) with their stems and ক., খ., গ., ঘ. sub-questions.
4. Strip isolated right-margin mark numbers (1, 2, 3, 4 / ১, ২, ৩, ৪) at the ends of sub-questions.
5. Output ONLY the clean plain text of the question paper without markdown formatting or commentary.`;

export async function extractTextWithOptionalGemini(
  file: File,
  apiKey: string,
): Promise<string> {
  const cleanKey = apiKey.trim();
  if (!cleanKey) {
    throw new Error('অনুগ্রহ করে একটি বৈধ Gemini API Key দিন।');
  }

  const base64Data = await fileToBase64(file);
  const mimeType =
    file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/png');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(cleanKey)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Data,
                },
              },
              {
                text: VISION_EXTRACTION_PROMPT,
              },
            ],
          },
        ],
      }),
    },
  );

  if (!response.ok) {
    const errBody = await response.text().catch(() => '');
    throw new Error(
      `Gemini API ত্রুটি (${response.status}): ${errBody.slice(0, 160) || response.statusText}`,
    );
  }

  const json = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };

  const extracted =
    json.candidates?.[0]?.content?.parts
      ?.map((p) => p.text ?? '')
      .join('\n')
      .trim() ?? '';

  if (!extracted) {
    throw new Error('Gemini থেকে কোনো টেক্সট পাওয়া যায়নি।');
  }

  return extracted;
}
