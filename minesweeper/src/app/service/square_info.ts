export class SquareInfo {
    public idxX: number;
    public idxY: number;

    public triggered: boolean;
    public pressed: boolean;
    public bomb: boolean;
    public flag: boolean;
    public num: number;

    //evaluation data:
    public state: SquareInfo.State;
    public evalBomb: boolean;        //docasna hodnota primo pro iterovani moznostmi rozlozeni bomb
    public found: boolean;           //docasna hodnota ciste pro misty potrebne prohledavani (kde je potreba vedet, ktera policka jsme jiz navstivili)
    public eliminated: boolean;      //potreba pro predstavu, kolik bomb uz je odhaleno
    public index: number;            //pouzije se ciste v deleni na subkomponenty
    public subcomponentIdx: number;  // -||-

    constructor(x: number, y: number) {
        this.idxX = x;
        this.idxY = y;
        this.triggered = false;
        this.pressed = false;
        this.bomb = false;
        this.flag = false;
        this.num = 0;
        //evaluation:
        this.state = SquareInfo.State.Any;
        this.evalBomb = false;
        this.eliminated = false;
        this.found = false;
    }
}
export namespace SquareInfo {
    export enum State {
        Safe, Certain, Any
    }
}