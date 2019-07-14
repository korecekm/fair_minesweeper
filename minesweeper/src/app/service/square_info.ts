export class SquareInfo {
    public idxX: number;
    public idxY: number;

    public triggered: boolean;
    public pressed: boolean;
    public bomb: boolean;
    public flag: boolean;
    public num: number;

    constructor(x: number, y: number) {
        this.idxX = x;
        this.idxY = y;
        this.triggered = false;
        this.pressed = false;
        this.bomb = false;
        this.flag = false;
    }
}