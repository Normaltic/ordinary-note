import { describe, it, expect, vi, afterEach } from 'vitest';
import { assertNotOption } from './input.js';

describe('assertNotOption', () => {
  const exit = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);

  afterEach(() => exit.mockClear());

  it.each(['- 리스트 항목', '---', '-1도', '본문'])('마크다운 content는 허용: %s', (content) => {
    assertNotOption(content);
    expect(exit).not.toHaveBeenCalled();
  });

  it.each(['--fiel', '-x', '--json'])('옵션처럼 보이면 거부: %s', (content) => {
    assertNotOption(content);
    expect(exit).toHaveBeenCalledWith(1);
  });
});
