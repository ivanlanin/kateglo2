import { describe, it, expect, vi } from 'vitest';

const mockInterceptors = { request: { use: vi.fn() } };
const mockInstance = { mocked: true, interceptors: mockInterceptors };
const mockCreate = vi.fn(() => mockInstance);

vi.mock('axios', () => ({
  default: {
    create: mockCreate,
  },
}));

describe('klien', () => {
  it('membuat instance axios dengan baseURL default dan timeout', async () => {
    const module = await import('../../src/api/klien');
    expect(module.default).toBe(mockInstance);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        timeout: 15000,
      })
    );
    expect(mockInterceptors.request.use).toHaveBeenCalled();
  });
});
