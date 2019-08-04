export class MSList {
    public size: number;
    private xArray: number[];
    private yArray: number[];

    constructor() {
        this.clear();
    }
    clear() {
        this.size = 0;
        this.xArray = [];
        this.yArray = [];
    }

    get(idx): [number, number] {
        if (idx >= this.size) return null;
        return [this.xArray[idx], this.yArray[idx]];
    }
    add(x, y) {
        if (this.xArray.length == this.size) {
            this.xArray.push(x);
            this.yArray.push(y);
        } else {  //length > size
            this.xArray[this.size] = x;
            this.yArray[this.size] = y;
        }
        this.size++;
    }
    remove(idx) {
        this.size--;
        if (this.size == idx) return;
        this.xArray[idx] = this.xArray[this.size];
        this.yArray[idx] = this.yArray[this.size];
    }
}