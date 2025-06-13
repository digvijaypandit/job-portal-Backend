export const tryGeminiWithRetry = async (fn, retries = 3, delay = 2000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (error.status === 503 && attempt < retries) {
        console.warn(`Gemini API overloaded. Retrying in ${delay}ms... [Attempt ${attempt}]`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      } else {
        throw error;
      }
    }
  }
};
