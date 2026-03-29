import { describe, expect, it, vi } from "vitest";

vi.mock("../../utils/slidingWindow.ts", () => {
  const mockAllowRequest = vi.fn();
  class mockSlidingWindow {
    allowRequest = mockAllowRequest;
  }

  return {
    SlidingWindow: mockSlidingWindow,
    __mock: mockAllowRequest,
  };
});

const mockReq = (userId: number) => ({ userId }) as any;
const mockRes = () => {
  const send = vi.fn();
  const status = vi.fn().mockImplementation(() => ({ send }));
  /* in the rateLimiter.ts we did res.status.send() 
    now send is linked to the status 
    we are mocking that chain*/
  return {
    res: { status } as any,
    send,
    status,
  };
};

//@ts-ignore
import { SlidingWindow, __mock } from "../../utils/slidingWindow";
import { rateLimiter } from "../../middleware/rateLimiter";

describe("rateLimiter", () => {
  it("returns error if ratelimit exceeded", () => {
    __mock.mockReturnValue(false);

    const { res, status, send } = mockRes();
    const next = vi.fn();

    rateLimiter(mockReq(1), res, next);

    expect(next).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(429);
    expect(send).toHaveBeenCalledWith("Too many requests");
  });

  it("allow request if ratelimit not exceeded", () => {
    __mock.mockReturnValue(true);

    const { res } = mockRes();
    const next = vi.fn();

    rateLimiter(mockReq(1), res, next);

    expect(next).toHaveBeenCalled();
  });
});
