export class fixedWindow{
    private windowSize: number;
    private noOfRequests: number;
    private windowStart: number;
    private requestsLimit: number;
    constructor(windowSize:number,requestsLimit:number){
        this.windowSize = windowSize;
        this.requestsLimit = requestsLimit;
        this.windowStart = Date.now();
        this.noOfRequests = 1;
    }
    allowRequest(){
        const now = Date.now();

        if(now - this.windowStart > this.windowSize * 1000){
            this.noOfRequests = 0;
            this.windowStart = now;
        }else{
            this.noOfRequests = this.noOfRequests + 1;
        }
        if(this.requestsLimit < this.noOfRequests){
            return false;
        }
        return true;
    }
}