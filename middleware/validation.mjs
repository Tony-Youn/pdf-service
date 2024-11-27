const validatePdfRequest = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      error: "PDF 파일이 필요합니다.",
    });
  }

  const replacements = req.body.replacements;
  if (replacements) {
    try {
      JSON.parse(replacements);
    } catch (error) {
      return res.status(400).json({
        error: "replacements는 유효한 JSON 형식이어야 합니다.",
      });
    }
  }

  next();
};

export { validatePdfRequest };
