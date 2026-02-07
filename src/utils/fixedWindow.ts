export class FixedWindow {
  private windowSize: number;
  private windowStart: number;
  private requestsLimit: number;
  private requests: number[];
  private reqTime: number;
  constructor(windowSize: number, requestsLimit: number) {
    this.windowSize = windowSize;
    this.requestsLimit = requestsLimit;
    this.windowStart = Date.now();
    this.requests = [];
    this.reqTime = 0;
  }
  allowRequest() {
    const now = Date.now();
    this.reqTime = now - this.windowStart;
    while(this.requests.length > 0 && this.requests[0]! < this.reqTime - this.windowSize * 1000){
      this.requests.shift();
    }
    if (this.requests.length >= this.requestsLimit) {
      return false;
    } else{
      this.requests.push(this.reqTime);
    }
    return true;
  }
}
