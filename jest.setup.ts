jest.mock('expo-screen-capture', () => ({
  allowScreenCaptureAsync: jest.fn().mockResolvedValue(undefined),
  preventScreenCaptureAsync: jest.fn().mockResolvedValue(undefined),
}));

