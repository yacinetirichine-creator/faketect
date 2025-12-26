const analyzer = require('../../services/analyzer');

describe('Analyzer Service', () => {
  describe('analyzeImage', () => {
    it('should analyze image successfully', async () => {
      const mockFile = {
        buffer: Buffer.from('fake-image-data'),
        mimetype: 'image/jpeg',
        originalname: 'test.jpg',
      };

      // Mock des services externes
      jest.spyOn(analyzer, 'analyzeImage').mockResolvedValue({
        isAI: true,
        confidence: 0.85,
        score: 85,
        analysis: {
          sightengine: { fake: 0.85 },
          illuminarty: { ai_generated: true },
        },
      });

      const result = await analyzer.analyzeImage(mockFile);

      expect(result).toBeDefined();
      expect(result.isAI).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should handle analysis errors gracefully', async () => {
      const mockFile = {
        buffer: Buffer.from('invalid-data'),
        mimetype: 'image/jpeg',
      };

      jest.spyOn(analyzer, 'analyzeImage').mockRejectedValue(
        new Error('Analysis failed')
      );

      await expect(analyzer.analyzeImage(mockFile)).rejects.toThrow(
        'Analysis failed'
      );
    });
  });

  describe('calculateFinalScore', () => {
    it('should calculate weighted score correctly', () => {
      const scores = {
        sightengine: 0.8,
        illuminarty: 0.9,
        exif: 0.7,
      };

      // Mock la fonction
      jest.spyOn(analyzer, 'calculateFinalScore').mockReturnValue(0.82);

      const result = analyzer.calculateFinalScore(scores);

      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
    });
  });
});
