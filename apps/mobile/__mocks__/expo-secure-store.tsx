const mockGetItemAsync = jest.fn();
const mockSetItemAsync = jest.fn();
const mockDeleteItemAsync = jest.fn();

export async function getItemAsync(key: string) {
  return mockGetItemAsync(key);
}

export async function setItemAsync(key: string, value: string) {
  return mockSetItemAsync(key, value);
}

export async function deleteItemAsync(key: string) {
  return mockDeleteItemAsync(key);
}

export { mockGetItemAsync, mockSetItemAsync, mockDeleteItemAsync };

export default {
  getItemAsync: mockGetItemAsync,
  setItemAsync: mockSetItemAsync,
  deleteItemAsync: mockDeleteItemAsync,
};
