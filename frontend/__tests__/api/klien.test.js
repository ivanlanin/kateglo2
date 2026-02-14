import { describe, it, expect, vi } from 'vitest';

const mockCreate = vi.fn(() => ({ mocked: true }));

vi.mock('axios', () => ({
  default: {
    create: mockCreate,
  },
}));

describe('klien', () => {
  it('membuat instance axios dengan baseURL default dan timeout', async () => {
    const module = await import('../../src/api/klien');
    expect(module.default).toEqual({ mocked: true });
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        timeout: 15000,
      })
    );
  });
});
