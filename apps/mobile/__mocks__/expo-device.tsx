export const brand = 'Apple';
export const manufacturer = 'Apple';
export const modelName = 'iPhone15';
export const osName = 'iOS';
export const osVersion = '17.0';
export const platformApiLevel = -1;
export const deviceName = 'Jest Test Device';
export const isDevice = false;
export const modelId = 'iPhone15,1';
export const designName = 'unknown';
export const totalMemory = 4096;
export const deviceType = 1;
export const supportedCpuArchitectures = ['arm64'];
export const osBuildId = 'unknown';
export const osInternalBuildId = 'unknown';
export const deviceYearClass = 2023;
export const maxMemory: number | null = 1024;
export const appName = 'memestar-test';
export const appOwnership: 'expo' | 'standalone' | 'guest' = 'expo';
export const appId = 'com.example.memestar';
export const appVersion = '0.1.0';
export const buildVersion = '0.1.0';
export const applicationName = 'memestar-test';
export const squareCorners: number[] = [];
export const roundedCorners: number[] = [];
export const getDeviceTypeAsync = jest.fn().mockResolvedValue(1);
export const getCompleteDeviceParamsAsync = jest
  .fn()
  .mockResolvedValue({ model: 'iPhone15', brand: 'Apple', totalMemory: 4096 });
export const supportedCpuArchitecturesAsync = jest.fn().mockResolvedValue(['arm64']);
export const getApplicationName = jest.fn().mockReturnValue('memestar-test');
export const getDeviceName = jest.fn().mockResolvedValue('Jest Test Device');
export const getUserInterfaceStyle = jest.fn().mockResolvedValue('light');
export const getMaxMemoryAsync = jest.fn().mockResolvedValue(1024);
export const getPlatform = jest.fn();
export default {
  brand,
  osName,
  osVersion,
  isDevice,
  modelName,
};
